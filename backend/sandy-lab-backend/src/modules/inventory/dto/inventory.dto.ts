import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class CreateInventoryDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  minRequired?: number;
}

export class UpdateInventoryDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  minRequired?: number;
}

export class CreateTransactionDto {
  @IsInt()
  changeAmount: number;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsInt()
  @IsOptional()
  experimentId?: number;
}