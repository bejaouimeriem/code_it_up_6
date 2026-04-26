import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity('experiments_log')
export class Experiment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'project_id', nullable: true })
  projectId: number;

  @Column({ nullable: true })
  result: string;

  @Column({ nullable: true })
  success: boolean;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @ManyToOne(() => Project, (p) => p.experiments, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'project_id' })
  project: Project;
}