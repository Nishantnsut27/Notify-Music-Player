import express from 'express';
import cors from 'cors';
import { config } from './config/config.js';
import { musicRouter } from './routes/musicRoutes.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Notify Music Player Backend',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/music', musicRouter);

// 404 Handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found.'
  });
});

app.listen(config.port, () => {
  console.log(`🚀 Notify Music Player Backend running on http://localhost:${config.port}`);
  console.log(`🎵 Primary Provider: JioSaavn | Fallback Provider: Jamendo`);
});

export default app;
