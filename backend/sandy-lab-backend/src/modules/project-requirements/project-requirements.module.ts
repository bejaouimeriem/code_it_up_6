import { Module } from '@nestjs/common';
import { ProjectRequirementsService } from './project-requirements.service';
import { ProjectRequirementsController } from './project-requirements.controller';

@Module({
  controllers: [ProjectRequirementsController],
  providers: [ProjectRequirementsService],
})
export class ProjectRequirementsModule {}
