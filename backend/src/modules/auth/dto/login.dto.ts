import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail()
  @MaxLength(199)
  email: string;

  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
