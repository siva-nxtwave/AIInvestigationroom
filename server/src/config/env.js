import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory or root if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mystery_investigation',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
};

export function validateEnv() {
  const missing = [];
  if (config.nodeEnv === 'production') {
    if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
    if (!process.env.GEMINI_API_KEY) {
      console.warn('[Env] GEMINI_API_KEY is not set. Procedural mystery generator will be used.');
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

