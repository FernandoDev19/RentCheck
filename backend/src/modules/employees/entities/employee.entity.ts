import {
  PrimaryGeneratedColumn,
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  DeleteDateColumn,
} from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { User } from '../../users/entities/user.entity';
import { Rental } from '../../rentals/entities/rental.entity';
import { RentalFeedback } from '../../rental-feedbacks/entities/rental-feedback.entity';
import { BiometryRequest } from '../../biometry-requests/entities/biometry-request.entity';
import { IdentityTypeEnum } from '../../../core/enums/identity-type.enum';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'branch_id' })
  branchId: string;

  @ManyToOne(() => Branch, (branch) => branch.employees)
  @JoinColumn({ name: 'branch_id' })
  branch: Branch;

  @Column({
    name: 'identity_type',
    enum: IdentityTypeEnum,
    default: IdentityTypeEnum.CC,
  })
  identityType: IdentityTypeEnum;

  @Column({ unique: true, name: 'identity_number' })
  identityNumber: string;

  @OneToOne(() => User, (user) => user.employee)
  user: User;

  @OneToMany(() => Rental, (rental) => rental.employee)
  rentals: Rental[];

  @OneToMany(() => RentalFeedback, (rentalFeedback) => rentalFeedback.employee)
  rentalFeedbacks: RentalFeedback[];

  @OneToMany(
    () => BiometryRequest,
    (biometryRequest) => biometryRequest.employee,
  )
  biometryRequests: BiometryRequest[];

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
