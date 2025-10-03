const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 9000;

// Serve static files
app.use(express.static('public'));
app.use(express.json());

// API endpoint to get postman collections
app.get('/api/postman-collections', (req, res) => {
  const collectionsDir = path.join(__dirname, 'postman-collections');

  if (!fs.existsSync(collectionsDir)) {
    return res.json([]);
  }

  const files = fs.readdirSync(collectionsDir)
    .filter(file => file.endsWith('.json'))
    .map(file => {
      const content = fs.readFileSync(path.join(collectionsDir, file), 'utf8');
      return {
        filename: file,
        data: JSON.parse(content)
      };
    });

  res.json(files);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Dev Portal running on http://localhost:${PORT}`);
});
