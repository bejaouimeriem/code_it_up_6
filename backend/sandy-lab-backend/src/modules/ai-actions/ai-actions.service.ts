import { Injectable } from '@nestjs/common';
import { CreateAiActionDto } from './dto/create-ai-action.dto';
import { UpdateAiActionDto } from './dto/update-ai-action.dto';

@Injectable()
export class AiActionsService {
  create(createAiActionDto: CreateAiActionDto) {
    return 'This action adds a new aiAction';
  }

  findAll() {
    return `This action returns all aiActions`;
  }

  findOne(id: number) {
    return `This action returns a #${id} aiAction`;
  }

  update(id: number, updateAiActionDto: UpdateAiActionDto) {
    return `This action updates a #${id} aiAction`;
  }

  remove(id: number) {
    return `This action removes a #${id} aiAction`;
  }
}
