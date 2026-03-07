import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Renter } from '../../renters/entities/renter.entity';
import { Employee } from '../../employees/entities/employee.entity';
import { User } from '../../users/entities/user.entity';
import { Rental } from '../../rentals/entities/rental.entity';
import { BiometryRequest } from '../../biometry-requests/entities/biometry-request.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false })
  name: string;

  @Column({ name: 'renter_id', nullable: false })
  renterId: string;

  @ManyToOne(() => Renter, (renter) => renter.branches)
  @JoinColumn({ name: 'renter_id' })
  renter: Renter;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: false, unique: true })
  phone: string;

  @Column({ nullable: false })
  responsible: string;

  @Column({ nullable: true, name: 'responsible_phone' })
  responsiblePhone: string;

  @Column({ nullable: false, unique: true })
  email: string;

  @Column({ default: true })
  status: boolean;

  @OneToMany(() => Rental, (rental) => rental.branch)
  rentals: Rental[];

  @OneToMany(() => Employee, (employee) => employee.branch)
  employees: Employee[];

  @OneToMany(() => BiometryRequest, (biometryRequest) => biometryRequest.branch)
  biometryRequests: BiometryRequest[];

  @OneToOne(() => User, (user) => user.branch)
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
