import type { BiometryRequest } from "./biometry-request.model";
import type { Employee } from "./employee.model";
import type { Rental } from "./rental.model";
import type { Renter } from "./renter.model";
import type { User } from "./user.model";
import type { Vehicle } from "./Vehicle.model";

export interface Branch {
  id: string;
  name: string;
  renterId: string;
  renter: Renter;
  address?: string;
  city?: string;
  phone: string;
  responsible: string;
  responsiblePhone?: string;
  email: string;
  status: boolean;
  rentals?: Rental[];
  employees?: Employee[];
  biometryRequests?: BiometryRequest[];
  vehicles?: Vehicle[];
  user?: User;
  createdAt: Date;
  updatedAt: Date;
}

