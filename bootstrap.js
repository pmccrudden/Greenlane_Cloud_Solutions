// Ultra-minimal Bootstrap Server for Cloud Run
// This is a minimal CommonJS script (not ESM) for the fastest possible startup
// It immediately binds to the port and then launches the real server

console.log('BOOTSTRAP: Minimal server initializing...');
console.log('BOOTSTRAP: PORT=' + process.env.PORT);
console.log('BOOTSTRAP: NODE_ENV=' + process.env.NODE_ENV);

const http = require('http');
const { spawn } = require('child_process');

// Create the simplest possible server
const server = http.createServer((req, res) => {
  console.log('BOOTSTRAP: Received request to ' + req.url);
  
  // Handle health checks
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      mode: 'bootstrap',
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Handle any other request
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head>
        <title>Starting Greenlane CRM...</title>
        <style>
          body { font-family: sans-serif; text-align: center; padding-top: 50px; }
          .spinner { display: inline-block; width: 50px; height: 50px; border: 3px solid rgba(33, 201, 131, 0.3); border-radius: 50%; border-top-color: #21c983; animation: spin 1s ease-in-out infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="spinner"></div>
        <h2>Starting Greenlane CRM...</h2>
        <p>Please wait while the application initializes.</p>
      </body>
    </html>
  `);
});

// Start immediately on the specified port
const port = process.env.PORT || 8080;
server.listen(port, '0.0.0.0', () => {
  console.log(`BOOTSTRAP: Minimal server listening on port ${port}`);
  console.log('BOOTSTRAP: Starting main server (server-esm.js)...');
  
  // Start the real server as a child process
  const mainServer = spawn('node', ['server-esm.js'], { 
    stdio: 'inherit',
    env: process.env
  });
  
  // Handle errors with the main server
  mainServer.on('error', (err) => {
    console.error('BOOTSTRAP: Failed to start main server:', err);
  });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('BOOTSTRAP: SIGTERM received, shutting down...');
  server.close(() => {
    console.log('BOOTSTRAP: Server closed');
    process.exit(0);
  });
});