import { Injectable } from '@nestjs/common';
import { CreateResearchCacheDto } from './dto/create-research-cache.dto';
import { UpdateResearchCacheDto } from './dto/update-research-cache.dto';

@Injectable()
export class ResearchCacheService {
  create(createResearchCacheDto: CreateResearchCacheDto) {
    return 'This action adds a new researchCache';
  }

  findAll() {
    return `This action returns all researchCache`;
  }

  findOne(id: number) {
    return `This action returns a #${id} researchCache`;
  }

  update(id: number, updateResearchCacheDto: UpdateResearchCacheDto) {
    return `This action updates a #${id} researchCache`;
  }

  remove(id: number) {
    return `This action removes a #${id} researchCache`;
  }
}
