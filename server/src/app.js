import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import caseRoutes from './routes/caseRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Secure headers
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // Allowed CORS origins (supports comma-separated list and Vercel domains)
  const configuredOrigins = (config.clientOrigin || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const allowedOrigins = [
    ...configuredOrigins,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://aiinvestigationroom.karthikeyantech.in',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        // or allowed origins, or any *.vercel.app, or karthikeyantech.in
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('karthikeyantech.in') ||
          config.nodeEnv === 'development'
        ) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parser with 100kb limit
  app.use(express.json({ limit: '100kb' }));

  // Request logger (in dev/production, omit in test)
  if (config.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Health endpoint (Section 7.8)
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // API routes
  app.use('/api', caseRoutes);

  // Static production assets from client/dist if built (for monolithic deployments)
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  // 404 & error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
