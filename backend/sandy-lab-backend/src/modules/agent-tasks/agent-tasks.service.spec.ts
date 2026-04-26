import { Test, TestingModule } from '@nestjs/testing';
import { AgentTasksService } from './agent-tasks.service';

describe('AgentTasksService', () => {
  let service: AgentTasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AgentTasksService],
    }).compile();

    service = module.get<AgentTasksService>(AgentTasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
