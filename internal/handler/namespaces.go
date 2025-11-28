package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sharon-raphael/kudabu/internal/k8s"
)

type NamespacesHandler struct {
	k8sService *k8s.Service
}

func NewNamespacesHandler() (*NamespacesHandler, error) {
	svc, err := k8s.NewService()
	if err != nil {
		return nil, err
	}
	return &NamespacesHandler{k8sService: svc}, nil
}

// GetNamespaces handles GET /api/namespaces
func (h *NamespacesHandler) GetNamespaces(c *gin.Context) {
	// Fetch namespaces from Kubernetes
	// We only need the name field
	fields := []string{"metadata.name"}

	data, err := h.k8sService.FetchResources(c.Request.Context(), "v1", "namespaces", "", fields)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch namespaces", "details": err.Error()})
		return
	}

	// Extract namespace names from the data
	namespaces := make([]string, 0, len(data))
	for _, item := range data {
		if name, ok := item["metadata.name"].(string); ok {
			namespaces = append(namespaces, name)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"namespaces": namespaces,
	})
}
