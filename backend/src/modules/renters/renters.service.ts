import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRenterDto } from './dto/create-renter.dto';
import { UpdateRenterDto } from './dto/update-renter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Renter } from './entities/renter.entity';
import { ILike, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { RolesEnum } from '../../core/enums/roles.enum';
import { ListResponse } from '../../core/interfaces/list-response';
import { RenterStatus } from './enums/renter-status.enum';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/enums/user-status.enum';

@Injectable()
export class RentersService {
  constructor(
    @InjectRepository(Renter)
    private readonly renterRepository: Repository<Renter>,
    private readonly userService: UsersService,
    private readonly roleService: RolesService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createRenterDto: CreateRenterDto) {
    const role = await this.roleService.findOneByName(RolesEnum.OWNER);

    const renterExists = await this.renterRepository.findOne({
      where: [
        { nit: createRenterDto.nit },
        { name: ILike(createRenterDto.name) },
        { phone: createRenterDto.phone },
        {
          user: {
            email: createRenterDto.email,
          },
        },
      ],
      relations: ['user'],
    });

    if (renterExists) throw new ConflictException('Renter already exists');

    const renter = this.renterRepository.create(createRenterDto);
    const savedRenter = await this.renterRepository.save(renter);

    await this.userService.create({
      name: createRenterDto.name,
      email: createRenterDto.email,
      password: createRenterDto.password,
      roleId: role.id,
      renterId: savedRenter.id,
    });

    return savedRenter;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'DESC',
    search: string = '',
  ): Promise<ListResponse<Renter>> {
    const safeOrderDir =
      String(orderDir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedOrderBy = new Set<keyof Renter>([
      'name',
      'nit',
      'phone',
      'city',
      'balance',
      'status',
      'createdAt',
    ]);
    const safeOrderBy = allowedOrderBy.has(orderBy as keyof Renter)
      ? (orderBy as keyof Renter)
      : 'createdAt';

    const [data, total] = await this.renterRepository.findAndCount({
      select: [
        'id',
        'name',
        'nit',
        'city',
        'address',
        'phone',
        'plan',
        'balance',
        'createdAt',
        'status',
      ],
      take: limit,
      skip: (page - 1) * limit,
      relations: ['plan'],
      where: [
        { name: ILike(`%${search}%`) },
        { nit: ILike(`%${search}%`) },
        { phone: ILike(`%${search}%`) },
      ],
      order: {
        [safeOrderBy]: safeOrderDir,
        status: 'ASC',
      },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    try {
      const renter = await this.renterRepository
        .createQueryBuilder('renter')
        .leftJoinAndSelect('renter.plan', 'plan')
        .leftJoinAndSelect('renter.user', 'user')
        .leftJoinAndSelect('user.role', 'role')
        .select([
          'renter.id',
          'renter.name',
          'renter.nit',
          'renter.city',
          'renter.address',
          'renter.phone',
          'renter.legalRepresentative',
          'plan.id',
          'plan.name',
          'user.id',
          'user.email',
          'role.name',
          'renter.planExpiresAt',
          'renter.balance',
          'renter.lowBalanceThreshold',
          'renter.lowBalanceAlertEnabled',
          'renter.createdAt',
          'renter.updatedAt',
          'renter.status',
          'renter.totalRentals',
          'renter.totalBranches',
        ])
        .where('renter.id = :id', { id })
        .getOne();

      if (!renter) throw new NotFoundException('Renter not found');

      return renter;
    } catch (error) {
      throw new BadRequestException(
        error.response || 'Error trying to find user',
      );
    }
  }

  async update(id: string, updateRenterDto: UpdateRenterDto) {
    const renter = await this.findOne(id);

    await this.renterRepository.update(id, {
      name: updateRenterDto.name,
      nit: updateRenterDto.nit,
      city: updateRenterDto.city,
      address: updateRenterDto.address,
      phone: updateRenterDto.phone,
      legalRepresentative: updateRenterDto.legalRepresentative,
      planId: updateRenterDto.planId,
      planExpiresAt: updateRenterDto.planExpiresAt,
      balance: updateRenterDto.balance,
      lowBalanceThreshold: updateRenterDto.lowBalanceThreshold,
      lowBalanceAlertEnabled: updateRenterDto.lowBalanceAlertEnabled,
      status: updateRenterDto.status,
    });

    if (updateRenterDto.name || updateRenterDto.email) {
      await this.userService.updateByRenterId(id, {
        name: updateRenterDto.name,
        email: updateRenterDto.email,
        status:
          updateRenterDto.status === RenterStatus.ACTIVE
            ? UserStatus.ACTIVE
            : UserStatus.SUSPENDED,
      });
    }

    return renter;
  }

  async remove(id: string) {
    const renter = await this.renterRepository.findOne({
      where: { id },
      select: ['id', 'status'],
      relations: ['user'],
    });
    const user = await this.userRepository.findOne({
      where: { id: renter.user.id },
    });
    if (!renter && !user)
      throw new NotFoundException('Rentadora no encontrada');

    renter.status = RenterStatus.SUSPENDED;
    user.status = UserStatus.SUSPENDED;

    await this.userRepository.save(user);
    return await this.renterRepository.save(renter);
  }
}
