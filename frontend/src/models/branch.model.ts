import type { Renter } from "./renter.model";

export interface Branch {
  id: string;
  name: string;
  renterId: string;
  renter: Renter;
  address: string;
  city: string;
  phone: string;
  responsible: string;
  responsiblePhone: string;
  email: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}
