package k8s

import (
	"context"
	"fmt"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

type Service struct {
	dynamicClient dynamic.Interface
}

func NewService() (*Service, error) {
	config, err := GetConfig()
	if err != nil {
		return nil, err
	}

	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	return &Service{
		dynamicClient: dynamicClient,
	}, nil
}

// FetchResources fetches resources dynamically and extracts fields
// FetchResources fetches resources dynamically and extracts fields
func (s *Service) FetchResources(ctx context.Context, version string, resource string, namespace string, fields []string) ([]map[string]interface{}, error) {
	gv, err := schema.ParseGroupVersion(version)
	if err != nil {
		return nil, fmt.Errorf("invalid version %q: %w", version, err)
	}

	gvr := schema.GroupVersionResource{
		Group:    gv.Group,
		Version:  gv.Version,
		Resource: resource,
	}

	var list *unstructured.UnstructuredList

	if namespace != "" {
		list, err = s.dynamicClient.Resource(gvr).Namespace(namespace).List(ctx, metav1.ListOptions{})
	} else {
		list, err = s.dynamicClient.Resource(gvr).List(ctx, metav1.ListOptions{})
	}

	if err != nil {
		return nil, err
	}

	results := make([]map[string]interface{}, 0, len(list.Items))

	for _, item := range list.Items {
		row := make(map[string]interface{})
		for _, fieldPath := range fields {
			val := extractField(item.Object, fieldPath)
			row[fieldPath] = val
		}
		results = append(results, row)
	}

	return results, nil
}

func extractField(obj map[string]interface{}, path string) string {
	parts := strings.Split(path, ".")
	var current interface{} = obj

	for _, part := range parts {
		if current == nil {
			return ""
		}

		// Handle array index like "containers[0]"
		if idxStart := strings.Index(part, "["); idxStart != -1 && strings.HasSuffix(part, "]") {
			key := part[:idxStart]
			idxStr := part[idxStart+1 : len(part)-1]

			// Move to the array
			if m, ok := current.(map[string]interface{}); ok {
				current = m[key]
			} else {
				return ""
			}

			// Access index
			if slice, ok := current.([]interface{}); ok {
				var idx int
				if _, err := fmt.Sscanf(idxStr, "%d", &idx); err == nil && idx >= 0 && idx < len(slice) {
					current = slice[idx]
				} else {
					return ""
				}
			} else {
				return ""
			}
		} else {
			// Standard map access
			if m, ok := current.(map[string]interface{}); ok {
				current = m[part]
			} else {
				return ""
			}
		}
	}

	if current == nil {
		return ""
	}
	return fmt.Sprintf("%v", current)
}
