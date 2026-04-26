import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AiActionsService } from './ai-actions.service';
import { CreateAiActionDto } from './dto/create-ai-action.dto';
import { UpdateAiActionDto } from './dto/update-ai-action.dto';

@Controller('ai-actions')
export class AiActionsController {
  constructor(private readonly aiActionsService: AiActionsService) {}

  @Post()
  create(@Body() createAiActionDto: CreateAiActionDto) {
    return this.aiActionsService.create(createAiActionDto);
  }

  @Get()
  findAll() {
    return this.aiActionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.aiActionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAiActionDto: UpdateAiActionDto) {
    return this.aiActionsService.update(+id, updateAiActionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.aiActionsService.remove(+id);
  }
}
