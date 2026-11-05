import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDb } from './server/db.js';
import { initCloudPostgres, isCloudPostgresActive } from './server/cloudDb.js';
import { authRouter } from './server/authRoutes.js';
import { dataRouter } from './server/dataRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database tables
initDb();

const app = express();
const port = 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Smart Hisab API',
    version: '2.1.0',
    database: isCloudPostgresActive ? 'cloud-postgresql' : 'sqlite-persistent',
  });
});

// Mount Authentication and Data API routes
app.use('/api/auth', authRouter);
app.use('/api/data', dataRouter);

async function startServer() {
  try {
    // Initialize Cloud PostgreSQL if configured (non-blocking)
    initCloudPostgres().catch((err) => {
      console.warn('[Cloud Database] Deferred init error:', err.message);
    });
  } catch (e) {
    console.warn('[Database] Startup warning:', e);
  }

  if (!isProd) {
    // Development mode: Mount Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[Smart Hisab] Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
