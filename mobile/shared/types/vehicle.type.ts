import type { Branch } from "./branch.type";
import type { TypeTransmission } from "./type-transmission.type";

export const VEHICLE_STATUS = {
  AVAILABLE: 'available',
  RENTED: 'rented',
  MAINTENANCE: 'maintenance',
  SOLD: 'sold',
  STOLEN: 'stolen',
} as const;

export type VehicleStatus = typeof VEHICLE_STATUS[keyof typeof VEHICLE_STATUS];

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