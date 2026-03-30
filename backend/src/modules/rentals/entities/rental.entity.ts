import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Renter } from '../../renters/entities/renter.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { RentalFeedback } from '../../rental-feedbacks/entities/rental-feedback.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { RentalStatusEnum } from '../enums/rental-status.enum';
import { User } from '../../users/entities/user.entity';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('rentals')
export class Rental {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'renter_id' })
  renterId: string;

  @ManyToOne(() => Renter, (renter) => renter.rentals)
  @JoinColumn({ name: 'renter_id' })
  renter: Renter;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.rentals, {
    nullable: true,
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'employee_id', nullable: true })
  employeeId: string;

  @ManyToOne(() => Employee, (employee) => employee.rentals, {
    nullable: true,
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.rentals)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @OneToOne(() => RentalFeedback, (rentalFeedback) => rentalFeedback.rental)
  rentalFeedback: RentalFeedback;

  @Column({ name: 'start_date' })
  startDate: Date;

  @Column({ name: 'expected_return_date' })
  expectedReturnDate: Date;

  @Column({ name: 'actual_return_date', nullable: true })
  actualReturnDate: Date;

  @Column({ name: 'received_by_user_id', nullable: true })
  receivedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'received_by_user_id' })
  receivedByUser: User;

  @Column({ name: 'cancelled_by_user_id', nullable: true })
  cancelledByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'cancelled_by_user_id' })
  cancelledByUser: User;

  @Column({
    enum: RentalStatusEnum,
    default: RentalStatusEnum.ACTIVE,
  })
  rentalStatus: RentalStatusEnum;

  @Column({ name: 'vehicle_id', nullable: true })
  vehicleId: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.rentals, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ name: 'total_price', type: 'decimal', precision: 12, scale: 2 })
  totalPrice: number;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
