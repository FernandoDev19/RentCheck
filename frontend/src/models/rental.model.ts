import type { Branch } from "./branch.model";
import type { Customer } from "./customer.model";
import type { Employee } from "./employee.model";
import type { RentalFeedback } from "./rental-feedback.model";
import type { Renter } from "./renter.model";
import type { User } from "./user.model";

export interface Rental {
  id: string;
  renterId: string;
  renter: Renter;
  branchId: string;
  branch: Branch;
  employeeId: string;
  employee: Employee;
  customerId: string;
  customer: Customer;
  startDate: Date;
  expectedReturnDate: Date;
  actualReturnDate: Date;
  rentalStatus: 'active' | 'returned' | 'late' | 'cancelled';
  rentalFeedback?: RentalFeedback;
  receivedByUserId?: string;
  receivedByUser?: User;
  cancelledByUserId?: string;
  cancelledByUser?: User;
  createdAt: Date;
  updatedAt: Date;
}
