/**
 * Cloud Run Bootstrap Server (ESM Version)
 * This standalone server ensures that:
 * 1. We're listening on PORT immediately (Cloud Run health check requirement)
 * 2. We have graceful error handling if the main app fails
 * 3. We provide debugging endpoints to troubleshoot issues
 */

// Print startup debugging info
console.log('Starting Greenlane CRM server (ESM Version)');
console.log(`Environment: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}, HOST=${process.env.HOST}`);

// Using ES modules since package.json has "type": "module"
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs';
import express from 'express';
import http from 'http';

// Create a bare-minimum HTTP server first to satisfy Cloud Run health checks
// This ensures we're listening on the port as quickly as possible
console.log('SERVER STARTING - Environment details:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- PORT: ${process.env.PORT}`);
console.log(`- BASE_DOMAIN: ${process.env.BASE_DOMAIN}`);
console.log(`- Current directory: ${process.cwd()}`);
console.log(`- Files in directory: ${fs.readdirSync('.').join(', ')}`);

const port = parseInt(process.env.PORT) || 8080;
const bareServer = http.createServer((req, res) => {
  // Handle both /health and / for health checks since Cloud Run might check either
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      startup: true, 
      timestamp: new Date().toISOString() 
    }));
    return;
  }
  
  if (req.url === '/debug') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        HOST: process.env.HOST,
      },
      cwd: process.cwd(),
      startupTime: new Date().toISOString(),
      nodeVersion: process.version
    }));
    return;
  }
  
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

// Start the bare server immediately
bareServer.listen(port, '0.0.0.0', () => {
  console.log(`Bare server listening on port ${port} (will be replaced by full server)`);
  
  // Now load the main Express application
  startMainServer();
});

async function startMainServer() {
  try {
    // Show files to debug setup
    console.log('Current directory:', process.cwd());
    console.log('Files in directory:', fs.readdirSync('.').join(', '));

    // The application will be served from dist/public
    const staticPath = './dist/public';
    console.log('Setting up static file serving from', staticPath);

    // Check if the static path exists for debugging
    if (fs.existsSync(staticPath)) {
      console.log('Static path exists:', staticPath);
      console.log('Files in static path:', fs.readdirSync(staticPath).join(', '));
    } else {
      console.log('Warning: Static path does not exist:', staticPath);
    }

    // Create main express server
    const app = express();

    // Health check for Cloud Run
    app.get('/health', (req, res) => {
      res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Debug endpoint to show environment and files
    app.get('/debug', (req, res) => {
      try {
        res.json({
          env: {
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            HOST: process.env.HOST,
          },
          cwd: process.cwd(),
          files: fs.readdirSync('.'),
          staticPathExists: fs.existsSync(staticPath),
          staticFiles: fs.existsSync(staticPath) ? fs.readdirSync(staticPath) : null,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Serve static files if they exist
    if (fs.existsSync(staticPath)) {
      console.log('Serving static files from:', staticPath);
      app.use(express.static(staticPath));
    }

    // Add some basic routes
    app.get('/api/status', (req, res) => {
      res.json({
        status: 'ok',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    });
    
    // Route for any other requests - catch-all SPA route
    app.get('*', (req, res) => {
      const indexPath = join(staticPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(resolve(indexPath));
      } else {
        res.send(`
          <html>
            <head>
              <title>Greenlane CRM</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 3rem 1rem; max-width: 800px; margin: 0 auto; color: #333; }
                h1 { color: #21c983; }
                .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(33, 201, 131, 0.3); border-radius: 50%; border-top-color: #21c983; animation: spin 1s ease-in-out infinite; margin-right: 10px; vertical-align: middle; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .card { background: #f9f9f9; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .api { background: #f5f5f5; border-radius: 4px; padding: 0.5rem; font-family: monospace; }
              </style>
            </head>
            <body>
              <h1>Greenlane Cloud Solutions</h1>
              <div class="loading"></div> Server is running successfully!
              
              <div class="card">
                <h2>API Endpoints Available:</h2>
                <ul>
                  <li><span class="api">/health</span> - Health check endpoint</li>
                  <li><span class="api">/debug</span> - Debug information</li>
                  <li><span class="api">/api/status</span> - API status information</li>
                </ul>
              </div>
              
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
      }
    });

    // Create HTTP server from Express
    const mainServer = http.createServer(app);

    // Once we have a listening mainServer, shut down the bareServer
    mainServer.on('listening', () => {
      console.log(`Main server listening on port ${port}`);
      bareServer.close(() => {
        console.log('Bare server closed, request handling transferred to main server');
      });
    });

    // Start the main server on the same port
    mainServer.listen(port, '0.0.0.0');
    
    // Handle shutdown gracefully
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      mainServer.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      mainServer.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
    
    // Now load the main application (in the background)
    try {
      // Check if we're in production (dist/index.js exists) or development
      let modulePath;
      if (fs.existsSync('./dist/index.js')) {
        modulePath = './dist/index.js';
      } else if (fs.existsSync('./server/index.ts')) {
        // In development, we might not have dist/index.js
        console.log('Running in development mode. Using server/index.ts...');
        modulePath = './server/index.ts';
      } else {
        console.log('No main application found. Running standalone bootstrap server.');
        return; // Exit early
      }
      
      console.log('Attempting to import main application:', modulePath);
      import(modulePath)
        .then(() => {
          console.log('Main application imported successfully');
        })
        .catch(err => {
          console.error('Error importing main application:', err);
          console.log('Running standalone bootstrap server without main application.');
        });
    } catch (err) {
      console.error('Failed to import main application:', err);
      console.log('Running standalone bootstrap server without main application.');
    }
  } catch (err) {
    console.error('Fatal error in server startup:', err);
    // We'll keep the bare server running even on error
    console.log('Keeping bare server running to handle requests');
  }
}