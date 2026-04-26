import { Module } from '@nestjs/common';
import { AgentTasksService } from './agent-tasks.service';
import { AgentTasksController } from './agent-tasks.controller';

@Module({
  controllers: [AgentTasksController],
  providers: [AgentTasksService],
})
export class AgentTasksModule {}
