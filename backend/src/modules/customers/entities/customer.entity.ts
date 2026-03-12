import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Rental } from '../../rentals/entities/rental.entity';
import { BiometryRequest } from '../../biometry-requests/entities/biometry-request.entity';
import { IdentityTypeEnum } from '../../../core/enums/identity-type.enum';
import { CustomerStatusEnum } from '../enums/customer-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'identity_type',
    enum: IdentityTypeEnum,
    default: IdentityTypeEnum.CC,
  })
  identityType: IdentityTypeEnum;

  @Column({ name: 'identity_number', unique: true })
  identityNumber: string;

  @Column()
  name: string;

  @Column({ name: 'last_name' })
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'double precision', default: 0 })
  generalScore: number;

  @Column({ enum: CustomerStatusEnum, default: CustomerStatusEnum.NORMAL })
  status: CustomerStatusEnum;

  @Column({ name: 'registered_by_user_id', nullable: true })
  registeredByUserId: string;

  @ManyToOne(() => User, (user) => user.customers, {
    nullable: true,
  })
  @JoinColumn({ name: 'registered_by_user_id' })
  registeredByUser: User;

  @OneToMany(() => Rental, (rental) => rental.customer)
  rentals: Rental[];

  @OneToMany(
    () => BiometryRequest,
    (biometryRequest) => biometryRequest.customer,
  )
  biometryRequests: BiometryRequest[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
