import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateExperimentDto {
  @IsInt()
  @IsOptional()
  projectId?: number;

  @IsString()
  @IsOptional()
  result?: string;

  @IsBoolean()
  @IsOptional()
  success?: boolean;

  @IsString()
  @IsOptional()
  notes?: string;

  // Ressources réellement utilisées (saisies par Sandy)
  @IsOptional()
  usedResources?: { inventoryId: number; quantity: number; reason?: string }[];
}