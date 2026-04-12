import { RATE_LIMITS, CommandType, type RateLimitConfig } from '../config/rate-limits.js';

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private buckets: Map<string, Bucket>;

  constructor() {
    this.buckets = new Map();
  }

  private getBucketKey(userId: string, commandType: CommandType): string {
    return `${userId}:${commandType}`;
  }

  private getBucket(userId: string, commandType: CommandType): Bucket {
    const key = this.getBucketKey(userId, commandType);
    let bucket = this.buckets.get(key);

    if (!bucket) {
      const config = RATE_LIMITS[commandType];
      bucket = {
        tokens: config.maxTokens,
        lastRefill: Date.now(),
      };
      this.buckets.set(key, bucket);
    }

    return bucket;
  }

  private refillBucket(bucket: Bucket, config: RateLimitConfig): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const intervals = Math.floor(elapsed / config.refillIntervalMs);

    if (intervals > 0) {
      const tokensToAdd = intervals * config.refillRate;
      bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  consume(userId: string, commandType: CommandType): boolean {
    const config = RATE_LIMITS[commandType];
    const bucket = this.getBucket(userId, commandType);

    this.refillBucket(bucket, config);

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  getRemainingTokens(userId: string, commandType: CommandType): number {
    const config = RATE_LIMITS[commandType];
    const bucket = this.getBucket(userId, commandType);

    this.refillBucket(bucket, config);

    return bucket.tokens;
  }

  getResetTime(userId: string, commandType: CommandType): number {
    const config = RATE_LIMITS[commandType];
    const bucket = this.getBucket(userId, commandType);

    this.refillBucket(bucket, config);

    if (bucket.tokens >= config.maxTokens) {
      return Date.now();
    }

    const tokensNeeded = config.maxTokens - bucket.tokens;
    const intervalsNeeded = Math.ceil(tokensNeeded / config.refillRate);
    const msUntilRefill = intervalsNeeded * config.refillIntervalMs;

    return bucket.lastRefill + msUntilRefill;
  }
}
