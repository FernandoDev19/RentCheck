import type { Employee } from "./employee.model";

export interface Score {
  damageToCar: number;
  unpaidFines: number;
  arrears: number;
  carAbuse: number;
  badAttitude: number;
}

export interface CriticalFlags {
  impersonation: boolean;
  vehicleTheft: boolean;
}

export interface RentalFeedback {
  id: string;
  rentalId: string;
  renterId?: string;
  branchId?: string;
  employeeId?: string;
  employee?: Employee;
  score: Score;
  criticalFlags: CriticalFlags;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}