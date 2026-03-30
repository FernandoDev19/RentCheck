import type { TypeTransmission } from "../common/types/type-transmission.type";
import type { VehicleStatus } from "../common/types/vehicle-status.type";
import type { Branch } from "./branch.model";

export interface Vehicle {
  id: string;
  gamma?: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  insuredValue?: number;
  transmission: TypeTransmission;
  rentalPriceByDay: number;
  photos: string[];
  status: VehicleStatus;
  branchId?: string;
  branch?: Branch;
  renterId: string;
  createdAt: string;
  updatedAt: string;
}