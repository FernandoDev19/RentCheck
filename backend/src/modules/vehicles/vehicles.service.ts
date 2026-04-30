import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { Brackets, Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { Renter } from '../renters/entities/renter.entity';
import { RenterStatus } from '../renters/enums/renter-status.enum';
import { ListResponse } from '../../shared/interfaces/list-response';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleStatus } from './enums/vehicle-status.enum';

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
    @InjectRepository(Renter)
    private readonly renterRepository: Repository<Renter>,
  ) {}

  async create(data: CreateVehicleDto, user: UserActiveInterface) {
    this.logger.log(`Create: ${user.email} - Vehicle: ${data.plate}`);

    switch (user.role as RolesEnum) {
      case RolesEnum.OWNER:
        if (!data.branchId) {
          throw new BadRequestException('Branch ID is required for owners');
        }
        break;
    }

    const vehicleCount = await this.vehicleRepository.count({
      where: { renterId: user.renterId },
    });

    const renter = await this.renterRepository.findOne({
      where: { id: user.renterId },
      relations: ['plan'],
    });

    if (renter.status === RenterStatus.SUSPENDED)
      throw new UnauthorizedException('This renter is suspended');

    if (vehicleCount >= renter.plan.max_vehicles) {
      throw new ForbiddenException(
        'Has alcanzado el límite de vehículos de tu plan',
      );
    }

    const vehicleExists = await this.vehicleRepository.findOne({
      where: { plate: data.plate },
    });

    if (vehicleExists) {
      throw new ConflictException('Vehicle already exists');
    }

    const vehicle = this.vehicleRepository.create({
      ...data,
      renterId: user.renterId,
      branchId: data.branchId || user.branchId,
    });

    return this.vehicleRepository.save(vehicle);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'status',
    orderDir: string = 'DESC',
    search: string = '',
    user: UserActiveInterface,
  ): Promise<ListResponse<Vehicle>> {
    this.logger.log(`FindAll: ${user.email}`);

    const qb = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.branch', 'branch');

    // 1. FILTRO DE SEGURIDAD (Capa base)
    if ((user.role as RolesEnum) === RolesEnum.OWNER) {
      qb.where('vehicle.renterId = :renterId', { renterId: user.renterId });
    } else if (
      (user.role as RolesEnum) === RolesEnum.MANAGER ||
      (user.role as RolesEnum) === RolesEnum.EMPLOYEE
    ) {
      qb.where('vehicle.branchId = :branchId', { branchId: user.branchId });
    }

    // 2. BUSCADOR DINÁMICO (Con el truco del ::text para los números)
    if (search) {
      qb.andWhere(
        new Brackets((orQb) => {
          orQb
            .where('vehicle.plate ILIKE :s', { s: `%${search}%` })
            .orWhere('vehicle.brand ILIKE :s', { s: `%${search}%` })
            .orWhere('vehicle.model ILIKE :s', { s: `%${search}%` })
            .orWhere('vehicle.color ILIKE :s', { s: `%${search}%` })
            // Aquí tiramos el pase de gol: convertimos a texto
            .orWhere('vehicle.year::text ILIKE :s', { s: `%${search}%` })
            .orWhere('vehicle.insured_value::text ILIKE :s', {
              s: `%${search}%`,
            });
        }),
      );
    }

    // 3. ORDEN Y PAGINACIÓN
    const safeOrderDir = orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    // Validamos el campo de orden para evitar inyecciones SQL
    const allowedFields = [
      'plate',
      'brand',
      'model',
      'year',
      'color',
      'insuredValue',
      'status',
      'branch',
      'createdAt',
    ];
    const safeOrderBy = allowedFields.includes(orderBy) ? orderBy : 'createdAt';

    qb.orderBy(`vehicle.${safeOrderBy}`, safeOrderDir)
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

  async findAllAvailable(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'status',
    orderDir: string = 'DESC',
    search: string = '',
    user: UserActiveInterface,
    branchId?: string,
  ): Promise<ListResponse<Vehicle>> {
    this.logger.log(`FindAllAvailable: ${user.email} - Branch: ${branchId}`);

    const qb = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.branch', 'branch')
      .select([
        'vehicle.id',
        'vehicle.brand',
        'vehicle.model',
        'vehicle.year',
        'vehicle.color',
        'vehicle.plate',
        'vehicle.insuredValue',
        'vehicle.createdAt',
        'vehicle.status',
      ]);

    // 1. FILTRO DE SEGURIDAD (Capa base)
    if ((user.role as RolesEnum) === RolesEnum.OWNER) {
      if (branchId) {
        // Owner con branchId específico: filtrar por esa sede
        qb.where(
          'vehicle.renterId = :renterId AND vehicle.branchId = :branchId AND vehicle.status = :vehicleStatus',
          {
            renterId: user.renterId,
            branchId,
            vehicleStatus: VehicleStatus.AVAILABLE,
          },
        );
      } else {
        // Owner sin branchId: todas las sedes del renter
        qb.where(
          'vehicle.renterId = :renterId AND vehicle.status = :vehicleStatus',
          { renterId: user.renterId, vehicleStatus: VehicleStatus.AVAILABLE },
        );
      }
    } else if (
      (user.role as RolesEnum) === RolesEnum.MANAGER ||
      (user.role as RolesEnum) === RolesEnum.EMPLOYEE
    ) {
      qb.where(
        'vehicle.branchId = :branchId AND vehicle.status = :vehicleStatus',
        { branchId: user.branchId, vehicleStatus: VehicleStatus.AVAILABLE },
      );
    }

    // 2. BUSCADOR DINÁMICO (Con el truco del ::text para los números)
    if (search) {
      qb.andWhere(
        new Brackets((orQb) => {
          orQb
            .where('vehicle.plate ILIKE :s', { s: `%${search}%` })
            .orWhere('vehicle.brand ILIKE :s', { s: `%${search}%` })
            .orWhere('vehicle.model ILIKE :s', { s: `%${search}%` })
            .orWhere('vehicle.color ILIKE :s', { s: `%${search}%` })
            // Aquí tiramos el pase de gol: convertimos a texto
            .orWhere('vehicle.year::text ILIKE :s', { s: `%${search}%` })
            .orWhere('vehicle.insured_value::text ILIKE :s', {
              s: `%${search}%`,
            });
        }),
      );
    }

    // 3. ORDEN Y PAGINACIÓN
    const safeOrderDir = orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    // Validamos el campo de orden para evitar inyecciones SQL
    const allowedFields = [
      'plate',
      'brand',
      'model',
      'year',
      'color',
      'insuredValue',
      'status',
      'createdAt',
    ];
    const safeOrderBy = allowedFields.includes(orderBy) ? orderBy : 'createdAt';

    qb.orderBy(`vehicle.${safeOrderBy}`, safeOrderDir)
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

  async findAvailableByDateRange(
    startDate: string,
    endDate: string,
    page: number,
    limit: number,
    search: string,
    user: UserActiveInterface,
    branchId?: string,
  ) {
    this.logger.log(
      `FindAvailableByDateRange: ${user.email} - Branch: ${branchId}`,
    );

    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (!start || !end) return { data: [], total: 0, page, lastPage: 0 };

    const qb = this.vehicleRepository
      .createQueryBuilder('vehicle')
      // Join con rentas que se solapan con el rango buscado
      .leftJoin(
        'vehicle.rentals',
        'conflictRental',
        `conflictRental.rentalStatus IN (:...activeStatuses)
      AND conflictRental.startDate < :endDate
      AND conflictRental.expectedReturnDate > :startDate`,
        {
          activeStatuses: ['active', 'late', 'pending'],
          startDate: start,
          endDate: end,
        },
      )
      // Solo vehículos sin conflicto Y no robados
      .where('conflictRental.id IS NULL')
      .andWhere('vehicle.status NOT IN (:...badStatus)', {
        badStatus: ['stolen', 'maintenance', 'sold'],
      });

    // Scope por rol
    if ((user.role as RolesEnum) === RolesEnum.OWNER) {
      qb.andWhere('vehicle.renterId = :renterId', { renterId: user.renterId });
      if (branchId) qb.andWhere('vehicle.branchId = :branchId', { branchId });
    } else {
      qb.andWhere('vehicle.branchId = :branchId', { branchId: user.branchId });
    }

    if (search) {
      qb.andWhere(
        new Brackets((b) => {
          b.where('vehicle.plate ILIKE :s', { s: `%${search}%` })
            .orWhere('vehicle.brand ILIKE :s', { s: `%${search}%` })
            .orWhere('vehicle.model ILIKE :s', { s: `%${search}%` })
            .orWhere('vehicle.color ILIKE :s', { s: `%${search}%` });
        }),
      );
    }

    qb.skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, lastPage: Math.ceil(total / limit) };
  }

  async assertVehicleReservableInRange(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    user: UserActiveInterface,
  ) {
    this.logger.log(
      `AssertVehicleReservableInRange: ${user.email} - Vehicle: ${vehicleId}`,
    );

    const vehicle = await this.findOne(vehicleId, user);

    const dealBreakers = [
      VehicleStatus.STOLEN,
      VehicleStatus.SOLD,
      VehicleStatus.MAINTENANCE,
    ];
    if (dealBreakers.includes(vehicle.status)) {
      throw new BadRequestException(
        `El vehículo no está disponible por estado: ${vehicle.status}`,
      );
    }

    const qb = this.vehicleRepository
      .createQueryBuilder('vehicle')
      .leftJoin(
        'vehicle.rentals',
        'conflictRental',
        `conflictRental.rentalStatus IN (:...statuses)
        AND NOT (
          conflictRental.expectedReturnDate <= :startDate OR 
          conflictRental.startDate >= :endDate
        )`,
        {
          statuses: ['active', 'late', 'pending'],
          startDate,
          endDate,
        },
      )
      .where('vehicle.id = :vehicleId', { vehicleId })
      .andWhere('conflictRental.id IS NULL');

    const available = await qb.getCount();
    if (!available) {
      throw new ConflictException(
        'El vehículo ya tiene una reserva o renta en esas fechas.',
      );
    }
  }

  async findOne(id: string, user: UserActiveInterface) {
    this.logger.log(`FindOne: ${user.email} - Vehicle: ${id}`);

    let vehicle: Vehicle;

    try {
      vehicle = await this.vehicleRepository.findOne({
        where: { id },
      });
    } catch (error) {
      this.logger.error('Error trying to find vehicle', error);
      throw new BadRequestException('Error trying to find vehicle');
    }

    if (!vehicle) throw new NotFoundException('Vehicle not found');

    if (
      (user.role as RolesEnum) !== RolesEnum.ADMIN &&
      (user.role as RolesEnum) !== RolesEnum.OWNER &&
      vehicle.renterId !== user.renterId
    )
      throw new UnauthorizedException('Unauthorized');

    this.logger.log(`FindOne: ${user.email} - Vehicle: ${id} - Encontrado`);

    return vehicle;
  }

  async update(id: string, data: UpdateVehicleDto, user: UserActiveInterface) {
    this.logger.log(`Update: ${user.email} - Vehicle: ${id}`);

    const vehicle = await this.findOne(id, user);

    if (vehicle && data.plate != vehicle.plate && !data.status) {
      const vehicleWithPlateExists = await this.vehicleRepository.findOne({
        where: { plate: data.plate },
      });

      if (vehicleWithPlateExists) {
        throw new ConflictException(
          'Vehicle with plate ' + data.plate + ' already exists',
        );
      }
    }

    return await this.vehicleRepository.update(id, data);
  }

  async markAsStolen(id: string) {
    this.logger.log(`MarkAsStolen: Vehicle: ${id}`);

    return await this.vehicleRepository.update(id, {
      status: VehicleStatus.STOLEN,
    });
  }

  async rentVehicle(id: string, user: UserActiveInterface) {
    this.logger.log(`RentVehicle: ${user.email} - Vehicle: ${id}`);

    const vehicle = await this.findOne(id, user);

    if (
      [VehicleStatus.STOLEN, VehicleStatus.MAINTENANCE].includes(vehicle.status)
    ) {
      throw new BadRequestException(
        'No se puede entregar un vehículo en este estado físico.',
      );
    }

    return await this.vehicleRepository.update(id, {
      status: VehicleStatus.RENTED,
    });
  }

  async returnVehicle(id: string, user: UserActiveInterface) {
    this.logger.log(`ReturnVehicle: ${user.email} - Vehicle: ${id}`);

    const vehicle = await this.findOne(id, user);

    const isVehicleRented = vehicle.status === VehicleStatus.RENTED;

    if (!isVehicleRented) {
      throw new BadRequestException('Vehicle is not rented');
    }

    return await this.vehicleRepository.update(id, {
      status: VehicleStatus.AVAILABLE,
    });
  }

  async remove(id: string, user: UserActiveInterface) {
    this.logger.log(`Remove: ${user.email} - Vehicle: ${id}`);

    await this.findOne(id, user);

    return await this.vehicleRepository.softDelete(id);
  }
}
