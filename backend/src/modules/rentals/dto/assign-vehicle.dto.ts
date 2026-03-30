import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignVehicleDto {
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;
}
