import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { googleDriveService } from "./google-drive-service";

const app = express();
// Increase payload size limit to handle large PDF files (50MB limit)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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

      log(logLine);
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

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Schedule automatic cleanup of temporary files every 6 hours
    setInterval(async () => {
      try {
        console.log('🗑️ Starting scheduled cleanup of temporary files...');
        const cleanupResult = await googleDriveService.cleanupOldTempFiles(24); // Files older than 24 hours
        
        if (cleanupResult.cleaned > 0 || cleanupResult.errors === 0) {
          console.log(`✅ Scheduled cleanup completed: ${cleanupResult.cleaned} items cleaned, ${cleanupResult.errors} errors`);
        } else {
          console.log(`ℹ️ Scheduled cleanup: ${cleanupResult.cleaned} items cleaned, ${cleanupResult.errors} errors`);
        }
      } catch (error: any) {
        console.log('ℹ️ Scheduled cleanup info:', error.message);
      }
    }, 6 * 60 * 60 * 1000); // Every 6 hours

    // Run cleanup on startup (after 30 seconds)
    setTimeout(async () => {
      try {
        console.log('🗑️ Running startup cleanup of temporary files...');
        const cleanupResult = await googleDriveService.cleanupOldTempFiles(24);
        
        if (cleanupResult.cleaned > 0 || cleanupResult.errors === 0) {
          console.log(`✅ Startup cleanup completed: ${cleanupResult.cleaned} items cleaned, ${cleanupResult.errors} errors`);
        } else {
          console.log(`ℹ️ Startup cleanup: ${cleanupResult.cleaned} items cleaned, ${cleanupResult.errors} errors`);
        }
      } catch (error: any) {
        console.log('ℹ️ Startup cleanup info:', error.message);
      }
    }, 30000); // 30 seconds after startup
  });
})();
