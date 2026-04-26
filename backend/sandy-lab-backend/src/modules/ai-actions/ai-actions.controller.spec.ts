import { Test, TestingModule } from '@nestjs/testing';
import { AiActionsController } from './ai-actions.controller';
import { AiActionsService } from './ai-actions.service';

describe('AiActionsController', () => {
  let controller: AiActionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiActionsController],
      providers: [AiActionsService],
    }).compile();

    controller = module.get<AiActionsController>(AiActionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
