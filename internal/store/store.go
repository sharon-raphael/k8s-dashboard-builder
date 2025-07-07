package store

import (
	"errors"
	"sync"
)

type ConfigStore struct {
	mu     sync.RWMutex
	config string
}

func NewConfigStore() *ConfigStore {
	return &ConfigStore{}
}

func (s *ConfigStore) Get() (string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.config == "" {
		return "", errors.New("no config found")
	}
	return s.config, nil
}

func (s *ConfigStore) Save(config string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.config = config
	return nil
}
