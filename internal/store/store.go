package store

import (
	"sync"
)

type ConfigStore struct {
	mu     sync.RWMutex
	config string
}

func NewConfigStore() *ConfigStore {
	defaultConfig := `config:
dashboards:
- name: "Sample Dashboard"
  header: "Sample Dashboard configuration."
  panel
  - type: "table"
    title: "Deployment versions"
    data_source: "kubernetes"
    api: pods
    query: ""
    namespace: ""
    columns:
    - header: "Name"
      field: "metadata.name"
    - header: "Namespace"
      field: "metadata.namespace"
    - header: "Status"
      field: "status.phase"
    - header: "image"
      field: "spec.containers[0].image"`

	return &ConfigStore{
		config: defaultConfig,
	}
}

func (s *ConfigStore) Get() (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.config, nil
}

func (s *ConfigStore) Save(config string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.config = config
	return nil
}
