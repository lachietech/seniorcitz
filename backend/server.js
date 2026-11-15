import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { createApp } from './app.js';

dotenv.config();
const PORT = process.env.PORT || 5000;

try {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be set in .env');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('MongoDB connected');
  const server = createServer();
  const app = await createApp({ development: process.argv.includes('--dev'), httpServer: server });
  server.on('request', app);
  server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  const shutdown = async () => {
    await app.locals.close();
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} catch (error) {
  console.error('Server startup failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
}
