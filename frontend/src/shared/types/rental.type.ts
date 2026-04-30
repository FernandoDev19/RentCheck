import type { Branch } from "./branch.type";
import type { Customer } from "./customer.type";
import type { Employee } from "./employee.type";
import type { RentalFeedback } from "./rental-feedback.type";
import type { Renter } from "./renter.type";
import type { User } from "./user.type";
import type { Vehicle } from "./vehicle.type";

export const RENTAL_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  RETURNED: 'returned',
  LATE: 'late',
  CANCELLED: 'cancelled',
} as const;

export type RentalStatus = typeof RENTAL_STATUS[keyof typeof RENTAL_STATUS];

export interface Rental {
  id: string;

  renterId: string;
  renter: Renter;

  branchId?: string;
  branch?: Branch;

  employeeId?: string;
  employee?: Employee;

  customerId: string;
  customer: Customer;

  startDate: Date;
  expectedReturnDate: Date;
  actualReturnDate: Date;

  rentalStatus: RentalStatus;
  rentalFeedback?: RentalFeedback;

  receivedByUserId?: string;
  receivedByUser?: User;

  cancelledByUserId?: string;
  cancelledByUser?: User;

  totalPrice: number;

  vehicleId?: string;
  vehicle?: Vehicle;

  createdAt: Date;
  updatedAt: Date;
}
