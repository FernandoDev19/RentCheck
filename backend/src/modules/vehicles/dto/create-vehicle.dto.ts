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
import { TypeTransmissionEnum } from '../enums/type-transmission.enum';

export class CreateVehicleDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  gamma?: string;

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

  @IsEnum(TypeTransmissionEnum)
  transmission: TypeTransmissionEnum;

  @IsNumber()
  @Min(0)
  @Max(9999999)
  rentalPriceByDay: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999999)
  insuredValue?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  photos?: string[];

  @IsOptional()
  @IsEnum(VehicleStatus)
  status: VehicleStatus;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  branchId?: string;
}
