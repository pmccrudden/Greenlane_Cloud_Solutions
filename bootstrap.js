// Ultra-minimal Bootstrap Server for Cloud Run (Simplified Version)
// This version has minimal dependencies and focused on reliability

console.log('BOOTSTRAP: Ultra-minimal server initializing...');
console.log('BOOTSTRAP: PORT=' + process.env.PORT);
console.log('BOOTSTRAP: NODE_ENV=' + process.env.NODE_ENV);

const http = require('http');

// Create the simplest possible server
const server = http.createServer((req, res) => {
  // Handle all requests with a success response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'ok', 
    mode: 'minimal-bootstrap',
    timestamp: new Date().toISOString()
  }));
});

// Start immediately on the specified port
const port = process.env.PORT || 8080;
server.listen(port, '0.0.0.0', () => {
  console.log(`BOOTSTRAP: Minimal server listening on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('BOOTSTRAP: SIGTERM received, shutting down...');
  server.close(() => {
    console.log('BOOTSTRAP: Server closed');
    process.exit(0);
  });
});