import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Plan } from '../../plans/entities/plan.entity';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { Rental } from '../../rentals/entities/rental.entity';
import { BiometryRequest } from '../../biometry-requests/entities/biometry-request.entity';

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

  @Column({ default: 'active', enum: ['active', 'suspended'] })
  status: 'active' | 'suspended';

  @OneToMany(() => Branch, (branch) => branch.renter)
  branches: Branch[];

  @OneToMany(() => Rental, (rental) => rental.renter)
  rentals: Rental[];

  @OneToMany(() => BiometryRequest, (biometryRequest) => biometryRequest.renter)
  biometryRequests: BiometryRequest[];

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
