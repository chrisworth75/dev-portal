# Developer Portal

A centralized portal for managing and monitoring all local development microservices and their stacks.

## Features

### 🎯 Stack Management
- **One-Click Stack Control**: Start/stop entire project stacks (all UIs, APIs, and databases) with a single toggle
- **Visual Status Indicators**: Color-coded status dots for instant health visibility
  - 🔴 Red: Service stopped
  - 🟠 Orange (flashing): Service starting/stopping
  - 🟢 Green: Service running
- **Stack Summary Dots**: Main stack dot is green only when ALL services are green, red otherwise

### 📦 Project Stacks
- **Vote**: 4 UI frameworks (Vanilla JS, Vue 3, React 18, Angular 20) + Spring Boot API + PostgreSQL
- **Freg**: Angular + React frontends + Node.js API + PostgreSQL
- **Family Tree**: React frontend + 3 API implementations (Java, Node, Quarkus) + PostgreSQL + SVG service
- **Movies**: 4 frontends (React, Vue, Angular, Wireframe) + Spring Boot API + 2 databases (Movies, IMDB)
- **Fee & Pay (CCPAY)**: Angular frontend + Spring Boot API + PostgreSQL + RabbitMQ + Mock services

### 🔧 Service Controls
- **Individual Service Toggles**: Start/stop services independently with visual feedback
- **Real-time Health Monitoring**: Health checks with auto-refresh every 30 seconds
- **Tab Persistence**: Remembers your active tab across sessions

### 📚 Interactive API Documentation
- Automatically loads Postman collections
- View request methods, URLs, headers, and body examples
- Test API endpoints directly from the browser with "Try it" functionality

## Running Locally

```bash
npm install
npm start
```

The portal will be available at **http://localhost:9000**

## Running with Docker

**IMPORTANT**: The dev-portal requires access to the Docker socket to control other containers.

```bash
docker build -t dev-portal .
docker run -d -p 9000:9000 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --name dev-portal dev-portal
```

### Docker Socket Access
The dev-portal mounts the Docker socket (`/var/run/docker.sock`) to enable:
- Starting/stopping containers via stack and service toggles
- Checking container status for real-time health indicators
- Managing entire project stacks with a single click

## Jenkins Pipeline

The Jenkinsfile includes a special stage that copies Postman collections from source projects:

1. **Copy Postman Collections** - Copies `*.postman_collection.json` files from:
   - `../tree-svg/family-tree-api.postman_collection.json`
   - `../chris-freg-api/tests/postman/fees-api.postman_collection.json`

2. **Build Docker Image** - Builds and pushes to local registry
3. **Deploy** - Deploys to port 9000
4. **Health Check** - Verifies deployment

## Architecture

### Backend (server.js)
- **Express.js** server on port 9000
- **Docker API Integration**: Uses child_process to execute docker commands via mounted socket
- **REST API Endpoints**:
  - `GET /api/service/:serviceId/status` - Check individual service status
  - `POST /api/service/:serviceId/toggle` - Start/stop individual service
  - `GET /api/stack/:stackId/status` - Check all services in a stack
  - `POST /api/stack/:stackId/toggle` - Start/stop entire stack
  - `GET /api/postman-collections` - Load API documentation

### Frontend (public/)
- **Bootstrap 5** - Responsive UI framework
- **Vanilla JavaScript** - No build step required
- **Real-time Updates**: Status checks via fetch API with auto-refresh
- **LocalStorage**: Tab persistence across sessions
- **CSS Animations**: Flashing orange dots for operations in progress

### Status Indicator Logic
- **Individual Service Dots**:
  - Red (stopped) → Orange flashing (starting) → Green (running)
  - Updates via `/api/service/:id/status` endpoint
- **Stack Summary Dot**:
  - Calculated client-side from all service dots
  - Green only if ALL services green, otherwise red

## Port

The portal runs on port **9000**: **http://localhost:9000**

## Recent Updates (2025-11-03)

### Stack Management Feature
- Added one-click stack control toggles for all 5 project stacks
- Implemented individual service status dots with color indicators
- Added stack summary dots that aggregate service statuses
- Configured Docker socket mounting for container control
- Stack toggles use `docker start/stop` commands on existing containers

### Vote Project Integration
- Added all 4 Vote UI frameworks to the portal (Vanilla JS, Vue, React, Angular)
- Individual service toggles for each Vote service
- Status dots for Vote API and Vote DB
- Full Vote stack control (6 services total)
