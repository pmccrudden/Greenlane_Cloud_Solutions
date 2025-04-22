import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { join } from "path";

// Define the missing functions
function serveStatic(app: express.Express) {
  const staticPath = join(process.cwd(), "dist", "public");
  console.log('Serving static files from:', staticPath);
  app.use(express.static(staticPath));
  
  // Serve index.html for all non-API routes to support client-side routing
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(join(staticPath, "index.html"));
  });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

  // Use PORT environment variable for Cloud Run compatibility
  const port = process.env.PORT || 5000;
  console.log(`Starting server on port ${port}`);
  
  server.listen(Number(port), "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
  });
})();