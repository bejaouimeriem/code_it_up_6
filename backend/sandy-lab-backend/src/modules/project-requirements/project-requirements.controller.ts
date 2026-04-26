import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ProjectRequirementsService } from './project-requirements.service';
import { CreateProjectRequirementDto } from './dto/requirement.dto';
import { UpdateProjectRequirementDto } from './dto/update-project-requirement.dto';

@Controller('project-requirements')
export class ProjectRequirementsController {
  constructor(private readonly projectRequirementsService: ProjectRequirementsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProjectRequirementDto: CreateProjectRequirementDto) {
    return this.projectRequirementsService.create(createProjectRequirementDto);
  }

  @Get()
  findAll() {
    return this.projectRequirementsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectRequirementsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectRequirementDto: UpdateProjectRequirementDto) {
    return this.projectRequirementsService.update(+id, updateProjectRequirementDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.projectRequirementsService.remove(+id);
  }
}