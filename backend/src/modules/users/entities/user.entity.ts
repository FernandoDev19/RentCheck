import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { Renter } from '../../renters/entities/renter.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { Role } from '../../roles/entities/role.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { UserStatus } from '../enums/user-status.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ nullable: false, select: false })
  password: string;

  @Column({ name: 'renter_id', nullable: true })
  renterId: string;

  @OneToOne(() => Renter, (renter) => renter.user, { nullable: true })
  @JoinColumn({ name: 'renter_id' })
  renter: Renter;

  @Column({ name: 'employee_id', nullable: true })
  employeeId: string;

  @OneToOne(() => Employee, (employee) => employee.user, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @OneToOne(() => Branch, (branch) => branch.user, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'role_id', nullable: false })
  roleId: number;

  @ManyToOne(() => Role, (role) => role.users, { nullable: false })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => Customer, (customer) => customer.registeredByUser)
  customers: Customer[];

  @Column({ default: UserStatus.ACTIVE, enum: UserStatus })
  status: UserStatus;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
