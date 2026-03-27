import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private config: ConfigService) {
    this.client = new Redis(this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379', {
      // Reconnexion automatique : important en prod
      retryStrategy: (times) => Math.min(times * 50, 2000),
      lazyConnect: false,
    });

    this.client.on('error', (err) =>
      this.logger.error(`Redis connection error: ${err.message}`),
    );
    this.client.on('connect', () => this.logger.log('Redis connected'));
  }

  /** Stocke une valeur avec un TTL optionnel (en secondes) */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.setex(key, ttlSeconds, value);
    } else {
      await this.client.set(key, value);
    }
  }

  /** Récupère une valeur (null si absente ou expirée) */
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  /** Supprime une clé (invalidation de token, etc.) */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Vérifie l'existence d'une clé sans la lire */
  async exists(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  onModuleDestroy() {
    this.client.disconnect();
  }
}
