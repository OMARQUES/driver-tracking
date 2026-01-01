import { Module } from '@nestjs/common';
import { DriversController } from './drivers.controller';
import { RedisModule } from '../redis/redis.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RedisModule, RealtimeModule],
  controllers: [DriversController],
})
export class DriversModule {}
