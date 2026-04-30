import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class BranchesCacheService {
  private readonly logger = new Logger(BranchesCacheService.name);

  constructor(private dataSource: DataSource) {}

  keys = {
    list: 'branches:list',
    listByRenter: 'branches:list-by-renter',
    listNames: 'branches:list-names',
  };

  async invalidateAll() {
    this.logger.log('Invalidating all branch cache');

    await this.dataSource.queryResultCache?.remove([
      this.keys.list,
      this.keys.listByRenter,
      this.keys.listNames,
    ]);

    this.logger.log('Branch cache invalidated');
  }
}
