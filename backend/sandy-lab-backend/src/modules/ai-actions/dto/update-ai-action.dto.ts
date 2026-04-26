import { PartialType } from '@nestjs/mapped-types';
import { CreateAiActionDto } from './create-ai-action.dto';

export class UpdateAiActionDto extends PartialType(CreateAiActionDto) {}
