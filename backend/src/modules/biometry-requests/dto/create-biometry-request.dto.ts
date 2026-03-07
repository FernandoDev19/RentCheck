import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBiometryRequestDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;
}
