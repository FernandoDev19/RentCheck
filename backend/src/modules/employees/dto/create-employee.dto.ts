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
import { IdentityTypeEnum } from '../../../core/enums/identity-type.enum';

export class CreateEmployeeDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(60)
  password: string;

  @IsOptional()
  @IsEnum(IdentityTypeEnum)
  identityType: IdentityTypeEnum;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(15)
  identityNumber: string;
}
