import {
  Controller, Get, Post, Patch, Param,
  Body, ParseIntPipe,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import {
  CreateInventoryDto,
  UpdateInventoryDto,
  CreateTransactionDto,
} from './dto/inventory.dto';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Get()
  findAll() { return this.service.findAll(); }

  @Get('low-stock')
  lowStock() { return this.service.findLowStock(); }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateInventoryDto) { return this.service.create(dto); }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInventoryDto) {
    return this.service.update(id, dto);
  }

  @Get(':id/transactions')
  transactions(@Param('id', ParseIntPipe) id: number) {
    return this.service.findTransactions(id);
  }

  @Post(':id/transactions')
  addTransaction(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateTransactionDto,
  ) {
    return this.service.addTransaction(id, dto);
  }
}