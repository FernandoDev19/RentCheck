import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { VehicleStatus } from '../enums/vehicle-status.enum';
import { Branch } from '../../branches/entities/branch.entity';
import { Renter } from '../../renters/entities/renter.entity';
import { Rental } from '../../rentals/entities/rental.entity';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  plate: string;

  @Column()
  brand: string;

  @Column()
  model: string;

  @Column()
  year: number;

  @Column()
  color: string;

  @Column({
    name: 'insured_value',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  insuredValue: number;

  @Column({ type: 'simple-array', nullable: true })
  photos: string[];

  @Column({ enum: VehicleStatus, default: VehicleStatus.AVAILABLE })
  status: VehicleStatus;

  @Column({ name: 'branch_id', nullable: true })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.vehicles, { nullable: true })
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({ name: 'renter_id' })
  renterId: string;

  @ManyToOne(() => Renter, (renter) => renter.vehicles)
  @JoinColumn({ name: 'renter_id' })
  renter: Renter;

  @OneToMany(() => Rental, (rental) => rental.vehicle)
  rentals: Rental[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
