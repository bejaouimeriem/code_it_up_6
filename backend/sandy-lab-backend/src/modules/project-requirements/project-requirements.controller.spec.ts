import { Test, TestingModule } from '@nestjs/testing';
import { ProjectRequirementsController } from './project-requirements.controller';
import { ProjectRequirementsService } from './project-requirements.service';

describe('ProjectRequirementsController', () => {
  let controller: ProjectRequirementsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectRequirementsController],
      providers: [ProjectRequirementsService],
    }).compile();

    controller = module.get<ProjectRequirementsController>(ProjectRequirementsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
