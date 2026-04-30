import { Transform } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsOptional()
  @IsNumber()
  id?: number;

  @IsString()
  @Transform(({ value }) => String(value).trim())
  @IsNotEmpty()
  name: string;
}
