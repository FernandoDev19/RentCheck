import type { VehicleStatus } from "../common/types/vehicle-status.type";

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  insuredValue?: number;
  photos: string[];
  status: VehicleStatus;
  branchId?: string;
  renterId: string;
  createdAt: string;
  updatedAt: string;
}