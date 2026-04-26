import { Test, TestingModule } from '@nestjs/testing';
import { ResearchCacheController } from './research-cache.controller';
import { ResearchCacheService } from './research-cache.service';

describe('ResearchCacheController', () => {
  let controller: ResearchCacheController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ResearchCacheController],
      providers: [ResearchCacheService],
    }).compile();

    controller = module.get<ResearchCacheController>(ResearchCacheController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
