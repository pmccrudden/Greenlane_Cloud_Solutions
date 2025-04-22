#!/usr/bin/env node

/**
 * Cloud Run Bootstrap Server
 * This is a special bootstrap server that ensures the application
 * is up and running on port 8080 immediately, even if the main app
 * takes some time to start.
 */

console.log('Starting Greenlane CRM bootstrap server...');
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  HOST: process.env.HOST
});

// Dynamically import modules to ensure compatibility with both CJS and ESM
const startBootstrap = async () => {
  // Import required modules
  const express = await import('express');
  const path = await import('path');
  const fs = await import('fs');
  const { exec } = await import('child_process');
  
  // Create the app
  const app = express.default();
  const port = process.env.PORT || 8080;
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // Serve a simple placeholder page
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Greenlane CRM</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 3rem 1rem; max-width: 500px; margin: 0 auto; color: #333; }
            h1 { color: #21c983; }
            .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(33, 201, 131, 0.3); border-radius: 50%; border-top-color: #21c983; animation: spin 1s ease-in-out infinite; margin-right: 10px; vertical-align: middle; }
            @keyframes spin { to { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <h1>Greenlane CRM</h1>
          <p><div class="loading"></div> Application is starting...</p>
          <p>Please wait while the server initializes all components.</p>
        </body>
      </html>
    `);
  });

  // Start the bootstrap server
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Bootstrap server listening on port ${port}`);
    
    // Import the main application
    console.log('Attempting to start main application...');
    import('./dist/index.js')
      .then(() => {
        console.log('Main application imported successfully');
      })
      .catch(error => {
        console.error('Error starting main application:');
        console.error(error);
      });
  });
};

// Start the bootstrap server
startBootstrap().catch(error => {
  console.error('Failed to start bootstrap server:');
  console.error(error);
  process.exit(1);
});