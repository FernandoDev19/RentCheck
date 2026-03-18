import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { VehicleStatus } from '../enums/vehicle-status.enum';

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(20)
  @Transform(({ value }) => value.toUpperCase())
  plate: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  brand: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  model: string;

  @IsNumber()
  @Min(1800)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  color: string;

  @IsOptional()
  @IsNumber()
  insuredValue?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => String)
  photos?: string[];

  @IsOptional()
  @IsEnum(VehicleStatus)
  status: VehicleStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  branchId?: string;
}
