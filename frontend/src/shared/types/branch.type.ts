import type { BiometryRequest } from "./biometry-request.type";
import type { Employee } from "./employee.type";
import type { Rental } from "./rental.type";
import type { Renter } from "./renter.type";
import type { User } from "./user.type";
import type { Vehicle } from "./vehicle.type";

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

