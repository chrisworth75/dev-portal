// Global variables object
let envVariables = {};

// Fetch and display API documentation from Postman collections
async function loadAPIDocumentation() {
    try {
        // Load environment variables first
        const envResponse = await fetch('/api/postman-environments');
        envVariables = await envResponse.json();

        const response = await fetch('/api/postman-collections');
        const collections = await response.json();

        const apiDocsDiv = document.getElementById('api-docs');

        if (collections.length === 0) {
            apiDocsDiv.innerHTML = '<p class="text-muted">No API collections found. Run Jenkins to copy Postman collections.</p>';
            return;
        }

        let html = '';

        collections.forEach((collection, collectionIndex) => {
            const collectionData = collection.data;
            html += `<h4 class="collection-title">${collectionData.info.name}</h4>`;

            if (collectionData.info.description) {
                html += `<p class="text-muted">${collectionData.info.description}</p>`;
            }

            html += '<div class="accordion mb-4" id="accordion' + collectionIndex + '">';

            // Function to process items recursively (handles folders)
            function processItems(items, parentIndex = '') {
                items.forEach((item, itemIndex) => {
                    const currentIndex = parentIndex + itemIndex;

                    // Check if this is a folder (has nested items) or a request
                    if (item.item && Array.isArray(item.item)) {
                        // This is a folder - add a header and process nested items
                        html += `<h5 class="mt-3 mb-2 folder-title">${item.name}</h5>`;
                        processItems(item.item, currentIndex + '_');
                    } else if (item.request) {
                        // This is an actual request
                        const request = item.request;
                        const method = request.method;
                        const url = typeof request.url === 'string' ? request.url : getUrlString(request.url);
                        const accordionId = `collapse${collectionIndex}_${currentIndex}`;

                        html += `
                            <div class="accordion-item">
                                <h2 class="accordion-header">
                                    <button class="accordion-button collapsed" type="button"
                                            data-bs-toggle="collapse" data-bs-target="#${accordionId}">
                                        <span class="method-badge method-${method.toLowerCase()}">${method}</span>
                                        <strong>${item.name}</strong>
                                    </button>
                                </h2>
                                <div id="${accordionId}" class="accordion-collapse collapse"
                                     data-bs-parent="#accordion${collectionIndex}">
                                    <div class="accordion-body">
                                        <p><strong>URL:</strong> <code>${url}</code></p>
                        `;

                        // Add headers if present
                        if (request.header && request.header.length > 0) {
                            html += '<p><strong>Headers:</strong></p><ul>';
                            request.header.forEach(header => {
                                html += `<li><code>${header.key}: ${header.value}</code></li>`;
                            });
                            html += '</ul>';
                        }

                        // Add body if present
                        if (request.body && request.body.raw) {
                            html += '<p><strong>Request Body:</strong></p>';
                            html += '<div class="request-body">';
                            try {
                                const formatted = JSON.stringify(JSON.parse(request.body.raw), null, 2);
                                html += `<pre>${escapeHtml(formatted)}</pre>`;
                            } catch {
                                html += `<pre>${escapeHtml(request.body.raw)}</pre>`;
                            }
                            html += '</div>';
                        }

                        // Add Try It button
                        html += `
                            <button class="btn btn-sm btn-primary mt-3" onclick="tryRequest('${method}', '${escapeQuotes(url)}', ${request.body ? `'${escapeQuotes(request.body.raw)}'` : 'null'})">
                                Try it
                            </button>
                        `;

                        html += `
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                });
            }

            // Start processing items
            processItems(collectionData.item);

            html += '</div>';
        });

        apiDocsDiv.innerHTML = html;
    } catch (error) {
        console.error('Error loading API documentation:', error);
        document.getElementById('api-docs').innerHTML =
            '<p class="text-danger">Error loading API documentation</p>';
    }
}

function replaceVariables(str) {
    if (!str || typeof str !== 'string') return str;

    let result = str;
    Object.keys(envVariables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, envVariables[key]);
    });

    return result;
}

function getUrlString(urlObj) {
    if (typeof urlObj === 'string') {
        return replaceVariables(urlObj);
    }

    // Handle raw URL first
    if (urlObj.raw) {
        return replaceVariables(urlObj.raw);
    }

    const protocol = urlObj.protocol || 'http';
    let host = Array.isArray(urlObj.host) ? urlObj.host.join('.') : urlObj.host;
    host = replaceVariables(host);
    const port = urlObj.port ? `:${urlObj.port}` : '';
    const path = Array.isArray(urlObj.path) ? '/' + urlObj.path.join('/') : '';

    return `${protocol}://${host}${port}${path}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeQuotes(text) {
    if (!text) return '';
    return text
        .replace(/\\/g, '\\\\')  // Escape backslashes first
        .replace(/'/g, "\\'")     // Escape single quotes
        .replace(/"/g, '\\"')     // Escape double quotes
        .replace(/\n/g, '\\n')    // Escape newlines
        .replace(/\r/g, '\\r')    // Escape carriage returns
        .replace(/\t/g, '\\t');   // Escape tabs
}

async function tryRequest(method, url, body) {
    try {
        // Replace variables in URL and body
        const resolvedUrl = replaceVariables(url);
        const resolvedBody = body ? replaceVariables(body) : null;

        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (resolvedBody && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = resolvedBody;
        }

        const response = await fetch(resolvedUrl, options);

        // Get response as text first to handle parsing errors
        const responseText = await response.text();

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            alert(`JSON Parse Error:\n${parseError.message}\n\nResponse:\n${responseText.substring(0, 500)}`);
            return;
        }

        // For large responses (arrays with many items), show summary
        let displayData = data;
        let summary = '';

        if (Array.isArray(data) && data.length > 5) {
            summary = `Response contains ${data.length} items. Showing first 3:\n\n`;
            displayData = data.slice(0, 3);
        }

        const jsonString = JSON.stringify(displayData, null, 2);
        alert(`${summary}Response (${response.status}):\n${jsonString}`);
    } catch (error) {
        alert(`Error: ${error.message}\n\nStack: ${error.stack}`);
    }
}

// Health check functionality
const healthCheckAPIs = [];

async function checkAPIHealth(apiId, healthUrl) {
    const indicator = document.getElementById(`health-${apiId}`);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(healthUrl, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            indicator.innerHTML = '<span class="badge bg-success">Healthy</span>';
        } else {
            indicator.innerHTML = '<span class="badge bg-danger">Unhealthy</span>';
        }
    } catch (error) {
        indicator.innerHTML = '<span class="badge bg-danger">Down</span>';
    }
}

function startHealthChecks() {
    // Find all API elements with health check URLs
    const apiElements = document.querySelectorAll('[data-health-url]');

    apiElements.forEach(element => {
        const apiId = element.getAttribute('data-api');
        const healthUrl = element.getAttribute('data-health-url');

        healthCheckAPIs.push({ apiId, healthUrl });

        // Perform initial check immediately
        checkAPIHealth(apiId, healthUrl);
    });

    // Set up interval to check every 10 seconds
    setInterval(() => {
        healthCheckAPIs.forEach(({ apiId, healthUrl }) => {
            checkAPIHealth(apiId, healthUrl);
        });
    }, 10000);
}

// Load documentation and start health checks on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAPIDocumentation();
    startHealthChecks();
});
