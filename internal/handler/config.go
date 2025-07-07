package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sharon-raphael/k8s-dashboard-builder/internal/store"
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

func SaveConfig(c *gin.Context) {
	var req struct {
		Config string `json:"config" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	if err := configStore.Save(req.Config); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save config"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Config saved"})
}
