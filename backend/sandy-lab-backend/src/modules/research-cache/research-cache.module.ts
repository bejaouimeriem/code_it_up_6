import { Module } from '@nestjs/common';
import { ResearchCacheService } from './research-cache.service';
import { ResearchCacheController } from './research-cache.controller';

@Module({
  controllers: [ResearchCacheController],
  providers: [ResearchCacheService],
})
export class ResearchCacheModule {}
