import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rental } from '../../rentals/entities/rental.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { CriticalFlags, Score } from '../dto/create-rental-feedback.dto';

@Entity('rental_feedbacks')
export class RentalFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rental_id' })
  rentalId: string;

  @OneToOne(() => Rental, (rental) => rental.rentalFeedback)
  @JoinColumn({ name: 'rental_id' })
  rental: Rental;

  @Column({ name: 'employee_id', nullable: true })
  employeeId: string;

  @ManyToOne(() => Employee, (emp) => emp.rentalFeedbacks, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @Column({ name: 'renter_id', nullable: true })
  renterId: string;

  @Column({ type: 'jsonb' })
  score: Score;

  @Column({
    type: 'jsonb',
    default: { impersonation: false, vehicleTheft: false },
  })
  criticalFlags: CriticalFlags;

  @Column({ nullable: true, type: 'text' })
  comments: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
