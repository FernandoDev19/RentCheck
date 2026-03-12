import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { Brackets, FindOptionsWhere, ILike, In, IsNull, Repository } from 'typeorm';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { ListResponse } from '../../core/interfaces/list-response';
import { RolesEnum } from '../../core/enums/roles.enum';
import { CreateRentalManualDto } from './dto/create-rental-manual.dto';
import { Customer } from '../customers/entities/customer.entity';
import { RentalStatusEnum } from './enums/rental-status.enum';

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  // async create(createRentalDto: CreateRentalDto) {
  //   const rentalExists = await this.rentalRepository.findOne({
  //     where: {
  //       customerId: createRentalDto.customerId,
  //       renterId: createRentalDto.renterId,
  //       status: 'active',
  //     },
  //     relations: ['renter'],
  //   });

  //   if (rentalExists) throw new BadRequestException('Rental already exists');

  //   if (rentalExists.renter.status === 'suspended') {
  //     throw new ForbiddenException(
  //       'Rental cannot be created for a suspended renter',
  //     );
  //   }

  //   const rental = this.rentalRepository.create(createRentalDto);
  //   return await this.rentalRepository.save(rental);
  // }

  async createManualRental(
    dto: CreateRentalManualDto,
    user: UserActiveInterface,
  ) {
    // 2. Buscar o Crear Cliente
    let customer = await this.customerRepository.findOne({
      where: {
        identityNumber: dto.identityNumber,
      },
    });

    if (!customer) {
      // Si no existe, lo creamos con los datos del DTO [cite: 72, 73]
      const savedCustomer = this.customerRepository.create({
        ...dto,
        registeredByUserId: user.sub,
      });
      customer = await this.customerRepository.save(savedCustomer);
    }

    // 3. Validar si ya tiene rentas ACTIVAS en esta rentadora
    const debtRentals = await this.rentalRepository.find({
      where: {
        customerId: customer.id,
        renterId: user.renterId,
        rentalStatus: In([RentalStatusEnum.ACTIVE, RentalStatusEnum.LATE]),
      },
    });

    const lateCount = debtRentals.filter(
      (r) => r.rentalStatus === RentalStatusEnum.LATE,
    ).length;
    const activeCount = debtRentals.filter(
      (r) => r.rentalStatus === RentalStatusEnum.ACTIVE,
    ).length;

    // 1. Bloqueo Fulminante por moroso
    if (lateCount > 0) {
      throw new BadRequestException(
        `¡Epa! Este cliente tiene ${lateCount} rentas ATRASADAS. Que devuelva eso primero.`,
      );
    }

    // 2. Bloqueo por "Cupo Lleno" (Seguridad de activos)
    if (activeCount >= 3) {
      throw new BadRequestException(
        `El cliente ya tiene 3 carros activos. Por política de seguridad, no puede llevarse más al tiempo.`,
      );
    }

    // 4. Crear la Renta
    const rental = this.rentalRepository.create({
      customerId: customer.id,
      renterId: user.renterId,
      branchId: user.branchId || null,
      employeeId: user.employeeId || null,
      startDate: new Date(),
      expectedReturnDate: dto.expectedReturnDate,
      rentalStatus: RentalStatusEnum.ACTIVE,
    });

    return await this.rentalRepository.save(rental);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'ASC',
    search: string = '',
    user: UserActiveInterface,
  ): Promise<ListResponse<Rental>> {
    const safeOrderDir =
      String(orderDir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedOrderBy = new Set<keyof Rental>([
      'startDate',
      'expectedReturnDate',
      'actualReturnDate',
      'rentalStatus',
      'createdAt',
    ]);
    const safeOrderBy = allowedOrderBy.has(orderBy as keyof Rental)
      ? (orderBy as keyof Rental)
      : 'createdAt';

    const qb = this.rentalRepository
      .createQueryBuilder('rental')
      .leftJoinAndSelect('rental.renter', 'renter')
      .leftJoinAndSelect('rental.branch', 'branch')
      .leftJoinAndSelect('rental.employee', 'employee')
      .leftJoinAndSelect('rental.customer', 'customer')
      .leftJoinAndSelect('rental.receivedByUser', 'receivedByUser')
      .leftJoinAndSelect('rental.cancelledByUser', 'cancelledByUser')
      // 👇 Solo biometrías de MI rentadora
      .leftJoinAndSelect(
        'customer.biometryRequests',
        'biometryRequests',
        'biometryRequests.renterId = :renterId',
        { renterId: user.renterId },
      );

    switch (user.role as RolesEnum) {
      case RolesEnum.EMPLOYEE:
      case RolesEnum.MANAGER:
        qb.andWhere(
          '(rental.branchId = :branchId OR (rental.renterId = :renterId AND rental.branchId IS NULL))',
          { branchId: user.branchId },
        );
        break;
      case RolesEnum.OWNER:
        qb.andWhere('rental.renterId = :renterId', { renterId: user.renterId });
        break;
    }

    if (search) {
      qb.andWhere(
        `(renter.name ILIKE :search 
        OR branch.name ILIKE :search 
        OR employee.name ILIKE :search 
        OR customer.name ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    qb.orderBy(`rental.${safeOrderBy}`, safeOrderDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findAllByCustomer(
    customerId: string,
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'ASC',
    search: string = '',
    user: UserActiveInterface,
  ): Promise<ListResponse<Rental>> {
    if (!user) throw new UnauthorizedException('No hay usuario activo, llave');

    const safeOrderDir =
      String(orderDir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const qb = this.rentalRepository
      .createQueryBuilder('rental')
      .leftJoinAndSelect('rental.renter', 'renter')
      .leftJoinAndSelect('rental.branch', 'branch')
      .leftJoinAndSelect('rental.employee', 'employee')
      .leftJoinAndSelect('rental.rentalFeedback', 'rentalFeedback')
      // Relación para ver quién hizo cada movimiento
      .leftJoinAndSelect('rental.receivedByUser', 'receivedByUser')
      .leftJoinAndSelect('rental.cancelledByUser', 'cancelledByUser')

      .where('rental.customerId = :customerId', { customerId })
      .andWhere(
        new Brackets((qb2) => {
          qb2
            .where('rental.renterId = :myRenterId', {
              myRenterId: user.renterId,
            })
            .orWhere('rental.rentalStatus IN (:...publicStatus)', {
              publicStatus: ['returned', 'late'],
            });
        }),
      );

    if (search) {
      qb.andWhere(
        '(renter.name ILIKE :search OR branch.name ILIKE :search OR employee.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy(`rental.${orderBy}`, safeOrderDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async findAllPendingFeedback(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'ASC',
    search: string = '',
    user: UserActiveInterface,
  ): Promise<ListResponse<Rental>> {
    const safeOrderDir =
      String(orderDir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedOrderBy = new Set<keyof Rental>([
      'startDate',
      'expectedReturnDate',
      'actualReturnDate',
      'rentalStatus',
      'createdAt',
    ]);

    const safeOrderBy = allowedOrderBy.has(orderBy as keyof Rental)
      ? (orderBy as keyof Rental)
      : 'createdAt';

    const qb = this.rentalRepository
      .createQueryBuilder('rental')
      .leftJoin('rental.rentalFeedback', 'feedback')
      .leftJoinAndSelect('rental.renter', 'renter')
      .leftJoinAndSelect('rental.branch', 'branch')
      .leftJoinAndSelect('rental.employee', 'employee')
      .leftJoinAndSelect('rental.customer', 'customer')
      .leftJoinAndSelect('customer.biometryRequests', 'biometryRequests')
      .where('feedback.id IS NULL')
      .andWhere('rental.rentalStatus = :status', {
        status: RentalStatusEnum.RETURNED,
      });

    switch (user.role as RolesEnum) {
      case RolesEnum.EMPLOYEE:
      case RolesEnum.MANAGER:
        qb.andWhere(
          '(rental.branchId = :branchId OR (rental.renterId = :renterId AND rental.branchId IS NULL))',
          { branchId: user.branchId, renterId: user.renterId },
        );
        break;
      case RolesEnum.OWNER:
        qb.andWhere('rental.renterId = :renterId', { renterId: user.renterId });
        break;
    }

    if (search) {
      qb.andWhere(
        `(renter.name ILIKE :search 
        OR branch.name ILIKE :search 
        OR employee.name ILIKE :search 
        OR customer.name ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    qb.orderBy(`rental.${safeOrderBy}`, safeOrderDir)
      .skip((page - 1) * limit)
      .take(limit);

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
      let where = {};

      switch (user.role as RolesEnum) {
        case RolesEnum.EMPLOYEE:
          where = { id, employeeId: user.employeeId };
          break;
        case RolesEnum.MANAGER:
          where = { id, branchId: user.branchId };
          break;
        case RolesEnum.OWNER:
          where = { id, renterId: user.renterId };
          break;
      }

      const rental = await this.rentalRepository.findOne({
        where,
      });

      if (!rental) throw new NotFoundException('Rental not found');

      return rental;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error.response || 'Error trying to find user',
      );
    }
  }

  async returnRental(id: string, user: UserActiveInterface) {
    const rental = await this.rentalRepository.findOne({
      where: { id },
      select: ['id', 'renterId', 'branchId', 'employeeId', 'rentalStatus'],
    });

    if (!rental) throw new NotFoundException('Renta no encontrada');

    if (
      rental.rentalStatus !== RentalStatusEnum.ACTIVE &&
      rental.rentalStatus !== RentalStatusEnum.LATE
    ) {
      throw new BadRequestException(
        `No puedes devolver una renta que ya está en estado: ${rental.rentalStatus}`,
      );
    }

    return await this.rentalRepository.update(id, {
      rentalStatus: RentalStatusEnum.RETURNED,
      actualReturnDate: new Date(),
      receivedByUserId: user.sub,
    });
  }

  async remove(id: string, user: UserActiveInterface) {
    const rental = await this.rentalRepository.findOne({
      where: { id },
      select: ['id', 'renterId', 'branchId', 'employeeId', 'rentalStatus'],
    });

    if (!rental) throw new NotFoundException('Renta no encontrada');

    if (
      rental.rentalStatus !== RentalStatusEnum.ACTIVE &&
      rental.rentalStatus !== RentalStatusEnum.LATE
    ) {
      throw new BadRequestException(
        `No puedes cancelar una renta que ya está en estado: ${rental.rentalStatus}`,
      );
    }

    let canDelete = false;

    switch (user.role as RolesEnum) {
      case RolesEnum.OWNER:
        if (rental.renterId === user.renterId) canDelete = true;
        break;
      case RolesEnum.MANAGER:
        if (rental.branchId === user.branchId) canDelete = true;
        break;
      case RolesEnum.EMPLOYEE:
        if (rental.employeeId === user.employeeId) canDelete = true;
        break;
    }

    if (!canDelete) {
      throw new ForbiddenException(
        'No tienes permiso para cancelar esta renta',
      );
    }

    return await this.rentalRepository.update(id, {
      rentalStatus: RentalStatusEnum.CANCELLED,
      cancelledByUserId: user.sub,
    });
    // return await this.rentalRepository.softDelete(id);
  }
}
