import { PartialType } from '@nestjs/mapped-types';
import { CreateAgentTaskDto } from './create-agent-task.dto';

export class UpdateAgentTaskDto extends PartialType(CreateAgentTaskDto) {}
