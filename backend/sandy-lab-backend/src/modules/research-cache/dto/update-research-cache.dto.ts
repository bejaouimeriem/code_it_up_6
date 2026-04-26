import { PartialType } from '@nestjs/mapped-types';
import { CreateResearchCacheDto } from './create-research-cache.dto';

export class UpdateResearchCacheDto extends PartialType(CreateResearchCacheDto) {}
