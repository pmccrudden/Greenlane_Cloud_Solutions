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
  
  // Skip tenant detection for main domains
  if (host === baseDomain || 
      host === `api.${baseDomain}` || 
      host === `app.${baseDomain}` ||
      host.includes('.run.app')) { // Cloud Run URLs
    return next();
  }
  
  // Extract subdomain
  const subdomain = host.replace(`.${baseDomain}`, '');
  
  // Skip for special subdomains
  if (subdomain === 'www' || subdomain === 'app' || subdomain === 'api') {
    return next();
  }
  
  try {
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
  const staticPath = join(process.cwd(), "dist", "public");
  console.log('Serving static files from:', staticPath);
  
  // Check if the static path exists
  if (fs.existsSync(staticPath)) {
    console.log('Static path exists, serving files...');
    app.use(express.static(staticPath));
    
    // Serve index.html for all non-API routes to support client-side routing
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      
      // Handle tenant subdomains with custom branding
      const tenant = (req as any).tenant;
      if (tenant) {
        const indexPath = join(staticPath, "index.html");
        if (fs.existsSync(indexPath)) {
          // You could customize the HTML here based on tenant
          // For now, we'll just send the standard index.html
          return res.sendFile(indexPath);
        }
      }
      
      const indexPath = join(staticPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.log('Warning: index.html not found in static path');
        res.send(`
          <html>
            <head><title>Greenlane CRM API Server</title></head>
            <body>
              <h1>Greenlane CRM API Server</h1>
              <p>The API server is running, but the frontend has not been built yet.</p>
              <p>Please run <code>npm run build</code> to build the frontend.</p>
            </body>
          </html>
        `);
      }
    });
  } else {
    console.log('Warning: Static path does not exist, serving API only');
    
    // Handle non-API routes with a friendly message
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      
      res.send(`
        <html>
          <head><title>Greenlane CRM API Server</title></head>
          <body>
            <h1>Greenlane CRM API Server</h1>
            <p>The API server is running, but the frontend has not been built yet.</p>
            <p>Please run <code>npm run build</code> to build the frontend.</p>
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