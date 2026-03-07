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
  renterId: string;
  branchId: string;
  employeeId: string;
  score: Score;
  criticalFlags: CriticalFlags;
  comments: string;
  createdAt: Date;
  updatedAt: Date;
}