package handler

import (
	"fmt"
	"net/http"
	"regexp"

	"github.com/gin-gonic/gin"
	"github.com/sharon-raphael/kudabu/internal/k8s"
	"gopkg.in/yaml.v3"
)

type DashboardHandler struct {
	k8sService *k8s.Service
}

func NewDashboardHandler() (*DashboardHandler, error) {
	svc, err := k8s.NewService()
	if err != nil {
		return nil, err
	}
	return &DashboardHandler{k8sService: svc}, nil
}

// GetDashboardData handles GET /api/dashboard/:name
func (h *DashboardHandler) GetDashboardData(c *gin.Context) {
	dashboardName := c.Param("name")
	if dashboardName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "dashboard name is required"})
		return
	}

	// 1. Get Config
	cfgStr, err := configStore.Get()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get config"})
		return
	}

	// 2. Parse Config to find dashboard definition
	// We define a minimal struct to parse just what we need
	type Processor struct {
		Regex string `yaml:"regex" json:"regex"`
	}
	type Column struct {
		Header     string      `yaml:"header" json:"header"`
		Field      string      `yaml:"field" json:"field"`
		Processors []Processor `yaml:"processors" json:"processors"`
	}
	type Panel struct {
		Type                     string   `yaml:"type"`
		DataSource               string   `yaml:"data_source"`
		API                      string   `yaml:"api"`
		Version                  string   `yaml:"version"`
		Namespace                string   `yaml:"namespace"`
		NamespaceDropdownEnabled bool     `yaml:"namespace_dropdown_enabled" json:"namespace_dropdown_enabled"`
		Columns                  []Column `yaml:"columns"`
	}
	type Dashboard struct {
		Name   string  `yaml:"name"`
		Header string  `yaml:"header"`
		Panels []Panel `yaml:"panels"`
	}
	type Config struct {
		Config struct {
			Dashboards []Dashboard `yaml:"dashboards"`
		} `yaml:"config"`
	}

	var config Config
	if err := yaml.Unmarshal([]byte(cfgStr), &config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to parse config"})
		return
	}

	var selectedDashboard *Dashboard
	for _, d := range config.Config.Dashboards {
		if d.Name == dashboardName {
			selectedDashboard = &d
			break
		}
	}

	if selectedDashboard == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "dashboard not found"})
		return
	}

	// 3. Execute Query (Assuming single panel for now as per requirements implication)
	if len(selectedDashboard.Panels) == 0 {
		c.JSON(http.StatusOK, gin.H{"data": []interface{}{}, "columns": []interface{}{}})
		return
	}

	panel := selectedDashboard.Panels[0] // Just take the first one for now

	fields := make([]string, len(panel.Columns))
	for i, col := range panel.Columns {
		fields[i] = col.Field
	}

	// Check if namespace is provided as query parameter
	namespace := c.Query("namespace")
	if namespace == "" {
		namespace = panel.Namespace
	}

	data, err := h.k8sService.FetchResources(c.Request.Context(), panel.Version, panel.API, namespace, fields)
	if err != nil {
		fmt.Printf("Error fetching k8s data: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch k8s data", "details": err.Error()})
		return
	}

	// 4. Apply Processors
	for _, row := range data {
		for _, col := range panel.Columns {
			if len(col.Processors) > 0 {
				val, ok := row[col.Field]
				if !ok {
					continue
				}
				strVal := fmt.Sprintf("%v", val)

				for _, p := range col.Processors {
					if p.Regex != "" {
						re, err := regexp.Compile(p.Regex)
						if err != nil {
							fmt.Printf("Invalid regex %q for column %q: %v\n", p.Regex, col.Header, err)
							continue
						}
						matches := re.FindStringSubmatch(strVal)
						if len(matches) > 1 {
							strVal = matches[1]
						} else if len(matches) > 0 {
							strVal = matches[0]
						}
					}
				}
				row[col.Field] = strVal
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"columns":                    panel.Columns,
		"data":                       data,
		"namespace_dropdown_enabled": panel.NamespaceDropdownEnabled,
		"default_namespace":          panel.Namespace,
	})
}
