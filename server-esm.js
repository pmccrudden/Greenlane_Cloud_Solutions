/**
 * Enhanced ES Module server for Cloud Run
 * Provides detailed diagnostics and error handling
 */

import http from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Enhanced error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log the stack trace
  if (reason instanceof Error) {
    console.error('Stack trace:', reason.stack);
  }
});

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';

console.log('Starting Enhanced ES Module Server');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: PORT,
  HOST: HOST,
  CWD: process.cwd(),
  DIRNAME: __dirname,
  NODE_VERSION: process.version
});

// Print all environment variables for debugging (excluding secrets)
console.log('Full environment variables:');
const safeEnv = { ...process.env };
delete safeEnv.STRIPE_SECRET_KEY;
delete safeEnv.DATABASE_URL;
console.log(safeEnv);

// Function to check for required files and log detailed diagnostics
async function checkEnvironment() {
  try {
    // List directory contents recursively (2 levels)
    console.log('Checking directory contents...');
    const rootFiles = await fs.readdir('.');
    console.log('Root directory:', rootFiles);
    
    // Check for dist directory
    if (rootFiles.includes('dist')) {
      const distFiles = await fs.readdir('./dist');
      console.log('dist directory:', distFiles);
      
      // Check dist/index.js specifically
      if (distFiles.includes('index.js')) {
        try {
          const stats = await fs.stat('./dist/index.js');
          console.log('dist/index.js size:', stats.size, 'bytes');
          
          // Read the first few lines for identification
          const content = await fs.readFile('./dist/index.js', 'utf8');
          const preview = content.slice(0, 100).replace(/\n/g, '\\n');
          console.log('dist/index.js preview:', preview + '...');
        } catch (err) {
          console.error('Error reading dist/index.js:', err);
        }
      } else {
        console.error('dist/index.js file not found in dist directory');
      }
    } else {
      console.error('dist directory not found in root');
    }
    
    // Check for package.json and server files
    for (const file of ['package.json', 'server.js', 'server-esm.js']) {
      try {
        const exists = await fs.access(file).then(() => true).catch(() => false);
        console.log(`${file} ${exists ? 'exists' : 'does not exist'}`);
        
        if (exists) {
          const stats = await fs.stat(file);
          console.log(`${file} size:`, stats.size, 'bytes');
        }
      } catch (err) {
        console.error(`Error checking ${file}:`, err);
      }
    }
    
    // Check if shared directory exists
    if (rootFiles.includes('shared')) {
      const sharedFiles = await fs.readdir('./shared');
      console.log('shared directory:', sharedFiles);
    }
    
    // Check if server directory exists
    if (rootFiles.includes('server')) {
      const serverFiles = await fs.readdir('./server');
      console.log('server directory:', serverFiles);
    }
    
  } catch (error) {
    console.error('Error in environment check:', error);
  }
}

// Create a diagnostic HTTP server
const server = http.createServer(async (req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Check for special marketing headers
  const headers = req.headers;
  const forwardedHost = headers['x-forwarded-host'];
  const showMarketing = headers['x-show-marketing'];
  const forceMarketing = headers['x-force-marketing'];
  
  // Log headers for debugging
  console.log('Request headers:', JSON.stringify(headers));
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'running',
      version: 'enhanced-esm',
      timestamp: new Date().toISOString(),
      node_version: process.version
    }));
    return;
  }
  
  // Handle root path specially
  if (req.url === '/') {
    // Check if this is the main domain
    const host = req.headers.host;
    const baseDomain = process.env.BASE_DOMAIN || 'greenlanecloudsolutions.com';
    const isMainDomain = (host === baseDomain || host === `www.${baseDomain}` || 
                         forwardedHost === baseDomain || forwardedHost === `www.${baseDomain}`);
    
    if (isMainDomain || forceMarketing === 'true' || showMarketing === 'true') {
      console.log('Main domain detected, redirecting to app subdomain');
      
      // Redirect to the app subdomain
      res.writeHead(302, {
        'Location': `https://app.${baseDomain}/`
      });
      res.end();
      return;
    }
    
    // Default status JSON if not the main domain
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'running',
      version: 'enhanced-esm',
      timestamp: new Date().toISOString(),
      node_version: process.version
    }));
    return;
  }
  
  if (req.url === '/debug') {
    try {
      const dirs = {
        root: await fs.readdir('./').catch(() => 'not accessible'),
        dist: await fs.readdir('./dist').catch(() => 'not accessible'),
        server: await fs.readdir('./server').catch(() => 'not accessible'),
        shared: await fs.readdir('./shared').catch(() => 'not accessible')
      };
      
      const packageJson = await fs.readFile('./package.json', 'utf8').catch(() => 'not accessible');
      let packageInfo = 'Error parsing package.json';
      try {
        if (packageJson !== 'not accessible') {
          const parsed = JSON.parse(packageJson);
          packageInfo = {
            name: parsed.name,
            version: parsed.version,
            type: parsed.type,
            dependencies: Object.keys(parsed.dependencies || {}).length,
            scripts: Object.keys(parsed.scripts || {})
          };
        }
      } catch (e) {
        console.error('Error parsing package.json:', e);
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          PORT: PORT,
          HOST: HOST,
          NODE_VERSION: process.version,
          DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
          STRIPE_SECRET_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY
        },
        directories: dirs,
        package: packageInfo,
        cwd: process.cwd(),
        dirname: __dirname
      }, null, 2));
      return;
    } catch (error) {
      console.error('Error handling /debug request:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
      return;
    }
  }

  // No additional checks needed here as the main domain redirect 
  // is already handled above in the root path (/) endpoint handler
  
  // Default response - HTML with more diagnostics
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <html>
      <head>
        <title>Greenlane CRM Enhanced ESM Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 40px; background-color: #f8f9fa; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #21c983; margin-top: 0; }
          .status { display: inline-block; background: #e6f7f1; color: #21c983; padding: 6px 12px; border-radius: 4px; font-weight: bold; }
          pre { background: #f1f3f5; padding: 15px; border-radius: 4px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Greenlane CRM - Enhanced ESM Server</h1>
          <div class="status">Status: Running</div>
          
          <div style="margin-top: 20px;">
            <p>This is the enhanced ES Module diagnostic server for Greenlane CRM.</p>
            <p>Check <a href="/debug">the debug endpoint</a> for detailed system information.</p>
          </div>
          
          <div style="margin-top: 20px;">
            <h2>Server Information</h2>
            <pre>
Time: ${new Date().toISOString()}
Node Version: ${process.version}
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

// Run the environment check before starting the server
await checkEnvironment().catch(err => {
  console.error('Failed to check environment:', err);
});

// Start the server immediately
server.listen(PORT, HOST, () => {
  console.log(`Enhanced ES Module server listening on ${HOST}:${PORT}`);
  
  // Attempt to dynamically load the application (wrapped in try/catch)
  console.log('Attempting to load the full application...');
  
  // Try multiple paths for the application
  const possibleAppPaths = [
    './dist/index.js',
    './dist/server/index.js',
    './server/index.js'
  ];
  
  // Try to build the frontend if it doesn't exist
  const buildFrontend = async () => {
    try {
      console.log('Static files not found, attempting to build frontend...');
      
      // Check if Vite is available
      const viteExists = await fs.access('./node_modules/.bin/vite')
        .then(() => true)
        .catch(() => false);
      
      if (viteExists) {
        console.log('Running: vite build');
        const { exec } = await import('child_process');
        return new Promise((resolve, reject) => {
          exec('node_modules/.bin/vite build', (error, stdout, stderr) => {
            if (error) {
              console.error('Build failed:', error);
              console.error(stderr);
              reject(error);
              return;
            }
            console.log('Build output:', stdout);
            resolve(true);
          });
        });
      } else {
        console.log('Vite not found, cannot build frontend');
        return false;
      }
    } catch (error) {
      console.error('Error building frontend:', error);
      return false;
    }
  };
  
  setTimeout(async () => {
    // Check if frontend is built
    const frontendExists = await fs.access('./dist/public')
      .then(() => true)
      .catch(() => {
        return fs.access('./dist/client')
          .then(() => true)
          .catch(() => {
            return fs.access('./dist/assets')
              .then(() => true)
              .catch(() => false);
          });
      });
    
    if (!frontendExists) {
      await buildFrontend().catch(err => {
        console.error('Failed to build frontend:', err);
      });
    }
    
    // Try loading app from each possible path
    for (const appPath of possibleAppPaths) {
      try {
        console.log(`Trying to load app from: ${appPath}`);
        const appModule = await import(appPath);
        console.log(`Successfully loaded app from: ${appPath}`);
        console.log('Exported properties:', Object.keys(appModule));
        break; // Exit loop if successful
      } catch (error) {
        console.error(`Failed to load app from ${appPath}:`, error.message);
        
        // Log details about the file
        try {
          await fs.access(appPath);
          console.log(`${appPath} file exists but could not be imported`);
          const stats = await fs.stat(appPath);
          console.log('File size:', stats.size, 'bytes');
          
          // Try to read the file to look for syntax errors
          const content = await fs.readFile(appPath, 'utf8');
          const firstLines = content.split('\n').slice(0, 5).join('\n');
          console.log(`First few lines of ${appPath}:`);
          console.log(firstLines);
        } catch (fsError) {
          console.error(`Cannot access ${appPath}:`, fsError.message);
        }
      }
    }
  }, 1000);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});