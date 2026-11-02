import mongoose from 'mongoose';
import { config } from './env.js';

let memoryServer = null;

export async function connectDB() {
  try {
    // Attempt standard connection first (10s timeout for cloud handshakes)
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log(`[Database] Connected to MongoDB at ${config.mongodbUri.replace(/\/\/.*@/, '//***@')}`);
  } catch (err) {
    if (config.nodeEnv !== 'production') {
      console.warn(`[Database] Could not connect to ${config.mongodbUri}: ${err.message}`);
      console.log('[Database] Starting in-memory MongoDB for local development/testing...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        await mongoose.connect(memUri);
        console.log(`[Database] Connected to in-memory MongoDB at ${memUri}`);
      } catch (memErr) {
        console.error('[Database] Failed to start in-memory MongoDB:', memErr.message);
        throw err;
      }
    } else {
      console.error('[Database] Production MongoDB connection failed:', err.message);
      throw err;
    }
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

