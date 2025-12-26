import express from 'express';
import { createServer } from 'http';
import { errorHandler, notFound } from './middleware/error.js';
import { setupVite, serveStatic, log } from '../server/vite.js';

// Legacy compatibility - import old massive routes file
import legacyRegisterRoutes from './routes/legacy-compat.js';

const app = express();

// Increase payload size for PDFs
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Manual CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (req.path.startsWith('/api')) {
            log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
        }
    });
    next();
});

(async () => {
    // Create HTTP server first
    const httpServer = createServer(app);

    // Setup Vite BEFORE legacy routes (so it can catch frontend requests)
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        await setupVite(app, httpServer);
        console.log('✅ Vite development server ready');
    } else {
        serveStatic(app);
    }

    // Health check (before legacy routes)
    app.get('/health', (req, res) => {
        res.json({ status: 'healthy', message: '✅ Server V2 with legacy compat' });
    });

    // Register ALL old routes (this will add WebSocket to the httpServer)
    await legacyRegisterRoutes(app);
    console.log('✅ Legacy API routes loaded');

    // Error handlers LAST
    app.use(notFound);
    app.use(errorHandler);

    const PORT = process.env.PORT || 5000;

    httpServer.listen(PORT, () => {
        console.log(`\n🚀 Server V2 running on port ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
        console.log(`✅ Full frontend + 100+ API endpoints ready\n`);
    });
})();

export default app;
