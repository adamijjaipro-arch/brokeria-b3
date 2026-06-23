import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface CacheEntry {
  value: string;
  expiresAt?: number;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis | null;
  private readonly logger = new Logger(RedisService.name);
  private readonly memoryCache = new Map<string, CacheEntry>();
  private isRedisConnected = false;

  constructor(private config: ConfigService) {
    const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    const nodeEnv = this.config.get<string>('NODE_ENV') ?? 'development';

    try {
      this.client = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > 5) {
            this.logger.warn('Redis: Maximum retries exceeded, falling back to memory cache');
            return null;
          }
          return Math.min(times * 50, 2000);
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.client.on('error', (err) => {
        this.isRedisConnected = false;
        this.logger.warn(`Redis connection error: ${err.message} (falling back to memory cache)`);
      });

      this.client.on('connect', () => {
        this.isRedisConnected = true;
        this.logger.log('✓ Redis connected');
      });

      this.client.on('close', () => {
        this.isRedisConnected = false;
        this.logger.warn('Redis connection closed (falling back to memory cache)');
      });

      // Connecter en arrière-plan
      this.client.connect().catch(() => {
        this.isRedisConnected = false;
        if (nodeEnv === 'production') {
          this.logger.error('❌ Redis connection FAILED in production - sessions will not persist!');
        } else {
          this.logger.warn('⚠️  Redis not available - using in-memory cache (sessions lost on restart)');
        }
      });
    } catch (err) {
      this.client = null;
      this.logger.warn(`Redis initialization failed: ${err} - using in-memory cache`);
    }
  }

  /** Stocke une valeur avec un TTL optionnel (en secondes) */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isRedisConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.setex(key, ttlSeconds, value);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        this.logger.warn(`Redis set failed for key ${key}, using memory cache`);
      }
    }

    // Fallback: mémoire
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
    this.memoryCache.set(key, { value, expiresAt });
  }

  /** Récupère une valeur (null si absente ou expirée) */
  async get(key: string): Promise<string | null> {
    if (this.isRedisConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        this.logger.warn(`Redis get failed for key ${key}, checking memory cache`);
      }
    }

    // Fallback: mémoire
    const entry = this.memoryCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return null;
    }
    return entry.value;
  }

  /** Supprime une clé */
  async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (err) {
        this.logger.warn(`Redis del failed for key ${key}`);
      }
    }

    // Fallback: mémoire
    this.memoryCache.delete(key);
  }

  /** Vérifie l'existence d'une clé */
  async exists(key: string): Promise<boolean> {
    if (this.isRedisConnected && this.client) {
      try {
        return (await this.client.exists(key)) === 1;
      } catch (err) {
        this.logger.warn(`Redis exists failed for key ${key}`);
      }
    }

    // Fallback: mémoire
    const entry = this.memoryCache.get(key);
    if (!entry) return false;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.memoryCache.delete(key);
      return false;
    }
    return true;
  }

  onModuleDestroy() {
    if (this.client) {
      try {
        const result: any = this.client.disconnect();
        if (result && typeof result.catch === 'function') {
          result.catch(() => {
            // Ignore disconnect errors
          });
        }
      } catch {
        // Ignore errors during disconnect
      }
    }
    this.memoryCache.clear();
  }
}
