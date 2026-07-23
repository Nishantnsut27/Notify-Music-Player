import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/config.js';
import { musicRouter } from './routes/musicRoutes.js';
import { healthLimiter } from './middleware/rateLimit.middleware.js';
import { botProtectionMiddleware } from './middleware/security.middleware.js';
import { errorHandlerMiddleware } from './middleware/error.middleware.js';

const app = express();

app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.allowedOrigins.includes('*') || config.allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy.'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(botProtectionMiddleware);

app.get('/health', healthLimiter, (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Notify Music Player Backend',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/music', musicRouter);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found.'
  });
});

app.use(errorHandlerMiddleware);

app.listen(config.port, () => {
  console.log(`🚀 Notify Music Player Backend running on http://localhost:${config.port}`);
});

export default app;
