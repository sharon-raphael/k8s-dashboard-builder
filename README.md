# k8s-dashboard-builder
Build your Kubernetes dashboard from a simple YAML configuration

## Getting Started

### Prerequisites
- Go 1.21+
- Node.js & npm

### Running the Application

1.  **Start the Backend Server**
    ```bash
    go run cmd/server/main.go
    ```
    Server will start on `http://localhost:8080`

2.  **Start the Frontend**
    Open a new terminal:
    ```bash
    cd ui
    npm install
    npm run dev
    ```
    Front-end will start on `http://localhost:5173`

3.  **Access the Dashboard**
    Open `http://localhost:5173` on your browser to access the dashboard.

## Configuration

The dashboard is configured using a YAML file that defines dashboards and their panels. You can edit the configuration through the web UI (Config page) or by modifying the default configuration in `internal/store/store.go`.

### Configuration Structure

```yaml
config:
  dashboards:
    - name: "dashboard-name"
      header: "Dashboard Title"
      panels:
        - type: "table"
          data_source: "kubernetes"
          api: "resource-type"
          version: "api-version"
          namespace: "namespace-name"
          namespace_dropdown_enabled: true
          columns:
            - header: "Column Header"
              field: "field.path"
```

### Dashboard Configuration Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique identifier for the dashboard. Used in the URL and dropdown selection. |
| `header` | string | Yes | Display title shown at the top of the dashboard page. |
| `panels` | array | Yes | List of panel configurations (currently supports one panel per dashboard). |

### Panel Configuration Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Panel type. Currently only `"table"` is supported. |
| `data_source` | string | Yes | Data source type. Currently only `"kubernetes"` is supported. |
| `api` | string | Yes | Kubernetes resource type to query (e.g., `pods`, `nodes`, `deployments`, `services`). |
| `version` | string | Yes | Kubernetes API version for the resource (e.g., `v1`, `apps/v1`, `batch/v1`). |
| `namespace` | string | No | Default namespace to query. Use `""` for cluster-wide resources or all namespaces. |
| `namespace_dropdown_enabled` | boolean | No | If `true`, displays a namespace dropdown that allows filtering data by namespace. Default: `false`. |
| `query` | string | No | Reserved for future use. Currently not implemented. |
| `columns` | array | Yes | List of column definitions for the table. |

### Column Configuration Options

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `header` | string | Yes | Column header text displayed in the table. |
| `field` | string | Yes | JSON path to the field in the Kubernetes resource. Supports nested fields (e.g., `metadata.name`) and array indexing (e.g., `spec.containers[0].image`). |

### Field Path Examples

| Field Path | Description |
|------------|-------------|
| `metadata.name` | Resource name |
| `metadata.namespace` | Resource namespace |
| `metadata.labels.app` | Value of the `app` label |
| `status.phase` | Pod phase (Running, Pending, etc.) |
| `spec.containers[0].image` | Image of the first container |
| `spec.nodeName` | Node where the pod is running |

### Example Configuration

```yaml
config:
  dashboards:
  - name: "pods-info"
    header: "Pods Status Dashboard"
    panels:
    - type: "table"
      data_source: "kubernetes"
      api: pods
      version: v1
      namespace: "default"
      namespace_dropdown_enabled: true
      columns:
      - header: "Name"
        field: "metadata.name"
      - header: "Namespace"
        field: "metadata.namespace"
      - header: "Status"
        field: "status.phase"
      - header: "Image"
        field: "spec.containers[0].image"
  
  - name: "nodes-info"
    header: "Nodes Information Dashboard"
    panels:
    - type: "table"
      data_source: "kubernetes"
      api: nodes
      version: v1
      namespace: ""
      columns:
      - header: "Name"
        field: "metadata.name"
      - header: "Instance Group"
        field: "metadata.labels.instancegroup"
```

## Features

- **Dynamic Dashboard Creation**: Define dashboards using simple YAML configuration
- **Kubernetes Integration**: Query any Kubernetes resource using the dynamic client
- **Namespace Filtering**: Enable namespace dropdown for runtime filtering
- **Dark Mode**: Toggle between light and dark themes
- **Configuration Management**: Edit and save configurations through the web UI
- **Flexible Field Selection**: Extract any field from Kubernetes resources using JSON paths
