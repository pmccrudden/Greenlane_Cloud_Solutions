#!/usr/bin/env node

/**
 * Cloud Run Bootstrap Server
 * This standalone server ensures that:
 * 1. We're listening on PORT immediately (Cloud Run health check requirement)
 * 2. We have graceful error handling if the main app fails
 * 3. We provide debugging endpoints to troubleshoot issues
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// For ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create the app
const app = express();
const port = process.env.PORT || 8080;

// Keep track of main app status
let mainAppStarted = false;

console.log('Starting Greenlane CRM server');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  HOST: process.env.HOST,
});
console.log('Current directory:', process.cwd());

try {
  console.log('Files in directory:', fs.readdirSync('.'));
} catch (error) {
  console.error('Error listing directory:', error);
}

// Default error fallback page for any route
const defaultErrorPage = `
  <html>
    <head>
      <title>Greenlane CRM API Server</title>
      <style>
        body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 2rem; max-width: 800px; margin: 0 auto; }
        pre { background: #f5f5f5; padding: 1rem; overflow: auto; border-radius: 4px; }
        .error { color: #e00; }
        .success { color: #080; }
        h1, h2 { color: #333; }
      </style>
    </head>
    <body>
      <h1>Greenlane CRM Server</h1>
      <p>The server is running in failsafe mode.</p>
      <p>API endpoints may be available at <code>/api/...</code>.</p>
      <p>Visit <a href="/debug">Debug Info</a> for more information.</p>
    </body>
  </html>
`;

// Try to serve static files from our built app
try {
  console.log('Setting up static file serving from dist/public');
  const staticPath = path.join(process.cwd(), 'dist', 'public');
  if (fs.existsSync(staticPath)) {
    console.log('Static path exists:', staticPath);
    console.log('Files in static path:', fs.readdirSync(staticPath));
    app.use(express.static(staticPath));
    
    // Serve index.html for all non-API routes to support client-side routing
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/debug') {
        return next();
      }
      
      const indexPath = path.join(staticPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.log('Warning: index.html not found');
        res.send(defaultErrorPage);
      }
    });
  } else {
    console.log('Static path does not exist:', staticPath);
    // Add a default handler for non-API routes
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path === '/debug') {
        return next();
      }
      res.send(defaultErrorPage);
    });
  }
} catch (error) {
  console.error('Error setting up static files:', error);
}

// Add debug routes
app.get('/debug', (req, res) => {
  exec('env', (error, stdout) => {
    res.send(`
      <html>
        <head>
          <title>Greenlane CRM Debug Info</title>
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 2rem; max-width: 800px; margin: 0 auto; }
            pre { background: #f5f5f5; padding: 1rem; overflow: auto; border-radius: 4px; }
            .error { color: #e00; }
            .success { color: #080; }
            h1, h2 { color: #333; }
          </style>
        </head>
        <body>
          <h1>Greenlane CRM Debug Info</h1>
          
          <h2>Status</h2>
          <p class="${mainAppStarted ? 'success' : 'error'}">
            Main App Started: ${mainAppStarted ? 'Yes' : 'No'}
          </p>
          
          <h2>Environment</h2>
          <pre>${stdout}</pre>
          
          <h2>Files</h2>
          <pre>Current directory: ${fs.readdirSync('.').join(', ')}</pre>
          <pre>dist directory: ${fs.existsSync('./dist') ? fs.readdirSync('./dist').join(', ') : 'Not found'}</pre>
          <pre>dist/public directory: ${fs.existsSync('./dist/public') ? fs.readdirSync('./dist/public').join(', ') : 'Not found'}</pre>
          
          <h2>Paths</h2>
          <pre>CWD: ${process.cwd()}</pre>
          <pre>__dirname: ${__dirname}</pre>
        </body>
      </html>
    `);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', mainAppStarted });
});

// Start the server first to ensure we're listening on the port
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`Server listening on port ${port}`);

  // Now try to load the main app
  try {
    console.log('Attempting to import main application...');
    
    // For ESM modules, we need to use dynamic import
    import('./dist/index.js')
      .then(() => {
        console.log('Main application imported successfully');
        mainAppStarted = true;
      })
      .catch(error => {
        console.error('Error importing main application:', error);
        console.error(error.stack);
      });
  } catch (error) {
    console.error('Fatal error importing application:', error);
    console.error(error.stack);
  }
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});