import { config, validateEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

function startListening(app, initialPort, maxAttempts = 5) {
  return new Promise((resolve, reject) => {
    let currentPort = initialPort;
    let attempts = 0;

    function tryListen() {
      attempts++;
      const server = app.listen(currentPort, '0.0.0.0', () => {
        console.log(`[Server] AI Mystery Investigation API listening on 0.0.0.0:${currentPort}`);
        console.log(`[Server] Environment: ${config.nodeEnv}`);
        console.log(`[Server] AI Model: ${config.geminiModel} ${config.geminiApiKey ? '(Active)' : '(Procedural Fallback Mode)'}`);
        resolve({ server, port: currentPort });
      });

      server.on('error', err => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`[Server] Port ${currentPort} is already in use${currentPort === 5000 ? ' (reserved by macOS AirPlay/ControlCenter)' : ''}.`);
          if (attempts < maxAttempts) {
            currentPort++;
            console.log(`[Server] Retrying on port ${currentPort}...`);
            tryListen();
          } else {
            reject(new Error(`Unable to bind server after ${maxAttempts} port attempts starting from ${initialPort}.`));
          }
        } else {
          reject(err);
        }
      });
    }

    tryListen();
  });
}

async function bootstrap() {
  try {
    validateEnv();

    const app = createApp();
    // Bind to port immediately so Render / cloud health checks pass without delay
    const { server } = await startListening(app, config.port);

    // Connect to database in the background (handles slow DNS or Atlas handshakes gracefully)
    connectDB().catch(dbErr => {
      console.error('[Database] Asynchronous connection error:', dbErr.message);
    });

    const shutdown = async signal => {
      console.log(`[Server] Received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err) {
    console.error('[Server] Fatal startup failure:', err.message);
    process.exit(1);
  }
}

bootstrap();
