package main

import (
	"github.com/gin-gonic/gin"
	"github.com/sharon-raphael/k8s-dashboard-builder/internal/handler"
)

func main() {
	r := gin.Default()

	api := r.Group("/api")
	{
		api.GET("/config", handler.GetConfig)
		api.POST("/config", handler.SaveConfig)
	}

	r.Run(":8080")
}
