import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Inventory } from '../../inventory/entities/inventory.entity';

@Entity('project_requirements')
export class ProjectRequirement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id' })
  projectId: number;

  @Column({ name: 'inventory_id' })
  inventoryId: number;

  @Column({ name: 'required_quantity' })
  requiredQuantity: number;

  // Relations
  @ManyToOne(() => Project, (p) => p.requirements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Inventory, (i) => i.requirements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_id' })
  inventory: Inventory;
}