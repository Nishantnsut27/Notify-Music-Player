export const config = {
  port: 5000,
  nodeEnv: 'development',
  jiosaavnApiUrl: 'https://saavn.sumit.co',
  jamendoApiUrl: 'https://api.jamendo.com/v3.0',
  jamendoClientId: '2fa42d8a',
  requestTimeoutMs: 8000,
  allowedOrigins: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://notify-music-player.vercel.app'
  ],
  rateLimitSearchWindowMs: 60000,
  rateLimitSearchMax: 30,
  rateLimitMetadataWindowMs: 60000,
  rateLimitMetadataMax: 100,
  slowDownSearchDelayAfter: 15,
  slowDownSearchDelayMs: 500,
  cacheTtlMs: 300000
};
