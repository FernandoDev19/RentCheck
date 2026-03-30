import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { RentalStatusEnum } from '../enums/rental-status.enum';

export class CreateRentalDto {
  // @IsString()
  // @Transform(({ value }) => value.trim())
  // @IsNotEmpty()
  // renterId: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  // @IsString()
  // @Transform(({ value }) => value.trim())
  // @IsNotEmpty()
  // employeeId: string;

  // @IsString()
  // @Transform(({ value }) => value.trim())
  // @IsNotEmpty()
  // customerId: string;

  @IsOptional()
  @IsUUID()
  @IsNotEmpty()
  vehicleId?: string;

  @IsNumber()
  @Min(0)
  @Max(999999999)
  totalPrice: number;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  expectedReturnDate: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  actualReturnDate?: string;

  @IsOptional()
  @IsEnum(RentalStatusEnum)
  rentalStatus?: RentalStatusEnum = RentalStatusEnum.ACTIVE;
}
