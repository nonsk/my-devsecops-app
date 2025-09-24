const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(`
    <h1>🚀 DevSecOps Pipeline Success! 🚀</h1>
    <p>This application was:</p>
    <ul>
      <li>✅ Built automatically</li>
      <li>✅ Tested with pipeline</li>
      <li>✅ Scanned for security</li>
      <li>✅ Deployed to Kubernetes</li>
    </ul>
    <p><strong>Created by: Sameer Sen</strong></p>
  `);
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

app.listen(port, () => {
  console.log(`App running on port ${port}`);
});
