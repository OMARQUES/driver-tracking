import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LocationDto } from './dto/location.dto';
import { RedisService } from '../redis/redis.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Controller('api/v1/drivers')
export class DriversController {
  private readonly ttlSeconds = Number(process.env.LOCATION_TTL_SECONDS ?? 60);

  constructor(
    private readonly redis: RedisService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Post(':id/location')
  async postLocation(@Param('id') driverId: string, @Body() dto: LocationDto) {
    const payload = {
      driverId,
      lat: dto.lat,
      lon: dto.lon,
      accuracy: dto.accuracy ?? null,
      speed: dto.speed ?? null,
      heading: dto.heading ?? null,
      ts: dto.ts ?? new Date().toISOString(),
    };

    await this.redis.setLastLocation(driverId, payload, this.ttlSeconds);
    this.realtime.emitLocation(driverId, payload);

    return { ok: true };
  }

  @Get(':id/last')
  async getLast(@Param('id') driverId: string) {
    const last = await this.redis.getLastLocation(driverId);
    return { driverId, last };
  }
}
