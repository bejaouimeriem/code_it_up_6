import { Test, TestingModule } from '@nestjs/testing';
import { ResearchCacheService } from './research-cache.service';

describe('ResearchCacheService', () => {
  let service: ResearchCacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResearchCacheService],
    }).compile();

    service = module.get<ResearchCacheService>(ResearchCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
