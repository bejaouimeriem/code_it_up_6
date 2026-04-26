import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AgentTasksService } from './agent-tasks.service';
import { CreateAgentTaskDto } from './dto/create-agent-task.dto';
import { UpdateAgentTaskDto } from './dto/update-agent-task.dto';

@Controller('agent-tasks')
export class AgentTasksController {
  constructor(private readonly agentTasksService: AgentTasksService) {}

  @Post()
  create(@Body() createAgentTaskDto: CreateAgentTaskDto) {
    return this.agentTasksService.create(createAgentTaskDto);
  }

  @Get()
  findAll() {
    return this.agentTasksService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agentTasksService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAgentTaskDto: UpdateAgentTaskDto) {
    return this.agentTasksService.update(+id, updateAgentTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agentTasksService.remove(+id);
  }
}
