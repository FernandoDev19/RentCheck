import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {
  private readonly logger: Logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role) private readonly RoleRepository: Repository<Role>,
  ) {}

  async findOne(id: number) {
    this.logger.log(`FindOne: ${id}`);

    const role = await this.RoleRepository.findBy({ id });

    if (!role) {
      this.logger.error(`FindOne: ${id} - Role not found`);
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  async findOneByName(name: string): Promise<Role> {
    this.logger.log(`FindOneByName: ${name}`);

    const role = await this.RoleRepository.findOneBy({ name });

    if (!role) {
      this.logger.error(`FindOneByName: ${name} - Role not found`);
      throw new NotFoundException('Role not found');
    }

    return role;
  }
}
