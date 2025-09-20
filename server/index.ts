import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { googleDriveService } from "./google-drive-service";

// إعداد متغيرات البيئة للأمان
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'atbaali-production-secret-jwt-key-2025-secure-' + Math.random().toString(36).substring(2, 15);
  console.log('🔑 JWT_SECRET environment variable generated automatically');
}

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
    
    // AUTO-CLEANUP DISABLED - Manual control only
    console.log('🎮 Manual control mode: All cleanup requires manual API calls');

    // MONITORING ONLY - No automatic cleanup
    setInterval(async () => {
      try {
        console.log('📊 Storage monitoring only (manual control mode)...');
        const storageInfo = await googleDriveService.getStorageInfo();
        
        if (storageInfo.success && !storageInfo.unlimited) {
          const usagePercentage = storageInfo.usagePercentage!;
          
          // Only alerts - no automatic action
          if (usagePercentage >= 90) {
            console.log('🚨 CRITICAL: Storage at ' + usagePercentage.toFixed(1) + '% - manual cleanup recommended');
          } else if (usagePercentage >= 70) {
            console.log('⚠️ WARNING: Storage at ' + usagePercentage.toFixed(1) + '% - consider cleanup');
          } else {
            console.log('✅ Storage healthy: ' + usagePercentage.toFixed(1) + '%');
          }
        }
      } catch (error: any) {
        console.log('📊 Monitoring info:', error.message);
      }
    }, 2 * 60 * 60 * 1000); // Every 2 hours - monitoring only

    // Initial storage check (after 1 minute)
    setTimeout(async () => {
      try {
        console.log('📊 Initial storage check...');
        const storageInfo = await googleDriveService.getStorageInfo();
        
        if (storageInfo.success) {
          if (storageInfo.unlimited) {
            console.log('✅ Storage: Unlimited quota detected');
          } else {
            console.log(`📊 Storage: ${storageInfo.usagePercentage!.toFixed(1)}% used (${storageInfo.formattedUsed} / ${storageInfo.formattedLimit})`);
          }
        }
      } catch (error: any) {
        console.log('📊 Initial storage check info:', error.message);
      }
    }, 60000); // 1 minute after startup
  });
})();
