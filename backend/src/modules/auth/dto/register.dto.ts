import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @Transform(({ value }) => String(value).trim())
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @MaxLength(199)
  email: string;

  @IsString()
  @Transform(({ value }) => String(value).trim())
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
