import { Request, Response, NextFunction } from 'express';

const suspiciousIpViolationMap = new Map<string, number>();

export function botProtectionMiddleware(req: Request, res: Response, next: NextFunction): void {
  const userAgent = req.headers['user-agent'] || '';

  if (!userAgent || userAgent.trim().length === 0) {
    res.status(400).json({
      success: false,
      error: 'Invalid request headers: Missing User-Agent.'
    });
    return;
  }

  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const violations = suspiciousIpViolationMap.get(clientIp) || 0;

  if (violations > 50) {
    res.status(429).json({
      success: false,
      error: 'Excessive abusive requests detected. IP temporarily restricted.'
    });
    return;
  }

  next();
}

export function recordIpViolation(ip: string): void {
  const current = suspiciousIpViolationMap.get(ip) || 0;
  suspiciousIpViolationMap.set(ip, current + 1);

  if (suspiciousIpViolationMap.size > 10000) {
    suspiciousIpViolationMap.clear();
  }
}
