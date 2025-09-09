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
    
    // AGGRESSIVE AUTO-CLEANUP: Every 2 hours 
    setInterval(async () => {
      try {
        console.log('🔥 AGGRESSIVE AUTO-CLEANUP: Starting comprehensive cleanup...');
        
        // 1. Clean temp files
        const tempCleanup = await googleDriveService.cleanupOldTempFiles(6); // More aggressive: 6 hours instead of 24
        console.log(`🗑️ Temp cleanup: ${tempCleanup.cleaned} items cleaned`);
        
        // 2. Smart cleanup of all old permanent files
        const permanentCleanup = await googleDriveService.freeUpSpace(500000000); // Free 500MB regularly
        console.log(`🧹 Smart cleanup: freed ${Math.round(permanentCleanup.spaceFeed / 1024 / 1024)}MB`);
        
        console.log('✅ AGGRESSIVE AUTO-CLEANUP COMPLETED - System stays clean automatically!');
      } catch (error: any) {
        console.log('ℹ️ Auto-cleanup info:', error.message);
      }
    }, 2 * 60 * 60 * 1000); // Every 2 hours

    // Run startup cleanup (after 30 seconds)
    setTimeout(async () => {
      try {
        console.log('🗑️ Running startup cleanup of temporary files...');
        const cleanupResult = await googleDriveService.cleanupOldTempFiles(24); // Files older than 24 hours
        console.log(`✅ Startup cleanup completed: ${cleanupResult.cleaned} items cleaned, ${cleanupResult.errors} errors`);
      } catch (error: any) {
        console.log('ℹ️ Startup cleanup info:', error.message);
      }
    }, 30000); // 30 seconds after startup

    // PROACTIVE MONITORING: More frequent and aggressive
    setInterval(async () => {
      try {
        console.log('🔍 PROACTIVE MONITORING: Checking storage...');
        const storageInfo = await googleDriveService.getStorageInfo();
        
        if (storageInfo.success && !storageInfo.unlimited) {
          const usagePercentage = storageInfo.usagePercentage!;
          
          // More aggressive thresholds
          if (usagePercentage >= 70) { // Lowered from 90% to 70%
            console.log('🚨 PROACTIVE CLEANUP TRIGGERED: Storage at ' + usagePercentage.toFixed(1) + '% - cleaning now!');
            const cleanupResult = await googleDriveService.freeUpSpace(2000000000); // Free 2GB
            console.log(`🧹 Proactive cleanup: ${cleanupResult.spaceFeed ? Math.round(cleanupResult.spaceFeed / 1024 / 1024) : 0}MB freed`);
          }
          // More proactive warning
          else if (usagePercentage >= 50) { // Lowered from 80% to 50%
            console.log('⚠️ PROACTIVE WARNING: Storage at ' + usagePercentage.toFixed(1) + '% - scheduling cleanup');
            // Light cleanup at 50%
            const lightCleanup = await googleDriveService.freeUpSpace(500000000); // Free 500MB
            console.log(`🧹 Light cleanup: ${lightCleanup.spaceFeed ? Math.round(lightCleanup.spaceFeed / 1024 / 1024) : 0}MB freed`);
          }
          // Regular maintenance
          else if (usagePercentage >= 30) {
            console.log('🔄 MAINTENANCE: Storage at ' + usagePercentage.toFixed(1) + '% - routine cleanup');
            // Routine cleanup even at 30%
            const routineCleanup = await googleDriveService.cleanupOldTempFiles(12);
            console.log(`🗑️ Routine cleanup: ${routineCleanup.cleaned} temp items cleaned`);
          }
          else {
            console.log('✅ Storage excellent: ' + usagePercentage.toFixed(1) + '% - system optimized');
          }
        }
      } catch (error: any) {
        console.log('🔍 Monitoring info:', error.message);
      }
    }, 1 * 60 * 60 * 1000); // Every 1 hour

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
