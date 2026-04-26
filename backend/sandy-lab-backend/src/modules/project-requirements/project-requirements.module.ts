import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectRequirementsService } from './project-requirements.service';
import { ProjectRequirementsController } from './project-requirements.controller';
import { ProjectRequirement } from './entities/project-requirement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProjectRequirement])],
  controllers: [ProjectRequirementsController],
  providers: [ProjectRequirementsService],
  exports: [ProjectRequirementsService],
})
export class ProjectRequirementsModule {}