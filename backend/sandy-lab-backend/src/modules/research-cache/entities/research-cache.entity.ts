import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('research_cache')
export class ResearchCache {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  topic: string;

  @Column({ nullable: true })
  summary: string;

  @Column({ nullable: true })
  source: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}