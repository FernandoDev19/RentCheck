import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

// TODO: Implementar cache para empleados, notificaciones, planes, rentals, etc.
@Injectable()
export class EmployeesCacheService {
  private readonly logger = new Logger(EmployeesCacheService.name);

  constructor(private dataSource: DataSource) {}

  keys = {
    list: 'employees:list',
  };

  async invalidateAll() {
    this.logger.log('Invalidating all employees cache');

    await this.dataSource.queryResultCache?.remove([this.keys.list]);

    this.logger.log('Employees cache invalidated');
  }
}
