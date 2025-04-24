import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { join } from "path";
import fs from "fs";
import { db } from "./db";
import { tenants } from "../shared/schema";
import { eq } from "drizzle-orm";

// Tenant detection middleware
async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  const host = req.hostname;
  const baseDomain = process.env.BASE_DOMAIN || 'greenlanecloudsolutions.com';
  
  // Skip tenant detection for development/preview environments
  if (host.includes('localhost') || 
      host.includes('127.0.0.1') || 
      host.includes('.replit.dev') || 
      host.includes('.repl.co') || 
      host.includes('.run.app')) { // Development, Replit, or Cloud Run URLs
    console.log('Development/preview environment detected, skipping tenant check');
    return next();
  }
  
  // Skip tenant detection for main domains
  if (host === baseDomain || 
      host === `api.${baseDomain}` || 
      host === `app.${baseDomain}` ||
      host === `www.${baseDomain}`) {
    console.log('Main domain detected:', host);
    return next();
  }
  
  // Extract subdomain
  const subdomain = host.replace(`.${baseDomain}`, '');
  
  // Skip for special subdomains
  if (subdomain === 'www' || subdomain === 'app' || subdomain === 'api') {
    return next();
  }
  
  try {
    console.log(`Checking for tenant with subdomain: ${subdomain}`);
    // Find tenant by subdomain
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, subdomain)
    });
    
    if (tenant) {
      // Attach tenant to request
      (req as any).tenant = tenant;
      console.log(`Tenant identified: ${tenant.companyName} (${tenant.id})`);
      
      // Check if tenant is active
      if (!tenant.isActive) {
        return res.status(402).send({
          error: 'Tenant account is suspended',
          message: 'This account has been suspended. Please contact support.'
        });
      }
    } else {
      console.log(`Unknown tenant subdomain: ${subdomain}`);
      return res.status(404).send({
        error: 'Tenant not found',
        message: 'The requested tenant domain does not exist.'
      });
    }
  } catch (error) {
    console.error('Error identifying tenant:', error);
  }
  
  next();
}

// Define the missing functions
function serveStatic(app: express.Express) {
  // First try the standard Vite output directory
  let staticPath = join(process.cwd(), "dist", "public");
  
  // If that doesn't exist, try alternate locations
  if (!fs.existsSync(staticPath)) {
    const altPaths = [
      join(process.cwd(), "dist", "client"),
      join(process.cwd(), "dist"),
      join(process.cwd(), "client", "dist"),
      join(process.cwd(), "public")
    ];
    
    for (const path of altPaths) {
      if (fs.existsSync(path)) {
        staticPath = path;
        break;
      }
    }
  }
  
  console.log('Attempting to serve static files from:', staticPath);
  
  // Check if the static path exists
  if (fs.existsSync(staticPath)) {
    console.log('Static path exists, serving files...');
    
    // Check for the index.html file
    const indexPath = join(staticPath, "index.html");
    if (fs.existsSync(indexPath)) {
      console.log('Found index.html at:', indexPath);
    } else {
      console.warn('Warning: index.html not found in static path');
      // List files in the directory for debugging
      try {
        const files = fs.readdirSync(staticPath);
        console.log('Files in static directory:', files);
      } catch (err) {
        console.error('Error reading static directory:', err);
      }
    }
    
    // Serve static files
    app.use(express.static(staticPath));
    
    // Serve index.html for all non-API routes to support client-side routing
    app.get("*", (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith("/api")) {
        return next();
      }
      
      console.log(`Handling frontend route: ${req.path} for host: ${req.hostname}`);
      
      // Handle tenant subdomains with custom branding
      const tenant = (req as any).tenant;
      if (tenant) {
        console.log(`Serving tenant-specific content for: ${tenant.id}`);
        const indexPath = join(staticPath, "index.html");
        if (fs.existsSync(indexPath)) {
          return res.sendFile(indexPath);
        }
      }
      
      // Serve index.html for client-side routing
      const indexPath = join(staticPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.log('Warning: index.html not found in static path');
        res.status(500).send(`
          <html>
            <head><title>Greenlane CRM - Configuration Error</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #d32f2f;">Greenlane CRM Configuration Error</h1>
              <p>The API server is running, but the frontend files were not found.</p>
              <p>This usually indicates one of the following issues:</p>
              <ul>
                <li>The frontend has not been built yet. Run <code>npm run build</code> locally before deploying.</li>
                <li>The build process did not complete successfully.</li>
                <li>The static files are not being correctly copied to the deployment container.</li>
              </ul>
              <p>Static path being checked: <code>${staticPath}</code></p>
              <p>For more information, please check the server logs.</p>
            </body>
          </html>
        `);
      }
    });
  } else {
    console.warn('Warning: Static path does not exist, serving API only');
    
    // Handle non-API routes with a friendly message
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      
      console.log(`Static route request received: ${req.path} (no static files available)`);
      res.status(500).send(`
        <html>
          <head><title>Greenlane CRM - Configuration Error</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #d32f2f;">Greenlane CRM Configuration Error</h1>
            <p>The API server is running, but the frontend static files directory was not found.</p>
            <p>This indicates that the build process did not complete successfully or the static files are not being copied to the correct location.</p>
            <p>Static path being checked: <code>${staticPath}</code></p>
            <p>For more information, please check the server logs.</p>
          </body>
        </html>
      `);
    });
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register tenant detection middleware
app.use(tenantMiddleware);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // In production, we always serve static files 
  // (The Vite integration is handled differently in development)
  serveStatic(app);

  // Check if this is being run directly or imported (ESM compatible)
  const isDirectRun = process.argv[1]?.endsWith('server/index.ts') || 
                     process.argv[1]?.endsWith('dist/index.js');
  
  // Only start the server if running directly (not imported by bootstrap.js)
  if (isDirectRun) {
    // Use PORT environment variable for Cloud Run compatibility
    const port = process.env.PORT || 5000;
    console.log(`Starting server on port ${port}`);
    
    server.listen(Number(port), "0.0.0.0", () => {
      console.log(`Server listening on port ${port}`);
    });
  } else {
    console.log('Server imported as module - not starting listener (already running via bootstrap)');
  }
})();