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

  // Route for any other requests - catch-all SPA route
  app.get('*', (req, res) => {
    const indexPath = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(path.resolve(indexPath));
    } else {
      res.send('<h1>Application is starting...</h1><p>Please try again in a moment.</p>');
    }
  });

  // Start the server immediately
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
    
    // Now load the main application (after we're already listening)
    try {
      // For CommonJS we use a different approach to dynamically import ES modules
      const { pathToFileURL } = require('url');
      const modulePath = pathToFileURL('./dist/index.js').href;
      
      console.log('Attempting to import main application:', modulePath);
      import(modulePath)
        .then(() => {
          console.log('Main application imported successfully');
        })
        .catch(err => {
          console.error('Error importing main application:', err);
        });
    } catch (err) {
      console.error('Failed to import main application:', err);
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