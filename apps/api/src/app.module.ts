import { Module } from '@nestjs/common';
import { DriversModule } from './drivers/drivers.module';
import { RedisModule } from './redis/redis.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [RedisModule, RealtimeModule, DriversModule],
})
export class AppModule {}
