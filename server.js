<<<<<<< HEAD
// For Node.js ESM/CommonJS dual compatibility
// This is needed because our package.json specifies "type": "module",
// but we need a CommonJS-compatible entry point for production

// Create a simple express app first to ensure we've got something running
const start = async () => {
  // Dynamic import to work in both CommonJS and ESM environments
  const { default: express } = await import('express');
  const { join } = await import('path');
  const { readdir, existsSync, readdirSync } = await import('fs');
  const { exec } = await import('child_process');
  
  // Create a fallback Express app that will try to load our main app
  // but will serve something no matter what
  const app = express();
  const port = process.env.PORT || 8080;
  
  // Keep track if our main app started
  let mainAppStarted = false;
  
  console.log('Starting Greenlane CRM server');
  console.log('Environment:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    PWD: process.env.PWD,
    PATH: process.env.PATH,
    NODE_PATH: process.env.NODE_PATH,
  });
  console.log('Current directory:', process.cwd());
  
  try {
    console.log('Files in directory:', readdirSync('.'));
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
          pre { background: #f5f5f5; padding: 1rem; overflow: auto; }
          .error { color: #e00; }
          .success { color: #080; }
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
    const staticPath = join(process.cwd(), 'dist', 'public');
    if (existsSync(staticPath)) {
      console.log('Static path exists:', staticPath);
      console.log('Files in static path:', readdirSync(staticPath));
      app.use(express.static(staticPath));
      
      // Serve index.html for client-side routing
      app.get('/', (req, res) => {
        const indexPath = join(staticPath, 'index.html');
        if (existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          console.log('Warning: index.html not found');
          res.send(defaultErrorPage);
        }
      });
    } else {
      console.log('Static path does not exist:', staticPath);
      // Add a default handler for the root
      app.get('/', (req, res) => {
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
              pre { background: #f5f5f5; padding: 1rem; overflow: auto; }
              .error { color: #e00; }
              .success { color: #080; }
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
            <pre>Current directory: ${readdirSync('.').join(', ')}</pre>
            <pre>dist directory: ${existsSync('./dist') ? readdirSync('./dist').join(', ') : 'Not found'}</pre>
            <pre>dist/public directory: ${existsSync('./dist/public') ? readdirSync('./dist/public').join(', ') : 'Not found'}</pre>
            
            <h2>Paths</h2>
            <pre>CWD: ${process.cwd()}</pre>
            <pre>__dirname equivalent: ${new URL('.', import.meta.url).pathname}</pre>
          </body>
        </html>
      `);
    });
  });
  
  // Start the debug server first to ensure we're listening on the port
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
  
  return server;
};

// Start the server
start().catch(error => {
  console.error('Failed to start server:', error);
=======
#!/usr/bin/env node

// This is a special startup script for Cloud Run
// Our main app is an ES module, but we need a way to run it
// with traditional Node.js startup

console.log('Starting Greenlane CRM application');
console.log('Environment: NODE_ENV=', process.env.NODE_ENV);
console.log('Port: PORT=', process.env.PORT);
console.log('Host: HOST=', process.env.HOST);

try {
  // For ESM modules, we need to use dynamic import
  import('./dist/index.js')
    .then(() => {
      console.log('Application started successfully');
    })
    .catch(error => {
      console.error('Error starting application:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('Fatal error importing application:', error);
>>>>>>> 60dfd24 (committ and sync)
  process.exit(1);
}

// Keep the process alive - our server should be started by the imported module
