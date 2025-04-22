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

// Show files to debug setup
console.log('Current directory:', process.cwd());
const fs = require('fs');
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
const express = require('express');
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
  if (fs.existsSync(staticPath)) {
    console.log('Static path exists, serving files...');
    app.use(express.static(staticPath));
  }

  // Start the server before trying to import the main app
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
    
    // Now import the main application (but don't wait for it)
    console.log('Attempting to import main application...');
    import('./dist/index.js')
      .then(() => {
        console.log('Main application imported successfully');
      })
      .catch(err => {
        console.error('Error importing main application:', err);
      });
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