import { Test, TestingModule } from '@nestjs/testing';
import { AgentTasksController } from './agent-tasks.controller';
import { AgentTasksService } from './agent-tasks.service';

describe('AgentTasksController', () => {
  let controller: AgentTasksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgentTasksController],
      providers: [AgentTasksService],
    }).compile();

    controller = module.get<AgentTasksController>(AgentTasksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
