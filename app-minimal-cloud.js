// Minimal Cloud Run App - Pure CommonJS for maximum compatibility
// This file is specifically designed to be the simplest possible server that
// will satisfy Cloud Run's health checks immediately

// Use CommonJS style requires for maximum compatibility
const http = require('http');
const path = require('path');
const fs = require('fs');

console.log('Minimal Cloud Run Server Starting');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  BASE_DOMAIN: process.env.BASE_DOMAIN
});

// Determine port from environment or use default
const port = process.env.PORT || 8080;

// Create HTTP server with minimal functionality
const server = http.createServer((req, res) => {
  // Log requests for debugging
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Handle health check
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString() 
    }));
    return;
  }
  
  // Debug endpoint
  if (req.url === '/debug') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      env: process.env,
      cwd: process.cwd(),
      files: fs.readdirSync('.'),
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Default response - show basic landing page
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head>
        <title>Greenlane CRM</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 3rem 1rem; max-width: 800px; margin: 0 auto; color: #333; }
          h1 { color: #21c983; }
          .card { background: #f9f9f9; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <h1>Greenlane Cloud Solutions</h1>
        <div class="card">
          <h2>Server Running</h2>
          <p>Deployment successful! The minimal server is running.</p>
          <p>Once DNS is configured, you'll be able to access the full application at:</p>
          <ul>
            <li>Main site: <strong>https://${process.env.BASE_DOMAIN || 'greenlanecloudsolutions.com'}</strong></li>
            <li>App portal: <strong>https://app.${process.env.BASE_DOMAIN || 'greenlanecloudsolutions.com'}</strong></li>
          </ul>
        </div>
        
        <div class="card">
          <h2>Server Information</h2>
          <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
          <p>Server Time: ${new Date().toLocaleString()}</p>
        </div>
      </body>
    </html>
  `);
});

// Start server
server.listen(port, '0.0.0.0', () => {
  console.log(`Minimal server running at http://0.0.0.0:${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down server');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});