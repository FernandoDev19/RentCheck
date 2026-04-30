import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() renterId: string;
  @Column({ nullable: true }) branchId: string;
  @Column({ nullable: true }) employeeId: string;
  @Column() type: string; // 'vehicle_conflict' | 'late_rental' | 'low_balance' (Crear Enum)
  @Column('jsonb') payload: Record<string, any>; // datos del conflicto
  @Column({ default: false }) read: boolean;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
