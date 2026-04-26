import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

@Entity('agent_tasks')
export class AgentTask {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  task: string;

  @Column({ type: 'text', default: 'pending' })
  status: TaskStatus;

  @Column({ nullable: true })
  result: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}