import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { ILike, Repository } from 'typeorm';
import { RolesService } from '../roles/roles.service';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { ListResponse } from '../../core/interfaces/list-response';
import { User } from '../users/entities/user.entity';
import { RolesEnum } from '../../core/enums/roles.enum';
import { UserStatus } from '../users/enums/user-status.enum';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly roleService: RolesService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // async create(createBranchDto: CreateBranchDto) {
  //   const role = await this.roleService.findOneByName(RolesEnum.MANAGER);

  //   const brachExists = await this.branchRepository.findOne({
  //     where: [
  //       { name: createBranchDto.name },
  //       { phone: createBranchDto.phone },
  //       { email: createBranchDto.email },
  //     ],
  //   });

  //   if (brachExists) throw new ConflictException('Branch already exists');

  //   const branch = this.branchRepository.create(createBranchDto);
  //   const savedBranch = await this.branchRepository.save(branch);

  //   await this.userService.create({
  //     name: createBranchDto.name,
  //     email: createBranchDto.email,
  //     password: await bcrypt.hash(createBranchDto.password, 10),
  //     roleId: role.id || 3,
  //     branchId: savedBranch.id,
  //   });

  //   return savedBranch;
  // }

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'ASC',
    search: string = '',
    user: UserActiveInterface,
  ): Promise<ListResponse<Branch>> {
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
    });

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
    });

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
      .skip((page - 1) * limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: UserActiveInterface) {
    try {
      const branch = await this.branchRepository.findOne({
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

      if (!branch) throw new NotFoundException('Branch not found');

      if (
        (user.role as RolesEnum) !== RolesEnum.ADMIN &&
        (user.role as RolesEnum) !== RolesEnum.OWNER &&
        branch.renterId !== user.renterId
      )
        throw new UnauthorizedException('Unauthorized');

      return branch;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error(error);
      throw new BadRequestException(
        error.response || 'Error trying to find branch',
      );
    }
  }

  async update(
    id: string,
    updateBranchDto: UpdateBranchDto,
    user: UserActiveInterface,
  ) {
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
    }

    return await this.branchRepository.update(id, {
      name: updateBranchDto.name,
      address: updateBranchDto.address,
      city: updateBranchDto.city,
      phone: updateBranchDto.phone,
      responsible: updateBranchDto.responsible,
      email: updateBranchDto.email,
      status: updateBranchDto.status,
    });
  }

  async remove(id: string, user: UserActiveInterface) {
    await this.findOne(id, user);

    await this.update(id, { status: false }, user);

    await this.userRepository.softDelete({
      branchId: id,
    });

    return await this.branchRepository.softDelete(id);
  }
}
