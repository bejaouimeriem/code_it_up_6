import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './entities/inventory.entity';
import { InventoryTransaction } from '../inventory-transaction/entities/inventory-transaction.entity';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  CreateTransactionDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(InventoryTransaction)
    private readonly transactionRepo: Repository<InventoryTransaction>,
  ) {}

  findAll() {
    return this.inventoryRepo.find({ order: { category: 'ASC', name: 'ASC' } });
  }

  // Items sous le seuil minimum — utilisé par l'Inventory Agent
  async findLowStock() {
    const items = await this.inventoryRepo.find();
    return items.filter((i) => i.quantity <= i.minRequired);
  }

  async findOne(id: number) {
    const item = await this.inventoryRepo.findOne({
      where: { id },
      relations: ['transactions'],
    });
    if (!item) throw new NotFoundException(`Inventory item #${id} not found`);
    return item;
  }

  create(dto: CreateInventoryDto) {
    const item = this.inventoryRepo.create(dto);
    return this.inventoryRepo.save(item);
  }

  async update(id: number, dto: UpdateInventoryDto) {
    await this.findOne(id);
    await this.inventoryRepo.update(id, dto);
    return this.findOne(id);
  }

  // Enregistre une transaction ET met à jour la quantité
  async addTransaction(inventoryId: number, dto: CreateTransactionDto) {
    const item = await this.findOne(inventoryId);

    // Mise à jour du stock
    const newQuantity = item.quantity + dto.changeAmount;
    await this.inventoryRepo.update(inventoryId, { quantity: newQuantity });

    // Log de la transaction
    const transaction = this.transactionRepo.create({
      inventoryId,
      changeAmount: dto.changeAmount,
      reason: dto.reason,
      experimentId: dto.experimentId,
    });
    return this.transactionRepo.save(transaction);
  }

  findTransactions(inventoryId: number) {
    return this.transactionRepo.find({
      where: { inventoryId },
      order: { createdAt: 'DESC' },
    });
  }

  // Utilisé par les agents pour vérifier la disponibilité
  async checkAvailability(inventoryId: number, requiredQty: number) {
    const item = await this.findOne(inventoryId);
    return {
      item,
      required: requiredQty,
      available: item.quantity,
      sufficient: item.quantity >= requiredQty,
    };
  }
}