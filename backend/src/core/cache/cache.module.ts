import { Module } from '@nestjs/common';
import { BranchesCacheService } from './services/branches-cache.service';
import { BiometryRequestsCacheService } from './services/biometry-requests-cache.service';
import { CustomersCacheService } from './services/customers-cache.service';
import { EmployeesCacheService } from './services/employees-cache.service';

@Module({
  providers: [
    BranchesCacheService,
    BiometryRequestsCacheService,
    CustomersCacheService,
    EmployeesCacheService,
  ],
  exports: [
    BranchesCacheService,
    BiometryRequestsCacheService,
    CustomersCacheService,
    EmployeesCacheService,
  ],
})
export class CacheModule {}
