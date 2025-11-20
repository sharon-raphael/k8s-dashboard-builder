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
    Frontend will start on `http://localhost:5173`

3.  **Access the Dashboard**
    Open your browser to `http://localhost:5173`
