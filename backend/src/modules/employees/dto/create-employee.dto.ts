import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IdentityTypeEnum } from '../../../shared/enums/identity-type.enum';
import { UserStatus } from '../../users/enums/user-status.enum';

export class CreateEmployeeDto {
  @IsString()
  @Transform(({ value }) => String(value).trim())
  @IsNotEmpty()
  @MinLength(4)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Transform(({ value }) => String(value).trim())
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(60)
  password: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  branchId?: string;

  @IsOptional()
  @IsEnum(IdentityTypeEnum)
  identityType?: IdentityTypeEnum;

  @IsString()
  @Transform(({ value }) => String(value).trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(15)
  identityNumber: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
