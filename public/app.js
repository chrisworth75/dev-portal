// Fetch and display API documentation from Postman collections
async function loadAPIDocumentation() {
    try {
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

            collectionData.item.forEach((item, itemIndex) => {
                const request = item.request;
                const method = request.method;
                const url = typeof request.url === 'string' ? request.url : getUrlString(request.url);
                const accordionId = `collapse${collectionIndex}_${itemIndex}`;

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
            });

            html += '</div>';
        });

        apiDocsDiv.innerHTML = html;
    } catch (error) {
        console.error('Error loading API documentation:', error);
        document.getElementById('api-docs').innerHTML =
            '<p class="text-danger">Error loading API documentation</p>';
    }
}

function getUrlString(urlObj) {
    if (typeof urlObj === 'string') return urlObj;

    const protocol = urlObj.protocol || 'http';
    const host = Array.isArray(urlObj.host) ? urlObj.host.join('.') : urlObj.host;
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
    return text.replace(/'/g, "\\'").replace(/"/g, '\\"');
}

async function tryRequest(method, url, body) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = body;
        }

        const response = await fetch(url, options);
        const data = await response.json();

        alert(`Response (${response.status}):\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}

// Health check functionality
async function checkHealth(url) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function updateHealthIndicators() {
    const indicators = document.querySelectorAll('.health-indicator');

    for (const indicator of indicators) {
        const url = indicator.getAttribute('data-url');
        if (url) {
            const isHealthy = await checkHealth(url);

            if (isHealthy) {
                indicator.classList.add('health-green');
                indicator.classList.remove('health-red');
                indicator.innerHTML = `<span class="health-dot">●</span> ${indicator.textContent.trim()}`;
            } else {
                indicator.classList.add('health-red');
                indicator.classList.remove('health-green');
                indicator.innerHTML = `<span class="health-dot">●</span> ${indicator.textContent.trim()}`;
            }
        }
    }
}

// Tab persistence functionality
function saveActiveTab(tabId) {
    localStorage.setItem('activeTab', tabId);
}

function restoreActiveTab() {
    const activeTab = localStorage.getItem('activeTab');
    if (activeTab) {
        const tabElement = document.querySelector(`button[data-bs-target="#${activeTab}"]`);
        if (tabElement) {
            const tab = new bootstrap.Tab(tabElement);
            tab.show();
        }
    }
}

// Load documentation on page load
document.addEventListener('DOMContentLoaded', () => {
    loadAPIDocumentation();
    updateHealthIndicators();

    // Restore active tab
    restoreActiveTab();

    // Save tab when clicked
    const tabs = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', (event) => {
            const target = event.target.getAttribute('data-bs-target');
            if (target) {
                saveActiveTab(target.substring(1)); // Remove the # from target
            }
        });
    });

    // Refresh health indicators every 30 seconds
    setInterval(updateHealthIndicators, 30000);

    // Initialize service toggles
    initializeServiceToggles();

    // Initialize stack toggles
    initializeStackToggles();
});

// Service toggle functionality
async function initializeServiceToggles() {
    const toggles = document.querySelectorAll('.service-toggle');

    for (const toggle of toggles) {
        const serviceId = toggle.getAttribute('data-service-id');
        await updateToggleState(serviceId, toggle);
    }
}

async function updateToggleState(serviceId, toggle) {
    try {
        const response = await fetch(`/api/service/${serviceId}/status`);
        const data = await response.json();
        toggle.checked = data.running;

        // Update visual state
        const container = toggle.closest('.form-check');
        if (data.running) {
            container.classList.add('service-online');
            container.classList.remove('service-offline');
        } else {
            container.classList.add('service-offline');
            container.classList.remove('service-online');
        }

        // Update service status dot
        const serviceDot = document.querySelector(`.service-status-dot[data-service-name="${serviceId}"]`);
        if (serviceDot) {
            serviceDot.classList.remove('stack-status-running', 'stack-status-stopped', 'stack-status-starting');
            if (data.running) {
                serviceDot.classList.add('stack-status-running');
            } else {
                serviceDot.classList.add('stack-status-stopped');
            }
        }

        // Update stack summary dot after all services are checked
        updateStackSummaryDots();
    } catch (error) {
        console.error(`Error checking status for ${serviceId}:`, error);
    }
}

async function toggleService(serviceId, toggle) {
    const container = toggle.closest('.form-check');
    const originalState = toggle.checked;

    // Disable toggle during operation
    toggle.disabled = true;
    container.classList.add('service-loading');

    // Set service dot to flashing orange
    const serviceDot = document.querySelector(`.service-status-dot[data-service-name="${serviceId}"]`);
    if (serviceDot) {
        serviceDot.classList.remove('stack-status-running', 'stack-status-stopped');
        serviceDot.classList.add('stack-status-starting');
    }

    try {
        const response = await fetch(`/api/service/${serviceId}/toggle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            toggle.checked = data.running;

            // Update visual state
            if (data.running) {
                container.classList.add('service-online');
                container.classList.remove('service-offline');
            } else {
                container.classList.add('service-offline');
                container.classList.remove('service-online');
            }

            // Update service dot
            if (serviceDot) {
                serviceDot.classList.remove('stack-status-starting');
                if (data.running) {
                    serviceDot.classList.add('stack-status-running');
                } else {
                    serviceDot.classList.add('stack-status-stopped');
                }
            }

            // Refresh health indicators and stack summary after a short delay
            setTimeout(() => {
                updateHealthIndicators();
                updateStackSummaryDots();
            }, 2000);
        } else {
            // Revert on failure
            toggle.checked = originalState;
            if (serviceDot) {
                serviceDot.classList.remove('stack-status-starting');
                serviceDot.classList.add('stack-status-stopped');
            }
            alert(`Failed to toggle service: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error(`Error toggling service ${serviceId}:`, error);
        toggle.checked = originalState;
        if (serviceDot) {
            serviceDot.classList.remove('stack-status-starting');
            serviceDot.classList.add('stack-status-stopped');
        }
        alert(`Error toggling service: ${error.message}`);
    } finally {
        toggle.disabled = false;
        container.classList.remove('service-loading');
    }
}

// Stack toggle functionality
async function initializeStackToggles() {
    const toggles = document.querySelectorAll('.stack-toggle');

    for (const toggle of toggles) {
        const stackId = toggle.getAttribute('data-stack-id');
        await updateStackToggleState(stackId, toggle);
    }
}

async function updateStackToggleState(stackId, toggle) {
    try {
        const response = await fetch(`/api/stack/${stackId}/status`);
        const data = await response.json();
        toggle.checked = data.running;

        // Update status dot
        const statusDot = document.querySelector(`.stack-status-dot[data-stack-id="${stackId}"]`);
        if (statusDot) {
            updateStackStatusDot(statusDot, data);
        }
    } catch (error) {
        console.error(`Error checking status for ${stackId}:`, error);
    }
}

function updateStackStatusDot(statusDot, statusData) {
    // Remove all status classes
    statusDot.classList.remove('stack-status-starting', 'stack-status-running', 'stack-status-stopped', 'stack-status-partial');

    if (statusData.runningCount === 0) {
        // All stopped - red
        statusDot.classList.add('stack-status-stopped');
    } else if (statusData.runningCount === statusData.totalCount) {
        // All running - green
        statusDot.classList.add('stack-status-running');
    } else {
        // Partially running - yellow
        statusDot.classList.add('stack-status-partial');
    }
}

// Update all stack summary dots based on individual service dots
function updateStackSummaryDots() {
    const stackDots = document.querySelectorAll('.stack-status-dot[data-stack-id]');

    stackDots.forEach(stackDot => {
        const stackId = stackDot.getAttribute('data-stack-id');

        // Find all service dots for this stack
        const stackConfig = getStackConfig(stackId);
        if (!stackConfig) return;

        let allGreen = true;
        stackConfig.containers.forEach(containerName => {
            const serviceDot = document.querySelector(`.service-status-dot[data-service-name="${containerName}"]`);
            if (serviceDot && !serviceDot.classList.contains('stack-status-running')) {
                allGreen = false;
            }
        });

        // Update stack summary dot: green if all services green, otherwise red
        stackDot.classList.remove('stack-status-running', 'stack-status-stopped', 'stack-status-partial');
        if (allGreen) {
            stackDot.classList.add('stack-status-running');
        } else {
            stackDot.classList.add('stack-status-stopped');
        }
    });
}

// Get stack configuration by ID
function getStackConfig(stackId) {
    const stacks = {
        'vote': ['vote-ui', 'vote-ui-vue', 'vote-ui-react', 'vote-ui-angular', 'vote-api', 'vote-db'],
        'freg': ['freg-frontend', 'freg-react-frontend', 'freg-api', 'freg-db'],
        'family-tree': ['family-tree-react-frontend', 'family-tree-api-java', 'family-tree-api-node', 'family-tree-api-quarkus', 'family-tree-db', 'family-tree-svg'],
        'movies': ['movies-react', 'movies-vue', 'movies-angular', 'movies-wireframe', 'movies-api', 'movies-db', 'imdb-db'],
        'feepay': ['ccpay-bubble', 'ccpay-payment-api', 'ccpay-db', 'rse-idam-simulator', 'ccd-api-mock', 's2s-mock', 'rabbitmq']
    };

    return stacks[stackId] ? { containers: stacks[stackId] } : null;
}

async function toggleStack(stackId, toggle) {
    const originalState = toggle.checked;

    // Disable toggle during operation
    toggle.disabled = true;

    // Set status dot to flashing orange (starting)
    const statusDot = document.querySelector(`.stack-status-dot[data-stack-id="${stackId}"]`);
    if (statusDot) {
        statusDot.classList.remove('stack-status-running', 'stack-status-stopped', 'stack-status-partial');
        statusDot.classList.add('stack-status-starting');
    }

    try {
        const response = await fetch(`/api/stack/${stackId}/toggle`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (data.success) {
            toggle.checked = data.running;

            // Update status dot based on final state
            if (statusDot) {
                statusDot.classList.remove('stack-status-starting');
                if (data.running) {
                    statusDot.classList.add('stack-status-running');
                } else {
                    statusDot.classList.add('stack-status-stopped');
                }
            }

            // Refresh health indicators and service toggles after a delay
            setTimeout(() => {
                updateHealthIndicators();
                initializeServiceToggles();
                // Re-check the stack status to update partial states
                updateStackToggleState(stackId, toggle);
            }, 3000);

            // Show success message
            const action = data.running ? 'started' : 'stopped';
            console.log(`${data.message || `Stack ${action}`}`);
        } else {
            // Revert on failure
            toggle.checked = originalState;
            if (statusDot) {
                statusDot.classList.remove('stack-status-starting');
                statusDot.classList.add('stack-status-stopped');
            }
            alert(`Failed to toggle stack: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error(`Error toggling stack ${stackId}:`, error);
        toggle.checked = originalState;
        if (statusDot) {
            statusDot.classList.remove('stack-status-starting');
            statusDot.classList.add('stack-status-stopped');
        }
        alert(`Error toggling stack: ${error.message}`);
    } finally {
        toggle.disabled = false;
    }
}
