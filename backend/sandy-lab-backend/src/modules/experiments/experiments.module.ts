import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Experiment } from './entities/experiment.entity'; // (relatif, pas ../entities)import { ExperimentsService } from './experiments.service';
import { ExperimentsController } from './experiments.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { ExperimentsService } from './experiments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Experiment]), InventoryModule],
  controllers: [ExperimentsController],
  providers: [ExperimentsService],
  exports: [ExperimentsService],
})
export class ExperimentsModule {}
