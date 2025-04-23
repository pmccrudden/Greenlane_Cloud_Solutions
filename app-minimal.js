// Simplest possible server
const http = require('http');
const port = process.env.PORT || 8080;

console.log('Starting minimal server...');
console.log(`Using port: ${port}`);

// Create a very simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`Received request for: ${req.url}`);
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head>
        <title>Minimal Server</title>
        <style>
          body { font-family: sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #4CAF50; }
        </style>
      </head>
      <body>
        <h1>Minimal Server Running</h1>
        <p>This is a minimal HTTP server running on Node.js.</p>
        <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
        <p>Port: ${port}</p>
        <p>Node Version: ${process.version}</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      </body>
    </html>
  `);
});

// Listen on all interfaces (0.0.0.0)
server.listen(port, '0.0.0.0', () => {
  console.log(`Minimal server listening on port ${port}`);
});

// Add error handler
server.on('error', (error) => {
  console.error('Server error:', error.message);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
  }
});

// Add graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});