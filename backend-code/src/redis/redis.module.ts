import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

// @Global() → RedisService disponible dans tous les modules sans import explicite
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
