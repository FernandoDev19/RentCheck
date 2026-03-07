// create-rental-manual.dto.ts
import { IntersectionType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from '../../customers/dto/create-customer.dto';
import { CreateRentalDto } from './create-rental.dto';
// Este une los dos DTOs en uno solo
export class CreateRentalManualDto extends IntersectionType(
  CreateCustomerDto,
  CreateRentalDto,
) {}
