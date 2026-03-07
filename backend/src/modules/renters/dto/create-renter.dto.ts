import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateRenterDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(60)
  name: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(16)
  nit: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  address?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  city?: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(60)
  password: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(15)
  phone: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(60)
  legalRepresentative: string;

  @IsNumber()
  @IsNotEmpty()
  planId: number;

  @IsOptional()
  @IsString()
  planExpiresAt?: string;

  @IsNumber()
  @Min(0)
  @Max(999999999)
  balance: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999999)
  lowBalanceThreshold?: number;

  @IsOptional()
  @IsBoolean()
  lowBalanceAlertEnabled?: boolean;

  @IsOptional()
  @IsString()
  @IsEnum(['active', 'suspended'])
  status?: 'active' | 'suspended';
}
