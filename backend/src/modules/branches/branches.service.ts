import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { ILike, Repository } from 'typeorm';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { ListResponse } from '../../shared/interfaces/list-response';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/enums/user-status.enum';
import { BranchesCacheService } from '../../core/cache/services/branches-cache.service';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { RenterStatus } from '../renters/enums/renter-status.enum';
import { RegisterBranchDto } from './dto/register-branch.dto';
import { Role } from '../roles/entities/role.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BranchesService {
  private readonly logger: Logger = new Logger(BranchesService.name);

  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly branchesCacheService: BranchesCacheService,
  ) {}

  async registerBranch(
    registerBranchDto: RegisterBranchDto,
    user: UserActiveInterface,
  ) {
    this.logger.log(`RegisterBranch: ${user.email}`);

    const role = await this.roleRepository.findOne({
      where: { name: RolesEnum.MANAGER },
    });

    const userExist = await this.userRepository.findOne({
      where: { email: user.email },
      select: ['id', 'name', 'email', 'renterId'],
      relations: ['renter', 'renter.plan'],
    });

    const branchesCount = await this.branchRepository.count({
      where: { renterId: userExist.renterId },
    });

    if (!userExist) {
      this.logger.error(
        `RegisterBranch: ${user.email} - Usuario no encontrado`,
      );
      throw new NotFoundException('User not found');
    }

    if (!userExist.renter) {
      this.logger.error(
        `RegisterBranch: ${user.email} - Rentadora no encontrada`,
      );
      throw new NotFoundException('Renter not found');
    }

    if (userExist.renter.status === RenterStatus.SUSPENDED) {
      this.logger.error(`RegisterBranch: ${user.email} - Cuenta suspendida`);
      throw new ForbiddenException('Your account is suspended');
    }

    if (branchesCount >= userExist.renter.plan.max_branches) {
      this.logger.error(
        `RegisterBranch: ${user.email} - Límite de sedes alcanzado`,
      );
      throw new ForbiddenException(
        'Has alcanzado el límite de sedes de tu plan ' +
          userExist.renter.plan.name,
      );
    }

    const branchExists = await this.branchRepository.findOne({
      where: [
        { name: registerBranchDto.name, renterId: userExist.renterId },
        { phone: registerBranchDto.phone },
        { email: registerBranchDto.email },
      ],
    });

    if (branchExists) {
      if (
        branchExists.name === registerBranchDto.name &&
        branchExists.renterId === userExist.renterId
      )
        throw new ConflictException(
          'Branch name already exists in your company',
        );
      if (branchExists.phone === registerBranchDto.phone)
        throw new ConflictException('Phone already in use');
      if (branchExists.email === registerBranchDto.email)
        throw new ConflictException('Email already in use');
    }

    const branch = this.branchRepository.create({
      ...registerBranchDto,
      renterId: userExist.renterId,
    });
    const savedBranch = await this.branchRepository.save(branch);

    this.logger.log(`RegisterBranch: ${user.email} - Sede creada`);

    const userCreate = this.userRepository.create({
      name: registerBranchDto.name,
      email: registerBranchDto.email,
      password: await bcrypt.hash(registerBranchDto.password, 10),
      roleId: role.id,
      branchId: savedBranch.id,
    });

    await this.userRepository.save(userCreate);

    this.logger.log(`RegisterBranch: ${user.email} - Usuario creado`);
    await this.branchesCacheService.invalidateAll();

    return savedBranch;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'ASC',
    search: string = '',
    user: UserActiveInterface,
  ): Promise<ListResponse<Branch>> {
    this.logger.log(`FindAll: ${user.email}`);

    const safeOrderDir =
      String(orderDir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedOrderBy = new Set<keyof Branch>([
      'name',
      'email',
      'phone',
      'city',
      'responsible',
      'responsiblePhone',
      'status',
      'createdAt',
    ]);

    const safeOrderBy = allowedOrderBy.has(orderBy as keyof Branch)
      ? (orderBy as keyof Branch)
      : 'createdAt';

    const where =
      (user.role as RolesEnum) === RolesEnum.ADMIN
        ? {}
        : [
            { renterId: user.renterId, name: ILike(`%${search}%`) },
            { renterId: user.renterId, email: ILike(`%${search}%`) },
            { renterId: user.renterId, phone: ILike(`%${search}%`) },
            { renterId: user.renterId, responsible: ILike(`%${search}%`) },
          ];

    const [data, total] = await this.branchRepository.findAndCount({
      select: [
        'id',
        'name',
        'city',
        'address',
        'phone',
        'responsible',
        'status',
        'createdAt',
      ],
      take: limit,
      skip: (page - 1) * limit,
      where,
      order: {
        [safeOrderBy]: safeOrderDir,
      },
      cache: { id: this.branchesCacheService.keys.list, milliseconds: 60000 },
    });

    this.logger.log(`FindAll: ${user.email} - ${total} registros`);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findAllByRenterId(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'ASC',
    search: string = '',
    renterId: string,
  ): Promise<ListResponse<Branch>> {
    this.logger.log(`FindAllByRenterId: ${renterId}`);

    const safeOrderDir =
      String(orderDir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedOrderBy = new Set<keyof Branch>([
      'name',
      'email',
      'phone',
      'city',
      'responsible',
      'responsiblePhone',
      'status',
      'createdAt',
    ]);

    const safeOrderBy = allowedOrderBy.has(orderBy as keyof Branch)
      ? (orderBy as keyof Branch)
      : 'createdAt';

    const [data, total] = await this.branchRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      where: [
        { renterId: renterId, name: ILike(`%${search}%`) },
        { renterId: renterId, email: ILike(`%${search}%`) },
        { renterId: renterId, phone: ILike(`%${search}%`) },
        { renterId: renterId, responsible: ILike(`%${search}%`) },
      ],
      order: {
        [safeOrderBy]: safeOrderDir,
      },
      cache: {
        id: this.branchesCacheService.keys.listByRenter,
        milliseconds: 60000,
      },
    });

    this.logger.log(`FindAllByRenterId: ${renterId} - ${total} registros`);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findAllNames(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'ASC',
    search: string = '',
    user: UserActiveInterface,
  ): Promise<ListResponse<{ id: string; name: string }>> {
    this.logger.log(`FindAllNames: ${user.email}`);

    const safeOrderDir =
      String(orderDir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const qb = this.branchRepository
      .createQueryBuilder('branch')
      .select(['branch.id', 'branch.name'])
      .where('branch.renterId = :renterId', { renterId: user.renterId });

    if (search) {
      qb.andWhere('branch.name ILIKE :search', { search: `%${search}%` });
    }

    qb.orderBy(`branch.${orderBy}`, safeOrderDir)
      .take(limit)
      .skip((page - 1) * limit)
      .cache({
        id: this.branchesCacheService.keys.listNames,
        milliseconds: 60000,
      });

    const [data, total] = await qb.getManyAndCount();

    this.logger.log(`FindAllNames: ${user.email} - ${total} registros`);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: UserActiveInterface) {
    this.logger.log(`FindOne: ${user.email} - ${id}`);

    let branch: Branch;

    try {
      branch = await this.branchRepository.findOne({
        select: [
          'id',
          'name',
          'city',
          'address',
          'phone',
          'responsible',
          'email',
          'status',
          'createdAt',
          'updatedAt',
        ],
        where: { id },
      });
    } catch (error) {
      this.logger.error(`FindOne: ${user.email} - ${id} - ${error}`);
      throw new BadRequestException(error);
    }

    if (!branch) throw new NotFoundException('Branch not found');

    if (
      (user.role as RolesEnum) !== RolesEnum.ADMIN &&
      (user.role as RolesEnum) !== RolesEnum.OWNER &&
      branch.renterId !== user.renterId
    )
      throw new UnauthorizedException('Unauthorized');

    this.logger.log(`FindOne: ${user.email} - ${id} - Sede encontrada`);

    return branch;
  }

  async update(
    id: string,
    updateBranchDto: UpdateBranchDto,
    user: UserActiveInterface,
  ) {
    this.logger.log(`Update: ${user.email} - ${id}`);

    await this.findOne(id, user);

    if (updateBranchDto.name || updateBranchDto.email) {
      await this.userRepository.update(
        {
          branchId: id,
        },
        {
          name: updateBranchDto.name,
          email: updateBranchDto.email,
          status: updateBranchDto.status
            ? UserStatus.ACTIVE
            : UserStatus.SUSPENDED,
        },
      );

      this.logger.log(`Update: ${user.email} - ${id} - Usuario actualizado`);
    }

    const branchUpdate = await this.branchRepository.update(id, {
      name: updateBranchDto.name,
      address: updateBranchDto.address,
      city: updateBranchDto.city,
      phone: updateBranchDto.phone,
      responsible: updateBranchDto.responsible,
      email: updateBranchDto.email,
      status: updateBranchDto.status,
    });

    await this.branchesCacheService.invalidateAll();

    this.logger.log(`Update: ${user.email} - ${id} - Sede actualizada`);

    return branchUpdate;
  }

  async remove(id: string, user: UserActiveInterface) {
    this.logger.log(`Remove: ${user.email} - ${id}`);
    await this.findOne(id, user);

    await this.update(id, { status: false }, user);

    await this.userRepository.softDelete({
      branchId: id,
    });

    const branchDelete = await this.branchRepository.softDelete(id);

    await this.branchesCacheService.invalidateAll();

    this.logger.log(`Remove: ${user.email} - ${id} - Sede eliminada`);

    return branchDelete;
  }
}
