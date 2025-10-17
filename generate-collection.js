#!/usr/bin/env node

/**
 * Postman Collection Generator for dev-portal
 *
 * This script generates a Postman collection dynamically during the build process.
 * It includes endpoints for the developer portal API.
 */

const fs = require('fs');
const path = require('path');

// Get configuration from environment variables or use defaults
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:9000';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'Dev Portal API Collection';
const BUILD_NUMBER = process.env.BUILD_NUMBER || 'dev';

// Collection template
const collection = {
    info: {
        _postman_id: generateUUID(),
        name: `${COLLECTION_NAME} - Build ${BUILD_NUMBER}`,
        description: `Automatically generated Postman collection for Developer Portal API testing. Build: ${BUILD_NUMBER}, Generated: ${new Date().toISOString()}`,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: [
        {
            name: "Health Check",
            item: [
                {
                    name: "Health Check",
                    event: [
                        {
                            listen: "test",
                            script: {
                                exec: [
                                    "pm.test(\"Status code is 200\", function () {",
                                    "    pm.response.to.have.status(200);",
                                    "});",
                                    "",
                                    "pm.test(\"Response contains status\", function () {",
                                    "    var jsonData = pm.response.json();",
                                    "    pm.expect(jsonData.status).to.eql('ok');",
                                    "    pm.expect(jsonData).to.have.property('port');",
                                    "});",
                                    "",
                                    "pm.test(\"Response time is less than 500ms\", function () {",
                                    "    pm.expect(pm.response.responseTime).to.be.below(500);",
                                    "});"
                                ],
                                type: "text/javascript"
                            }
                        }
                    ],
                    request: {
                        method: "GET",
                        header: [],
                        url: `${BASE_URL}/health`,
                        description: "Check if the Developer Portal is healthy and running"
                    },
                    response: []
                }
            ]
        },
        {
            name: "Postman Collections",
            item: [
                {
                    name: "Get All Postman Collections",
                    event: [
                        {
                            listen: "test",
                            script: {
                                exec: [
                                    "pm.test(\"Status code is 200\", function () {",
                                    "    pm.response.to.have.status(200);",
                                    "});",
                                    "",
                                    "pm.test(\"Response is an array\", function () {",
                                    "    var jsonData = pm.response.json();",
                                    "    pm.expect(jsonData).to.be.an('array');",
                                    "});",
                                    "",
                                    "pm.test(\"Each collection has filename and data\", function () {",
                                    "    var jsonData = pm.response.json();",
                                    "    if (jsonData.length > 0) {",
                                    "        pm.expect(jsonData[0]).to.have.property('filename');",
                                    "        pm.expect(jsonData[0]).to.have.property('data');",
                                    "        pm.expect(jsonData[0].data).to.have.property('info');",
                                    "    }",
                                    "});",
                                    "",
                                    "pm.test(\"Response time is less than 2000ms\", function () {",
                                    "    pm.expect(pm.response.responseTime).to.be.below(2000);",
                                    "});"
                                ],
                                type: "text/javascript"
                            }
                        }
                    ],
                    request: {
                        method: "GET",
                        header: [],
                        url: `${BASE_URL}/api/postman-collections`,
                        description: "Retrieve all available Postman collections from the portal"
                    },
                    response: []
                }
            ]
        },
        {
            name: "Static Content",
            item: [
                {
                    name: "Get Homepage",
                    event: [
                        {
                            listen: "test",
                            script: {
                                exec: [
                                    "pm.test(\"Status code is 200\", function () {",
                                    "    pm.response.to.have.status(200);",
                                    "});",
                                    "",
                                    "pm.test(\"Response is HTML\", function () {",
                                    "    pm.expect(pm.response.headers.get('Content-Type')).to.include('text/html');",
                                    "});",
                                    "",
                                    "pm.test(\"Response time is less than 1000ms\", function () {",
                                    "    pm.expect(pm.response.responseTime).to.be.below(1000);",
                                    "});"
                                ],
                                type: "text/javascript"
                            }
                        }
                    ],
                    request: {
                        method: "GET",
                        header: [],
                        url: `${BASE_URL}/`,
                        description: "Get the developer portal homepage"
                    },
                    response: []
                }
            ]
        }
    ],
    event: [
        {
            listen: "prerequest",
            script: {
                type: "text/javascript",
                exec: [
                    "console.log('Running request: ' + pm.info.requestName);"
                ]
            }
        },
        {
            listen: "test",
            script: {
                type: "text/javascript",
                exec: [
                    "pm.test(\"Response time is acceptable\", function () {",
                    "    pm.expect(pm.response.responseTime).to.be.below(3000);",
                    "});"
                ]
            }
        }
    ],
    variable: [
        {
            key: "base_url",
            value: BASE_URL,
            type: "string"
        },
        {
            key: "build_number",
            value: BUILD_NUMBER,
            type: "string"
        }
    ]
};

// Helper function to generate UUID
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Output directory
const outputDir = process.env.OUTPUT_DIR || 'build';
const outputFile = path.join(outputDir, 'api-collection.json');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Write the collection to file
fs.writeFileSync(outputFile, JSON.stringify(collection, null, 2));

console.log('========================================');
console.log('Postman Collection Generated Successfully');
console.log('========================================');
console.log(`Collection Name: ${collection.info.name}`);
console.log(`Build Number: ${BUILD_NUMBER}`);
console.log(`Base URL: ${BASE_URL}`);
console.log(`Output File: ${outputFile}`);
console.log('========================================');

// Also create a metadata file
const metadata = {
    generatedAt: new Date().toISOString(),
    buildNumber: BUILD_NUMBER,
    baseUrl: BASE_URL,
    collectionName: COLLECTION_NAME,
    requestCount: collection.item.reduce((count, folder) => count + folder.item.length, 0),
    fileName: outputFile
};

fs.writeFileSync(
    path.join(outputDir, 'collection-metadata.json'),
    JSON.stringify(metadata, null, 2)
);

console.log('Metadata file created: collection-metadata.json');
