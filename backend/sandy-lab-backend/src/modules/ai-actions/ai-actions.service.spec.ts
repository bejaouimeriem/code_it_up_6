import { Test, TestingModule } from '@nestjs/testing';
import { AiActionsService } from './ai-actions.service';

describe('AiActionsService', () => {
  let service: AiActionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AiActionsService],
    }).compile();

    service = module.get<AiActionsService>(AiActionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
