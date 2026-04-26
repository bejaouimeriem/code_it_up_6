import { Injectable } from '@nestjs/common';
import { CreateInventoryTransactionDto } from './dto/create-inventory-transaction.dto';
import { UpdateInventoryTransactionDto } from './dto/update-inventory-transaction.dto';

@Injectable()
export class InventoryTransactionService {
  create(createInventoryTransactionDto: CreateInventoryTransactionDto) {
    return 'This action adds a new inventoryTransaction';
  }

  findAll() {
    return `This action returns all inventoryTransaction`;
  }

  findOne(id: number) {
    return `This action returns a #${id} inventoryTransaction`;
  }

  update(id: number, updateInventoryTransactionDto: UpdateInventoryTransactionDto) {
    return `This action updates a #${id} inventoryTransaction`;
  }

  remove(id: number) {
    return `This action removes a #${id} inventoryTransaction`;
  }
}
