import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterBranchDto {
  @IsString()
  @Transform(({ value }) => String(value).trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(199)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(199)
  city?: string;

  @IsString()
  @Transform(({ value }) => String(value).trim())
  @IsNotEmpty()
  @MinLength(7)
  @MaxLength(15)
  phone: string;

  @IsString()
  @Transform(({ value }) => String(value).trim())
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  responsible: string;

  @IsOptional()
  @IsString()
  @MinLength(7)
  @MaxLength(15)
  responsiblePhone?: string;

  @IsEmail()
  email: string;

  @IsString()
  @Transform(({ value }) => String(value).trim())
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(60)
  password: string;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
