import { IsInt, Min } from 'class-validator';

export class CreateProjectRequirementDto  {
  @IsInt()
  projectId: number;

  @IsInt()
  inventoryId: number;

  @IsInt()
  @Min(1)
  requiredQuantity: number;
}