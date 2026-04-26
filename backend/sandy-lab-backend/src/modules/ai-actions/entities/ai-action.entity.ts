import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('ai_actions_log')
export class AIAction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'action_type', nullable: true })
  actionType: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}