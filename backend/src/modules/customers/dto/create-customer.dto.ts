import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEmail,
  IsNumber,
} from 'class-validator';
import { IdentityTypeEnum } from '../../../core/enums/identity-type.enum';
import { CustomerStatusEnum } from '../enums/customer-status.enum';

export class CreateCustomerDto {
  @IsOptional()
  @IsEnum(IdentityTypeEnum)
  identityType: IdentityTypeEnum;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(15)
  identityNumber: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(60)
  name: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(60)
  lastName: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(7)
  @MaxLength(15)
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNumber()
  generalScore?: number = 0;

  @IsOptional()
  @IsEnum(CustomerStatusEnum)
  status?: CustomerStatusEnum = CustomerStatusEnum.NORMAL;
}
