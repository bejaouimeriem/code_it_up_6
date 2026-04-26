import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Inventory } from '../../inventory/entities/inventory.entity';
@Entity('inventory_transactions')
export class InventoryTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'inventory_id' })
  inventoryId: number;

  @Column({ name: 'change_amount' })
  changeAmount: number;

  @Column({ nullable: true })
  reason: string;

  // Lien optionnel vers l'expérience qui a consommé cette ressource
  @Column({ name: 'experiment_id', nullable: true })
  experimentId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Inventory, (i) => i.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_id' })
  inventory: Inventory;
}