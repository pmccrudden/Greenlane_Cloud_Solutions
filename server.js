/**
 * Production server entrypoint
 * Immediately creates a minimal server for health checks
 * Then loads the compiled application from dist/index.js
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Cloud Run sets this automatically, we should not override it
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

console.log('Starting Greenlane CRM Server');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  HOST: HOST,
  CWD: process.cwd(),
  DIRNAME: __dirname
});

// Create a minimal HTTP server immediately for health checks
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'starting',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (req.url === '/debug') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: PORT,
        HOST: HOST
      },
      cwd: process.cwd(),
      dirname: __dirname
    }));
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head>
        <title>Greenlane CRM</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
          .loader { 
            border: 5px solid #f3f3f3;
            border-top: 5px solid #21c983;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 2s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <h1>Greenlane CRM</h1>
        <div class="loader"></div>
        <p>Application is starting up. Please wait...</p>
      </body>
    </html>
  `);
});

// Start the server immediately
server.listen(PORT, HOST, () => {
  console.log(`Minimal health check server listening on ${HOST}:${PORT}`);
  
  // Now load the full application
  console.log('Loading full application...');
  import('./dist/index.js')
    .then(() => {
      console.log('Application loaded successfully');
      // Application takes over via its own routes
    })
    .catch((error) => {
      console.error('Failed to load application:', error);
      console.error(error.stack);
    });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});