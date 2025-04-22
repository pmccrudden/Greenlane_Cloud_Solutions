const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Basic home page
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Greenlane Cloud Solutions</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 3rem 1rem; max-width: 800px; margin: 0 auto; color: #333; }
          h1 { color: #21c983; }
          .card { background: #f9f9f9; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <h1>Greenlane Cloud Solutions</h1>
        <p>Server is running successfully!</p>
        
        <div class="card">
          <h2>Server Information:</h2>
          <ul>
            <li>Environment: ${process.env.NODE_ENV || 'development'}</li>
            <li>Server Started: ${new Date().toLocaleString()}</li>
            <li>Node.js Version: ${process.version}</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Simple server listening on port ${port}`);
});