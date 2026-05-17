import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateRenterDto } from './dto/create-renter.dto';
import { UpdateRenterDto } from './dto/update-renter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Renter } from './entities/renter.entity';
import { ILike, DataSource, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { ListResponse } from '../../shared/interfaces/list-response';
import { RenterStatus } from './enums/renter-status.enum';
import { User } from '../users/entities/user.entity';
import { UserStatus } from '../users/enums/user-status.enum';

@Injectable()
export class RentersService {
  private readonly logger = new Logger(RentersService.name);

  constructor(
    @InjectRepository(Renter)
    private readonly renterRepository: Repository<Renter>,
    private readonly userService: UsersService,
    private readonly roleService: RolesService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createRenterDto: CreateRenterDto) {
    this.logger.log(`Create: ${createRenterDto.email}`);

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

    this.logger.log(
      `Create: ${createRenterDto.email} - Rentadora creada con éxito`,
    );

    return savedRenter;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'DESC',
    search: string = '',
  ): Promise<ListResponse<Renter>> {
    this.logger.log(`FindAll`);

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
    this.logger.log(`FindOne: ${id}`);

    let renter: Renter;

    try {
      renter = await this.renterRepository
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
    } catch (error) {
      this.logger.error('Error trying to find renter', error);
      throw new BadRequestException('Error trying to find renter');
    }

    if (!renter) throw new NotFoundException('Renter not found');

    this.logger.log(`FindOne: ${id} - Rentadora encontrada`);

    return renter;
  }

  async update(id: string, updateRenterDto: UpdateRenterDto) {
    this.logger.log(`Update: ${id}`);

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

    this.logger.log(`Update: ${id} - Rentadora actualizada`);

    return renter;
  }

  async remove(id: string) {
    this.logger.log(`Remove: ${id}`);

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

    this.logger.log(`Remove: ${id} - Rentadora eliminada lógicamente`);

    return await this.renterRepository.save(renter);
  }

  async hardDelete(id: string): Promise<{ message: string }> {
    this.logger.log(`HardDelete: ${id}`);

    const renter = await this.renterRepository.findOne({ where: { id } });
    if (!renter) throw new NotFoundException('Rentadora no encontrada');

    await this.dataSource.transaction(async (manager) => {
      // 0. Desvincular clientes registrados por usuarios de esta rentadora
      await manager.query(
        `UPDATE customers 
         SET registered_by_user_id = NULL 
         WHERE registered_by_user_id IN (
           SELECT id FROM users WHERE renter_id = $1
           UNION
           SELECT id FROM users WHERE employee_id IN (
             SELECT id FROM employees WHERE branch_id IN (
               SELECT id FROM branches WHERE renter_id = $1
             )
           )
           UNION
           SELECT id FROM users WHERE branch_id IN (
             SELECT id FROM branches WHERE renter_id = $1
           )
         )`,
        [id],
      );

      // 1. Notificaciones de la rentadora
      await manager.query(
        `DELETE FROM notifications WHERE "renterId" = $1`,
        [id],
      );

      // 2. Biometrías asociadas a la rentadora
      await manager.query(
        `DELETE FROM biometry_requests WHERE renter_id = $1`,
        [id],
      );

      // 3. Feedbacks de rentas de la rentadora
      await manager.query(
        `DELETE FROM rental_feedbacks WHERE rental_id IN (
          SELECT id FROM rentals WHERE renter_id = $1
        )`,
        [id],
      );

      // 4. Rentas de la rentadora
      await manager.query(
        `DELETE FROM rentals WHERE renter_id = $1`,
        [id],
      );

      // 5. Vehículos de la rentadora
      await manager.query(
        `DELETE FROM vehicles WHERE renter_id = $1`,
        [id],
      );

      // 6. Usuarios de los employees (branch managers & employees)
      await manager.query(
        `DELETE FROM users WHERE employee_id IN (
          SELECT id FROM employees WHERE branch_id IN (
            SELECT id FROM branches WHERE renter_id = $1
          )
        )`,
        [id],
      );

      // 7. Empleados de las sedes de la rentadora
      await manager.query(
        `DELETE FROM employees WHERE branch_id IN (
          SELECT id FROM branches WHERE renter_id = $1
        )`,
        [id],
      );

      // 8. Usuarios manager de las sedes
      await manager.query(
        `DELETE FROM users WHERE branch_id IN (
          SELECT id FROM branches WHERE renter_id = $1
        )`,
        [id],
      );

      // 9. Sedes de la rentadora
      await manager.query(
        `DELETE FROM branches WHERE renter_id = $1`,
        [id],
      );

      // 10. Usuario owner de la rentadora
      await manager.query(
        `DELETE FROM users WHERE renter_id = $1`,
        [id],
      );

      // 11. La rentadora
      await manager.query(`DELETE FROM renters WHERE id = $1`, [id]);
    });

    this.logger.log(`HardDelete: ${id} - Rentadora eliminada permanentemente`);
    return { message: 'Rentadora eliminada permanentemente' };
  }
}
