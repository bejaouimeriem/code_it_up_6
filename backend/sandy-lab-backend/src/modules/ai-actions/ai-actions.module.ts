import { Module } from '@nestjs/common';
import { AiActionsService } from './ai-actions.service';
import { AiActionsController } from './ai-actions.controller';

@Module({
  controllers: [AiActionsController],
  providers: [AiActionsService],
})
export class AiActionsModule {}
