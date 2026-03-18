import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
  @IsString()
  vehicleId?: string;

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
