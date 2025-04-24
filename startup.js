/**
 * Cloud Run Startup Script (CommonJS)
 * 
 * This script is specifically designed for Google Cloud Run deployment:
 * 1. It creates a minimal server immediately to satisfy health checks
 * 2. It uses CommonJS syntax for maximum compatibility
 * 3. Once started, it loads the main application
 */

console.log('Starting Greenlane CRM startup script...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  CWD: process.cwd()
});

// Use CommonJS to avoid ES module issues
const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Show current directory contents for debugging
console.log('Files in current directory:', fs.readdirSync('.').join(', '));

// Create a simple HTTP server that responds to all routes
const port = process.env.PORT || 8080;
const host = process.env.HOST || '0.0.0.0';

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
        PORT: process.env.PORT,
        HOST: process.env.HOST,
      },
      cwd: process.cwd(),
      files: fs.readdirSync('.'),
      distExists: fs.existsSync('./dist'),
      distFiles: fs.existsSync('./dist') ? fs.readdirSync('./dist') : []
    }));
    return;
  }

  // For all other routes, show a basic HTML page
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head>
        <title>Greenlane CRM</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
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
server.listen(port, host, () => {
  console.log(`Simple server listening on ${host}:${port}`);
  
  // In production, try to start the main application
  if (process.env.NODE_ENV === 'production') {
    console.log('Attempting to start the main application...');
    
    if (fs.existsSync('./dist/index.js')) {
      // We found the compiled application, so we'll start it
      console.log('Found dist/index.js, starting main application...');
      
      // Use a child process to run the main application
      const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
      const child = exec('node dist/index.js', {
        env: { ...process.env }
      });
      
      child.stdout.on('data', (data) => {
        console.log(`Main app: ${data}`);
      });
      
      child.stderr.on('data', (data) => {
        console.error(`Main app error: ${data}`);
      });
      
      child.on('close', (code) => {
        console.log(`Main application process exited with code ${code}`);
      });
    } else {
      console.error('dist/index.js not found! Main application cannot start.');
      console.log('Available files:', fs.readdirSync('.'));
      if (fs.existsSync('./dist')) {
        console.log('Files in dist:', fs.readdirSync('./dist'));
      }
    }
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});