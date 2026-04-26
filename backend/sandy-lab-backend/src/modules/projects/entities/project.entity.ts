import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany,
} from 'typeorm';
import { ProjectRequirement } from '../../project-requirements/entities/project-requirement.entity';
import { Experiment } from '../../experiments/entities/experiment.entity';
export type ProjectStatus = 'planned' | 'ongoing' | 'completed';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'text',
    default: 'planned',
  })
  status: ProjectStatus;

  @Column({ default: 1 })
  priority: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => ProjectRequirement, (r) => r.project)
  requirements: ProjectRequirement[];

  @OneToMany(() => Experiment, (e) => e.project)
  experiments: Experiment[];
}