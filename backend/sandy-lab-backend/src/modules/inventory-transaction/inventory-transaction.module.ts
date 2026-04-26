import { Module } from '@nestjs/common';
import { InventoryTransactionService } from './inventory-transaction.service';
import { InventoryTransactionController } from './inventory-transaction.controller';

@Module({
  controllers: [InventoryTransactionController],
  providers: [InventoryTransactionService],
})
export class InventoryTransactionModule {}
