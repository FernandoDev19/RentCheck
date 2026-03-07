import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Renter } from '../../renters/entities/renter.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('biometry_requests')
export class BiometryRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true, generated: 'uuid' })
  token: string;

  @Column({ name: 'renter_id' })
  renterId: string;

  @ManyToOne(() => Renter, (renter) => renter.biometryRequests)
  @JoinColumn({ name: 'renter_id' })
  renter: Renter;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.biometryRequests, {
    nullable: true,
  })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => Customer, (customer) => customer.biometryRequests)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'employee_id', nullable: true })
  employeeId: string;

  @ManyToOne(() => Employee, (employee) => employee.biometryRequests, {
    nullable: true,
  })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({
    type: 'enum',
    enum: ['pending', 'completed', 'expired'],
    default: 'pending',
  })
  status: 'pending' | 'completed' | 'expired';

  @Column({
    type: 'enum',
    enum: ['approved', 'rejected'],
    nullable: true,
    default: null,
  })
  result: 'approved' | 'rejected' | null;

  @Column({ name: 'provider_reference', unique: true })
  providerReference: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
