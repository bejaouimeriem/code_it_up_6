import { Controller, Get, Post, Param, Body, ParseIntPipe, Query } from '@nestjs/common';
import { ExperimentsService } from './experiments.service';
import { CreateExperimentDto } from './dto/experiment.dto';

@Controller('experiments')
export class ExperimentsController {
  constructor(private readonly service: ExperimentsService) {}

  @Get()
  findAll(@Query('projectId') projectId?: string) {
    if (projectId) return this.service.findByProject(parseInt(projectId));
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateExperimentDto) { return this.service.create(dto); }
}