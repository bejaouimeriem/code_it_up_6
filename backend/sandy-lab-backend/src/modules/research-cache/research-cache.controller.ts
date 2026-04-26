import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ResearchCacheService } from './research-cache.service';
import { CreateResearchCacheDto } from './dto/create-research-cache.dto';
import { UpdateResearchCacheDto } from './dto/update-research-cache.dto';

@Controller('research-cache')
export class ResearchCacheController {
  constructor(private readonly researchCacheService: ResearchCacheService) {}

  @Post()
  create(@Body() createResearchCacheDto: CreateResearchCacheDto) {
    return this.researchCacheService.create(createResearchCacheDto);
  }

  @Get()
  findAll() {
    return this.researchCacheService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.researchCacheService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateResearchCacheDto: UpdateResearchCacheDto) {
    return this.researchCacheService.update(+id, updateResearchCacheDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.researchCacheService.remove(+id);
  }
}
