import { IsString, IsOptional, IsIn, IsInt, Min } from 'class-validator';
import type { ProjectStatus } from '../entities/project.entity';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(['planned', 'ongoing', 'completed'])
  @IsOptional()
  status?: ProjectStatus;

  @IsInt()
  @Min(1)
  @IsOptional()
  priority?: number;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsIn(['planned', 'ongoing', 'completed'])
  @IsOptional()
  status?: ProjectStatus;

  @IsInt()
  @Min(1)
  @IsOptional()
  priority?: number;
}