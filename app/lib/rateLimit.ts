interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}
const cleanupInterval = 1000;
const requestCounts = new Map<string, { count: number; resetTime: number }>();

let _callCount = 0;
function cleanupExpired(now = Date.now()) {
  for (const [key, rec] of requestCounts.entries()) {
    if (now > rec.resetTime) requestCounts.delete(key);
  }
}

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
  } else if (record.count >= maxRequests) {
    afterCheck(now);
    return false;
  } else {
    record.count++;
  }
  afterCheck(now);
  return true;
}

function afterCheck(now: number) {
  _callCount++;
  if (_callCount >= cleanupInterval) {
    cleanupExpired(now);
    _callCount = 0;
  }
}




class RateLimiter {
  private requests = new Map<string, number[]>();
  private callCount = 0;
  private cleanupEvery = cleanupInterval / 1000;  

  constructor(private config: RateLimitConfig) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= this.config.maxRequests) {
      this.afterCheck();
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    this.afterCheck();
    return true;
  }

  private afterCheck() {
    this.callCount++;
    if (this.callCount >= this.cleanupEvery) {
      this.cleanup();
      this.callCount = 0;
    }
  }

  
  private cleanup() {
    const now = Date.now();
    const entries = Array.from(this.requests.entries());
    for (const [key, requests] of entries) {
      const validRequests = requests.filter(time => time > (now - this.config.windowMs));
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

export const apiRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100
});

export const authRateLimit = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10
});

export const webhookRateLimit = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5
});

export function getRateLimitIdentifier(request: Request): string {
  // 1) IP 헤더 우선
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-vercel-forwarded-for');
  if (ip) return ip;

  // 2) Fallback: UA + Accept-Language 등을 묶어 단순 해시(기존 Buffer 방식 유지)
  const ua = request.headers.get('user-agent') ?? '';
  const al = request.headers.get('accept-language') ?? '';
  const seed = `${ua}|${al}|${new URL(request.url).hostname}`;

  const encoded = typeof Buffer !== 'undefined'
    ? Buffer.from(seed).toString('base64')
    : btoa(unescape(encodeURIComponent(seed))); // 브라우저/Edge
  return encoded.slice(0, 16);
}