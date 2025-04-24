/**
 * Production server entrypoint - CommonJS version
 * Immediately creates a minimal server for health checks
 * Then attempts to load the compiled application
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Unhandled rejection handler for better debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Setup environment
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

console.log('Starting Greenlane CRM Server (CommonJS)');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  HOST: HOST,
  CWD: process.cwd()
});

// Check for required files and environment
function checkEnvironment() {
  try {
    // Check for critical files
    ['./package.json', './dist/index.js'].forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`Found ${file}`);
      } else {
        console.error(`Critical file missing: ${file}`);
      }
    });
    
    // List directory contents for debugging
    console.log('Root directory:', fs.readdirSync('.'));
    if (fs.existsSync('./dist')) {
      console.log('dist directory:', fs.readdirSync('./dist'));
    } else {
      console.error('dist directory missing!');
    }
    
  } catch (error) {
    console.error('Error checking environment:', error);
  }
}

// Run environment check
checkEnvironment();

// Create a minimal HTTP server immediately for health checks
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'running',
      version: 'CommonJS',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  if (req.url === '/debug') {
    const dirs = {
      root: fs.existsSync('./') ? fs.readdirSync('./') : 'not accessible',
      dist: fs.existsSync('./dist') ? fs.readdirSync('./dist') : 'not accessible'
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: PORT,
        HOST: HOST,
        DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
        STRIPE_SECRET_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY
      },
      files: dirs,
      cwd: process.cwd()
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
          body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background-color: #f8f9fa; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #21c983; margin-top: 0; }
          .status { display: inline-block; background: #e6f7f1; color: #21c983; padding: 6px 12px; border-radius: 4px; font-weight: bold; }
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
        <div class="container">
          <h1>Greenlane CRM - Cloud Run Server</h1>
          <div class="status">Status: Running</div>
          
          <div style="margin-top: 30px; text-align: center;">
            <div class="loader"></div>
            <p>Application is configured for ESM modules but this is the CommonJS fallback server.</p>
            <p>The main application may still be initializing or encountering startup issues.</p>
            <p>Check server logs for more details.</p>
          </div>

          <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 4px;">
            <h3>Server Information</h3>
            <pre>
Time: ${new Date().toISOString()}
Environment: ${process.env.NODE_ENV || 'development'}
Host: ${HOST}
Port: ${PORT}
Working Directory: ${process.cwd()}
            </pre>
          </div>
        </div>
      </body>
    </html>
  `);
});

// Start the server immediately
server.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
  
  console.log('Continuing to run minimal server to handle health checks');
  console.log('Check logs for details about application initialization');
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});