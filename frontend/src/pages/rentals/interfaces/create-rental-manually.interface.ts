import type { CreateCustomerInterface } from "../../customers/interfaces/create-customer.interface";
import type { CreateRentalInterface } from "./create-rental.interface";

export interface CreateRentalManuallyInterface extends CreateRentalInterface, CreateCustomerInterface {}