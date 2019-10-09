import { Module } from '@nestjs/common';
import { RedisLockService } from './redisLock.service';
import { RedisModule } from 'nestjs-redis';

@Module({
  imports: [RedisModule],
  providers: [RedisLockService],
  exports: [RedisLockService],
})
export class RedisLockModule {}
