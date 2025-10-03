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

// Load documentation on page load
document.addEventListener('DOMContentLoaded', loadAPIDocumentation);
