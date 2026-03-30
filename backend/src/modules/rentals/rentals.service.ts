import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Rental } from './entities/rental.entity';
import { Brackets, In, Repository } from 'typeorm';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { ListResponse } from '../../core/interfaces/list-response';
import { RolesEnum } from '../../core/enums/roles.enum';
import { CreateRentalManualDto } from './dto/create-rental-manual.dto';
import { Customer } from '../customers/entities/customer.entity';
import { RentalStatusEnum } from './enums/rental-status.enum';
import { VehiclesService } from '../vehicles/vehicles.service';
import { VehicleStatus } from '../vehicles/enums/vehicle-status.enum';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RentalsService {
  constructor(
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    private readonly vehicleService: VehiclesService,
    private readonly config: ConfigService,
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
    let customer = await this.customerRepository.findOne({
      where: {
        identityNumber: dto.identityNumber,
      },
    });

    if (!customer) {
      const savedCustomer = this.customerRepository.create({
        ...dto,
        registeredByUserId: user.sub,
      });
      customer = await this.customerRepository.save(savedCustomer);
    }

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

    if (lateCount > 0) {
      throw new BadRequestException(
        `Este cliente tiene ${lateCount} rentas ATRASADAS. Debe devolver primero.`,
      );
    }

    if (activeCount >= 3) {
      throw new BadRequestException(
        `El cliente ya tiene 3 carros activos. Por política de seguridad, no puede llevarse más al tiempo.`,
      );
    }

    const [startYear, startMonth, startDay] = dto.startDate
      .split('-')
      .map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay); // Local

    const [endYear, endMonth, endDay] = dto.expectedReturnDate
      .split('-')
      .map(Number);
    const expectedReturnDate = new Date(endYear, endMonth - 1, endDay); // Local

    const tz = this.config.get<string>('TZ');
    const now = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');

    console.log('Now', now);
    console.log('start', startDate);
    console.log('dto start', dto.startDate);

    if (dto.startDate < now) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser en el pasado',
      );
    }

    if (expectedReturnDate <= startDate) {
      throw new BadRequestException(
        'La fecha de devolución debe ser posterior a la fecha de inicio',
      );
    }

    const initialStatus =
      dto.startDate === now
        ? RentalStatusEnum.ACTIVE
        : RentalStatusEnum.PENDING;

    const vehicle = await this.vehicleService.findOne(dto.vehicleId, user);

    if (vehicle) {
      await this.vehicleService.assertVehicleReservableInRange(
        vehicle.id,
        startDate,
        expectedReturnDate,
        user,
      );

      if (initialStatus === RentalStatusEnum.ACTIVE) {
        await this.vehicleService.rentVehicle(vehicle.id, user);
      }
    }

    const rental = this.rentalRepository.create({
      customerId: customer.id,
      renterId: user.renterId,
      branchId: dto.branchId || user.branchId || null,
      employeeId: user.employeeId || null,
      startDate: startDate,
      expectedReturnDate: expectedReturnDate,
      rentalStatus: initialStatus,
      vehicleId: dto.vehicleId,
      totalPrice: dto.totalPrice,
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
      .leftJoinAndSelect('rental.vehicle', 'vehicle')
      .leftJoinAndSelect('rental.receivedByUser', 'receivedByUser')
      .leftJoinAndSelect('rental.cancelledByUser', 'cancelledByUser')
      // 👇 Solo biometrías de MI rentadora
      .leftJoinAndSelect(
        'customer.biometryRequests',
        'biometryRequests',
        'biometryRequests.renterId = :renterId',
        { renterId: user.renterId },
      )
      .select([
        'rental.id',
        'rental.startDate',
        'rental.expectedReturnDate',
        'rental.actualReturnDate',
        'rental.rentalStatus',
        'rental.createdAt',
        'renter.id',
        'renter.name',
        'branch.id',
        'branch.name',
        'employee.id',
        'employee.name',
        'customer.id',
        'customer.name',
        'customer.lastName',
        'customer.identityNumber',
        'vehicle',
        'receivedByUser.id',
        'receivedByUser.name',
        'cancelledByUser.id',
        'cancelledByUser.name',
        'biometryRequests.id',
        'biometryRequests.status',
        'rental.totalPrice',
      ]);

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
      .leftJoinAndSelect('rental.vehicle', 'vehicle')
      .innerJoinAndSelect('rental.rentalFeedback', 'rentalFeedback')
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
              publicStatus: ['returned', 'late', 'cancelled'],
            });
        }),
      );

    if (search) {
      qb.andWhere(
        '(renter.name ILIKE :search OR branch.name ILIKE :search OR employee.name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.select([
      'rental.id',
      'renter.id',
      'renter.name',
      'branch.id',
      'branch.renterId',
      'branch.name',
      'vehicle.id',
      'vehicle.brand',
      'vehicle.model',
      'vehicle.year',
      'vehicle.color',
      'rental.startDate',
      'rental.actualReturnDate',
      'rental.rentalStatus',
      'rentalFeedback.id',
      'rentalFeedback.score',
      'rental.createdAt',
    ])
      .orderBy(`rental.${orderBy}`, safeOrderDir)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    const rentedWithMe = data.some(
      (rental) => rental.renter?.name && rental.renter.id === user.renterId,
    );

    if (!rentedWithMe && (user.role as RolesEnum) !== RolesEnum.ADMIN) {
      data.forEach((rental) => {
        rental.vehicle = null;
      });
    }

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
      .select([
        'rental.id',
        'customer.id',
        'customer.name',
        'customer.lastName',
        'renter.id',
        'renter.name',
        'branch.id',
        'branch.name',
        'employee.id',
        'employee.name',
        'rental.startDate',
        'rental.expectedReturnDate',
        'rental.rentalStatus',
      ])
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
      const qb = this.rentalRepository
        .createQueryBuilder('rental')
        .leftJoinAndSelect('rental.renter', 'renter')
        .leftJoinAndSelect('rental.branch', 'branch')
        .leftJoinAndSelect('rental.employee', 'employee')
        .leftJoinAndSelect('rental.rentalFeedback', 'rentalFeedback');

      const selectFields = [
        'rental.id',
        'renter.id',
        'renter.name',
        'branch.id',
        'branch.name',
        'employee.id',
        'employee.name',
        'rental.rentalStatus',
        'rental.startDate',
        'rental.expectedReturnDate',
        'rental.actualReturnDate',
        'rentalFeedback.id',
        'rentalFeedback.score',
        'rentalFeedback.criticalFlags',
        'rental.totalPrice',
      ];

      qb.where('rental.id = :id', { id });

      const rental = await qb.select(selectFields).getOne();

      if (!rental) throw new NotFoundException('Rental not found');

      const isOwnerOfData = rental.renter.id === user.renterId;

      if (!isOwnerOfData) {
        delete rental.employee;
        delete rental.branch;
      }

      return rental;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.response || error);
    }
  }

  async assignVehicle(
    rentalId: string,
    vehicleId: string,
    user: UserActiveInterface,
  ) {
    // Buscar la renta
    const rental = await this.rentalRepository.findOne({
      where: { id: rentalId },
      relations: ['vehicle'],
    });

    if (!rental) throw new NotFoundException('Renta no encontrada');

    // Verificar que la renta esté activa
    if (
      rental.rentalStatus !== RentalStatusEnum.ACTIVE &&
      rental.rentalStatus !== RentalStatusEnum.PENDING
    ) {
      throw new BadRequestException(
        'Solo se puede asignar vehículo a rentas activas o pendientes',
      );
    }

    // Verificar que no tenga vehículo asignado
    if (rental.vehicleId && rental.rentalStatus !== RentalStatusEnum.PENDING) {
      throw new BadRequestException('Esta renta ya tiene un vehículo asignado');
    }

    if (rental.vehicleId && rental.rentalStatus === RentalStatusEnum.PENDING) {
      await this.rentalRepository.update(rentalId, { vehicleId: null });
    }

    // Verificar permisos según el rol
    if ((user.role as RolesEnum) === RolesEnum.OWNER) {
      if (rental.renterId !== user.renterId) {
        throw new UnauthorizedException(
          'No tienes permiso para modificar esta renta',
        );
      }
    } else if (
      (user.role as RolesEnum) === RolesEnum.MANAGER ||
      (user.role as RolesEnum) === RolesEnum.EMPLOYEE
    ) {
      if (rental.branchId !== user.branchId) {
        throw new UnauthorizedException(
          'No tienes permiso para modificar esta renta',
        );
      }
    }

    await this.vehicleService.assertVehicleReservableInRange(
      vehicleId,
      new Date(rental.startDate),
      new Date(rental.expectedReturnDate),
      user,
    );

    if (rental.rentalStatus === RentalStatusEnum.ACTIVE) {
      const vehicle = await this.vehicleService.findOne(vehicleId, user);
      if (vehicle.status !== VehicleStatus.AVAILABLE) {
        throw new BadRequestException('El vehículo no está disponible');
      }
      await this.vehicleService.rentVehicle(vehicleId, user);
    }

    return await this.rentalRepository.update(rentalId, { vehicleId });
  }

  async returnRental(id: string, user: UserActiveInterface) {
    const rental = await this.rentalRepository.findOne({
      where: { id },
      select: [
        'id',
        'renterId',
        'branchId',
        'employeeId',
        'rentalStatus',
        'vehicleId',
      ],
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

    if (rental.vehicleId) {
      await this.vehicleService.returnVehicle(rental.vehicleId, user);
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
      select: [
        'id',
        'renterId',
        'branchId',
        'employeeId',
        'rentalStatus',
        'vehicleId',
      ],
    });

    if (!rental) throw new NotFoundException('Renta no encontrada');

    if (
      rental.rentalStatus !== RentalStatusEnum.ACTIVE &&
      rental.rentalStatus !== RentalStatusEnum.LATE &&
      rental.rentalStatus !== RentalStatusEnum.PENDING
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
      case RolesEnum.EMPLOYEE:
        if (rental.branchId === user.branchId) canDelete = true;
        break;
    }

    if (!canDelete) {
      throw new ForbiddenException(
        'No tienes permiso para cancelar esta renta',
      );
    }

    if (rental.vehicleId && rental.rentalStatus === RentalStatusEnum.ACTIVE) {
      await this.vehicleService.returnVehicle(rental.vehicleId, user);
    }

    if (rental.rentalStatus === RentalStatusEnum.PENDING) {
      return await this.rentalRepository.softDelete(id);
    }

    return await this.rentalRepository.update(id, {
      rentalStatus: RentalStatusEnum.CANCELLED,
      cancelledByUserId: user.sub,
    });
    // return await this.rentalRepository.softDelete(id);
  }
}
