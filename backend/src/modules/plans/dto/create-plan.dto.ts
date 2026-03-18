import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsNumber()
  @Min(0)
  @Max(9999)
  max_users: number;

  @IsNumber()
  @Min(0)
  @Max(9999)
  max_branches: number;

  @IsBoolean()
  advanced_reports_enabled: boolean;

  @IsBoolean()
  email_alerts_enabled: boolean;

  @IsBoolean()
  priority_support: boolean;

  @IsNumber()
  @Min(0)
  @Max(9999)
  max_vehicles: number;

  @IsNumber()
  @Min(0)
  price: number;
}
