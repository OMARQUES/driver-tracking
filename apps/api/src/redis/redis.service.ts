import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor() {
    const host = process.env.REDIS_HOST ?? '127.0.0.1';
    const port = Number(process.env.REDIS_PORT ?? 6379);
    this.client = new Redis({ host, port, lazyConnect: false, maxRetriesPerRequest: 2 });
  }

  async setLastLocation(driverId: string, payload: unknown, ttlSeconds: number): Promise<void> {
    const key = `driver:${driverId}:last`;
    await this.client.set(key, JSON.stringify(payload), 'EX', ttlSeconds);
  }

  async getLastLocation<T = any>(driverId: string): Promise<T | null> {
    const key = `driver:${driverId}:last`;
    const raw = await this.client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async onModuleDestroy() {
    try {
      await this.client.quit();
    } catch {
      // ignore
    }
  }
}
