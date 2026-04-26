import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectRequirementDto } from './requirement.dto';

export class UpdateProjectRequirementDto extends PartialType(CreateProjectRequirementDto) {}