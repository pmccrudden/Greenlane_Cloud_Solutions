/**
 * Cloud Run Bootstrap Server
 * This standalone server ensures that:
 * 1. We're listening on PORT immediately (Cloud Run health check requirement)
 * 2. We have graceful error handling if the main app fails
 * 3. We provide debugging endpoints to troubleshoot issues
 */

// Print startup debugging info
console.log('Starting Greenlane CRM server');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  HOST: process.env.HOST
});

// Using CommonJS because we're explicitly naming this file .cjs
const fs = require('fs');
const path = require('path');
const express = require('express');

// Show files to debug setup
console.log('Current directory:', process.cwd());
console.log('Files in directory:', fs.readdirSync('.'));

// The application will be served from dist/public
const staticPath = './dist/public';
console.log('Setting up static file serving from', staticPath);

// Check if the static path exists for debugging
if (fs.existsSync(staticPath)) {
  console.log('Static path exists:', staticPath);
  console.log('Files in static path:', fs.readdirSync(staticPath));
} else {
  console.log('Warning: Static path does not exist:', staticPath);
}

// Create a simple express server
const app = express();
const port = process.env.PORT || 8080;

// Health check for Cloud Run
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
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

// Set up routing for static files and API
try {
  // Serve static files if they exist
  if (fs.existsSync(staticPath)) {
    console.log('Static path exists, serving files...');
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
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(path.resolve(indexPath));
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

  // Start the server immediately
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
    
    // Now load the main application (after we're already listening)
    try {
      // For CommonJS we use a different approach to dynamically import ES modules
      const { pathToFileURL } = require('url');
      
      // Check if we're in production (dist/index.js exists) or development
      let modulePath;
      if (fs.existsSync('./dist/index.js')) {
        modulePath = pathToFileURL('./dist/index.js').href;
      } else if (fs.existsSync('./server/index.ts')) {
        // In development, we might not have dist/index.js
        console.log('Running in development mode. Using server/index.ts...');
        modulePath = pathToFileURL('./server/index.ts').href;
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
  });
} catch (err) {
  console.error('Fatal error in server startup:', err);
  // Still try to start a minimal server
  app.get('*', (req, res) => {
    res.status(500).send(`
      <html>
        <body>
          <h1>Server Error</h1>
          <p>The server encountered an error during startup.</p>
          <pre>${err.stack}</pre>
        </body>
      </html>
    `);
  });
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`Emergency server listening on port ${port}`);
  });
}