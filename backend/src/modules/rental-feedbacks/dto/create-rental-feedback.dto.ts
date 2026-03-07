import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class Score {
  @IsInt()
  @Min(0)
  @Max(5)
  damageToCar: number;

  @IsInt()
  @Min(0)
  @Max(5)
  unpaidFines: number;

  @IsInt()
  @Min(0)
  @Max(5)
  arrears: number;

  @IsInt()
  @Min(0)
  @Max(5)
  carAbuse: number;

  @IsInt()
  @Min(0)
  @Max(5)
  badAttitude: number;
}

export class CriticalFlags {
  @IsOptional()
  @IsBoolean()
  impersonation: boolean;

  @IsOptional()
  @IsBoolean()
  vehicleTheft: boolean;
}

export class CreateRentalFeedbackDto {
  @IsUUID()
  @IsNotEmpty()
  rentalId: string;

  @ValidateNested()
  @Type(() => Score)
  score: Score;

  @ValidateNested()
  @Type(() => CriticalFlags)
  criticalFlags: CriticalFlags;

  @IsOptional()
  @IsString()
  comments?: string;
}
