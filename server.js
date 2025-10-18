const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 9000;

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// API endpoint to get postman collections with environment variables
app.get('/api/postman-collections', (req, res) => {
  const collectionsDir = path.join(__dirname, 'postman-collections');

  if (!fs.existsSync(collectionsDir)) {
    return res.json([]);
  }

  const files = fs.readdirSync(collectionsDir)
    .filter(file => file.endsWith('.json') && !file.endsWith('.postman_environment.json'))
    .map(file => {
      const content = fs.readFileSync(path.join(collectionsDir, file), 'utf8');
      return {
        filename: file,
        data: JSON.parse(content)
      };
    });

  res.json(files);
});

// API endpoint to get postman environment variables
app.get('/api/postman-environments', (req, res) => {
  const collectionsDir = path.join(__dirname, 'postman-collections');

  if (!fs.existsSync(collectionsDir)) {
    return res.json({});
  }

  const envFiles = fs.readdirSync(collectionsDir)
    .filter(file => file.endsWith('.postman_environment.json'));

  const variables = {};

  envFiles.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(collectionsDir, file), 'utf8');
      const env = JSON.parse(content);

      if (env.values && Array.isArray(env.values)) {
        env.values.forEach(v => {
          if (v.enabled !== false) {
            variables[v.key] = v.value;
          }
        });
      }
    } catch (error) {
      console.error(`Error reading environment file ${file}:`, error);
    }
  });

  res.json(variables);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Dev Portal running on http://localhost:${PORT}`);
});
