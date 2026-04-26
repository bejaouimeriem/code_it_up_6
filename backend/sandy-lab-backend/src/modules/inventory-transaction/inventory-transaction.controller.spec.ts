import { Test, TestingModule } from '@nestjs/testing';
import { InventoryTransactionController } from './inventory-transaction.controller';
import { InventoryTransactionService } from './inventory-transaction.service';

describe('InventoryTransactionController', () => {
  let controller: InventoryTransactionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryTransactionController],
      providers: [InventoryTransactionService],
    }).compile();

    controller = module.get<InventoryTransactionController>(InventoryTransactionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
