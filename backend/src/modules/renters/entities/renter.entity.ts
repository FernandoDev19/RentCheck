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
  VirtualColumn,
} from 'typeorm';
import { Plan } from '../../plans/entities/plan.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { Rental } from '../../rentals/entities/rental.entity';
import { BiometryRequest } from '../../biometry-requests/entities/biometry-request.entity';
import { RenterStatus } from '../enums/renter-status.enum';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';

@Entity('renters')
export class Renter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.renter)
  user: User;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column({ nullable: false, unique: true })
  nit: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: false, unique: true })
  phone: string;

  @Column({ name: 'legal_representative' })
  legalRepresentative: string;

  @Column({ name: 'plan_id' })
  planId: number;

  @ManyToOne(() => Plan, (plan) => plan.renters)
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @Column({ nullable: true, name: 'plan_expires_at' })
  planExpiresAt: Date;

  @Column({ default: 0, type: 'double precision' })
  balance: number;

  @Column({
    default: 50000,
    type: 'double precision',
    name: 'low_balance_threshold',
  })
  lowBalanceThreshold: number;

  @Column({ name: 'low_balance_alert_enabled', default: true })
  lowBalanceAlertEnabled: boolean;

  @Column({ default: RenterStatus.ACTIVE, enum: RenterStatus })
  status: RenterStatus;

  @VirtualColumn({
    query: (alias) => `
      SELECT COUNT(*)
      FROM branches
      WHERE branches.renter_id = ${alias}.id
    `,
  })
  totalBranches?: number;

  @OneToMany(() => Branch, (branch) => branch.renter)
  branches: Branch[];

  @OneToMany(() => Vehicle, (vehicle) => vehicle.renter)
  vehicles: Vehicle[];

  @VirtualColumn({
    query: (alias) => `
      SELECT COUNT(*) 
      FROM rentals 
      WHERE rentals.renter_id = ${alias}.id
    `,
  })
  totalRentals?: number;

  @OneToMany(() => Rental, (rental) => rental.renter)
  rentals: Rental[];

  @OneToMany(() => BiometryRequest, (biometryRequest) => biometryRequest.renter)
  biometryRequests: BiometryRequest[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
