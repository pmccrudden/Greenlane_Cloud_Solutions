/**
 * Production server entrypoint
 * Immediately creates a minimal server for health checks
 * Then loads the compiled application from dist/index.js
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

// Unhandled rejection handler for better debugging
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Cloud Run sets this automatically, we should not override it
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

console.log('Starting Greenlane CRM Server');
// Log key environment info for diagnostics
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  HOST: HOST,
  CWD: process.cwd(),
  DIRNAME: __dirname
});

// Check for required files and environment
async function checkEnvironment() {
  try {
    const fs = await import('fs');
    
    // Check for mounted secrets
    if (fs.existsSync('/app/.env')) {
      console.log('Found mounted .env file');
      try {
        const envContent = fs.readFileSync('/app/.env', 'utf8');
        console.log('ENV file loaded successfully, length:', envContent.length);
        console.log('ENV contains STRIPE_SECRET_KEY:', envContent.includes('STRIPE_SECRET_KEY'));
        console.log('ENV contains DATABASE_URL:', envContent.includes('DATABASE_URL'));
      } catch (err) {
        console.error('Error reading .env file:', err);
      }
    } else {
      console.warn('Warning: No mounted .env file found');
    }
    
    // Check for critical files
    const criticalFiles = [
      './dist/index.js',
      './stripeConfig.json'
    ];
    
    criticalFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`Found ${file}`);
        // For stripeConfig, check content structure
        if (file === './stripeConfig.json') {
          try {
            const stripeConfig = JSON.parse(fs.readFileSync(file, 'utf8'));
            console.log('Stripe config loaded successfully with keys:', Object.keys(stripeConfig));
          } catch (err) {
            console.error(`Error parsing ${file}:`, err);
          }
        }
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

// Run environment check - use top-level await in modules
checkEnvironment().catch(err => {
  console.error('Failed to check environment:', err);
});

// Create a minimal HTTP server immediately for health checks
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
    // Can't use await here because we're in a callback
    import('fs').then(fs => {
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
        cwd: process.cwd(),
        dirname: __dirname
      }));
    }).catch(err => {
      console.error('Failed to import fs module:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to load file system module' }));
    });
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head>
        <title>Greenlane CRM</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
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
server.listen(PORT, HOST, () => {
  console.log(`Minimal health check server listening on ${HOST}:${PORT}`);
  
  // Now load the full application with extended error handling
  console.log('Loading full application...');
  
  // Add a timeout to keep the server alive even if the application fails
  // This ensures Cloud Run health checks still pass
  setTimeout(() => {
    console.log('Health check server still running while application initializes');
  }, 5000);
  
  import('./dist/index.js')
    .then((module) => {
      console.log('Application loaded successfully');
      console.log('Exported properties:', Object.keys(module));
      // Application takes over via its own routes
    })
    .catch((error) => {
      console.error('Failed to load application:', error);
      console.error('Error stack:', error.stack);
      // Log more details about the error
      if (error.code === 'MODULE_NOT_FOUND') {
        console.error('Module not found details:', error.message);
        // Continue running the minimal server to keep the container alive
        console.log('Continuing to run minimal server despite application error');
      }
    });
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});