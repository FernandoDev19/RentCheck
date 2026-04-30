import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CustomersCacheService {
  private readonly logger = new Logger(CustomersCacheService.name);

  constructor(private dataSource: DataSource) {}

  keys = {
    list: 'customers:list',
  };

  async invalidateAll() {
    this.logger.log('Invalidating all customers cache');

    await this.dataSource.queryResultCache?.remove([this.keys.list]);

    this.logger.log('Customers cache invalidated');
  }
}
