import {
  Entity, PrimaryGeneratedColumn, Column,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { ProjectRequirement } from '../../project-requirements/entities/project-requirement.entity';
import { InventoryTransaction } from '../../inventory-transaction/entities/inventory-transaction.entity';@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: 0 })
  quantity: number;

  @Column({ nullable: true })
  unit: string;

  @Column({ name: 'min_required', default: 0 })
  minRequired: number;

  @UpdateDateColumn({ name: 'last_updated' })
  lastUpdated: Date;

  // Relations
  @OneToMany(() => ProjectRequirement, (r) => r.inventory)
  requirements: ProjectRequirement[];

  @OneToMany(() => InventoryTransaction, (t) => t.inventory)
  transactions: InventoryTransaction[];

  // Computed helper
  get isLowStock(): boolean {
    return this.quantity <= this.minRequired;
  }
}