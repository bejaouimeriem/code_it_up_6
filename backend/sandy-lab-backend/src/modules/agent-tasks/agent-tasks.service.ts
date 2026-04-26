import { Injectable } from '@nestjs/common';
import { CreateAgentTaskDto } from './dto/create-agent-task.dto';
import { UpdateAgentTaskDto } from './dto/update-agent-task.dto';

@Injectable()
export class AgentTasksService {
  create(createAgentTaskDto: CreateAgentTaskDto) {
    return 'This action adds a new agentTask';
  }

  findAll() {
    return `This action returns all agentTasks`;
  }

  findOne(id: number) {
    return `This action returns a #${id} agentTask`;
  }

  update(id: number, updateAgentTaskDto: UpdateAgentTaskDto) {
    return `This action updates a #${id} agentTask`;
  }

  remove(id: number) {
    return `This action removes a #${id} agentTask`;
  }
}
