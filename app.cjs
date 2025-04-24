/**
 * Absolute minimal Cloud Run server (CommonJS)
 * No dependencies, no imports, just a direct HTTP server
 */

const http = require('http');

// Extract the port from environment
const PORT = process.env.PORT || 8080;

// Log startup for diagnostics
console.log(`Starting ultra-basic server on port ${PORT}`);

// Create a basic HTTP server
const server = http.createServer((req, res) => {
  // Log all incoming requests for debugging
  console.log(`Received request: ${req.method} ${req.url}`);
  
  // Set the response headers
  res.writeHead(200, {'Content-Type': 'text/html'});
  
  // Send a simple HTML response
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Greenlane CRM</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          .success { color: green; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Greenlane CRM</h1>
        <p class="success">Server is running!</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
      </body>
    </html>
  `);
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
});

// Handle shutdown signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});