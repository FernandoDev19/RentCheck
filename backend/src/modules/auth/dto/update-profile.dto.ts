import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
 
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => String(value).trim())
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(60)
  name?: string;
 
  @IsOptional()
  @IsEmail()
  email?: string;
}
