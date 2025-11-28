package k8s

import (
	"os"
	"path/filepath"
	"strings"

	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

func GetConfig() (*rest.Config, error) {
	// Try in-cluster config first
	config, err := rest.InClusterConfig()
	if err != nil {
		// Fallback to local kubeconfig (for development)
		kubeconfig := filepath.Join(os.Getenv("HOME"), ".kube", "config")
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return nil, err
		}
	}

	// If running in Docker (and not in-cluster), we might need to patch localhost to host.docker.internal
	// to access the host's kind/minikube cluster.
	if os.Getenv("RUNNING_IN_DOCKER") == "true" {
		// Simple replacement for common localhost variations
		// Note: This is a heuristic.
		if strings.Contains(config.Host, "127.0.0.1") || strings.Contains(config.Host, "localhost") {
			config.Host = strings.Replace(config.Host, "127.0.0.1", "host.docker.internal", 1)
			config.Host = strings.Replace(config.Host, "localhost", "host.docker.internal", 1)
			// We might also need to disable TLS verification if the cert is for localhost
			config.TLSClientConfig.Insecure = true
			config.TLSClientConfig.CAData = nil
			config.TLSClientConfig.CAFile = ""
		}
	}

	return config, nil
}

func NewClientset() (*kubernetes.Clientset, error) {
	config, err := GetConfig()
	if err != nil {
		return nil, err
	}

	return kubernetes.NewForConfig(config)
}
