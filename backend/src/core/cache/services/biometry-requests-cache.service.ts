import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class BiometryRequestsCacheService {
  private readonly logger = new Logger(BiometryRequestsCacheService.name);

  constructor(private dataSource: DataSource) {}

  keys = {
    list: 'biometry-requests:list',
  };

  async invalidateAll() {
    this.logger.log('Invalidating all biometry requests cache');

    await this.dataSource.queryResultCache?.remove([this.keys.list]);

    this.logger.log('Biometry requests cache invalidated');
  }
}
