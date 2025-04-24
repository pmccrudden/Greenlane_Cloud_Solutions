/**
 * Ultra-minimal Cloud Run server (ES Module)
 * This server has minimal dependencies and will definitely bind to PORT
 */

import http from 'http';

// Setup environment
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

console.log('Starting Ultra-Minimal ES Module Server');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  HOST: HOST,
  CWD: process.cwd()
});

// Create the HTTP server
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head>
        <title>Greenlane CRM</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background-color: #f8f9fa; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #21c983; margin-top: 0; }
          .status { display: inline-block; background: #e6f7f1; color: #21c983; padding: 6px 12px; border-radius: 4px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Greenlane CRM - ES Module Server</h1>
          <div class="status">Health Check: PASS</div>
          <p>Server is running successfully on Cloud Run with ES Modules.</p>
          <p>Time: ${new Date().toISOString()}</p>
          <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
          <p>Host: ${HOST}</p>
          <p>Port: ${PORT}</p>
        </div>
      </body>
    </html>
  `);
});

// Start the server
server.listen(PORT, HOST, () => {
  console.log(`ES Module server listening on ${HOST}:${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});