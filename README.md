# Developer Portal

A centralized portal for accessing all local development applications and API documentation.

## Features

- **Application Links**: Quick access to all locally deployed applications
  - Chris Freg React (http://localhost:4201)
  - Chris Freg Angular (http://localhost:4200)
  - Family Tree React (http://localhost:4202)

- **API Links**: Direct links to all API endpoints
  - Chris Freg API (http://localhost:5100)
  - Family Tree API - Java (http://localhost:8080)
  - Family Tree API - Quarkus (http://localhost:8080)
  - Family Tree API - Node (http://localhost:3000)

- **Interactive API Documentation**: Swagger-style API documentation with "Try it" functionality
  - Automatically loads Postman collections
  - View request methods, URLs, headers, and body examples
  - Test API endpoints directly from the browser

## Running Locally

```bash
npm install
npm start
```

The portal will be available at **http://localhost:9000**

## Running with Docker

```bash
docker build -t dev-portal .
docker run -d -p 9000:9000 --name dev-portal dev-portal
```

## Jenkins Pipeline

The Jenkinsfile includes a special stage that copies Postman collections from source projects:

1. **Copy Postman Collections** - Copies `*.postman_collection.json` files from:
   - `../tree-svg/family-tree-api.postman_collection.json`
   - `../chris-freg-api/tests/postman/fees-api.postman_collection.json`

2. **Build Docker Image** - Builds and pushes to local registry
3. **Deploy** - Deploys to port 9000
4. **Health Check** - Verifies deployment

## Port

The portal runs on port **9000** for easy memorability: **http://localhost:9000**
