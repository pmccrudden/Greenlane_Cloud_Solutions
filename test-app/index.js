const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
  console.log('Received request to root');
  res.send('Hello from Greenlane CRM Test!');
});

app.get('/debug', (req, res) => {
  console.log('Received request to /debug');
  const debugInfo = {
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    environment: process.env
  };
  
  res.json(debugInfo);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test app listening on port ${port}`);
});
