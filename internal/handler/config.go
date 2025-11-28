package handler

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sharon-raphael/kudabu/internal/store"
	"gopkg.in/yaml.v3"
)

var configStore = store.NewConfigStore()

func GetConfig(c *gin.Context) {
	config, err := configStore.Get()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get config"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"config": config})
}

// SaveConfig handles POST /api/config
func SaveConfig(c *gin.Context) {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unable to read request body"})
		return
	}

	config := string(body)

	// Optional: Validate YAML syntax
	if err := validateYAML(config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid YAML", "details": err.Error()})
		return
	}

	if err := configStore.Save(config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save config"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "saved"})
}

// validateYAML ensures the provided string is valid YAML
func validateYAML(data string) error {
	var tmp any
	return yaml.Unmarshal([]byte(data), &tmp)
}
