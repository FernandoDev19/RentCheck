import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationType } from '../enums/notification-type.enum';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() renterId: string;
  @Column({ nullable: true }) branchId: string;
  @Column({ nullable: true }) employeeId: string;
  @Column({ type: 'varchar', enum: NotificationType }) type: NotificationType;
  @Column('jsonb') payload: Record<string, any>;
  @Column({ default: false }) read: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
