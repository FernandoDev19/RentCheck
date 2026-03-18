import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './entities/customer.entity';
import { Repository } from 'typeorm';
import { RentalFeedback } from '../rental-feedbacks/entities/rental-feedback.entity';
import { ListResponse } from '../../core/interfaces/list-response';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { RolesEnum } from '../../core/enums/roles.enum';
import { CustomerStatusEnum } from './enums/customer-status.enum';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(RentalFeedback)
    private readonly rentalFeedbackRepository: Repository<RentalFeedback>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const customerExists = await this.customerRepository.findOne({
      where: [{ identityNumber: createCustomerDto.identityNumber }],
    });

    if (customerExists) throw new ConflictException('Customer already exists');

    const customer = this.customerRepository.create(createCustomerDto);
    return await this.customerRepository.save(customer);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'DESC',
    search: string = '',
    user: UserActiveInterface,
  ): Promise<ListResponse<Customer>> {
    const safeOrderDir =
      String(orderDir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedOrderBy = new Set<keyof Customer>([
      'identityType',
      'identityNumber',
      'name',
      'lastName',
      'phone',
      'email',
      'generalScore',
      'status',
      'createdAt',
    ]);
    const safeOrderBy = allowedOrderBy.has(orderBy as keyof Customer)
      ? (orderBy as keyof Customer)
      : 'createdAt';

    let rentalFilterCondition = 'filterRental.renterId = :renterId';
    const parameters: Record<string, any> = { renterId: user.renterId };

    switch (user.role as RolesEnum) {
      case RolesEnum.OWNER:
        rentalFilterCondition = 'filterRental.renterId = :renterId';
        break;
      case RolesEnum.MANAGER:
      case RolesEnum.EMPLOYEE:
        rentalFilterCondition = 'filterRental.branchId = :branchId';
        parameters.branchId = user.branchId;
        break;
      default:
        rentalFilterCondition = '';
        break;
    }

    const qb = this.customerRepository
      .createQueryBuilder('customer')
      // Filtramos clientes que pertenecen a MI rentadora
      .innerJoin('customer.rentals', 'filterRental', rentalFilterCondition)
      .leftJoinAndSelect('customer.registeredByUser', 'creator')
      // Traemos SOLO mis biometrías
      .leftJoinAndSelect(
        'customer.biometryRequests',
        'biometryRequests',
        'biometryRequests.renterId = :renterId',
      )
      .setParameters(parameters);

    if (search) {
      qb.andWhere(
        `(customer.name ILIKE :search 
          OR customer.lastName ILIKE :search 
          OR customer.identityNumber ILIKE :search 
          OR customer.email ILIKE :search 
          OR customer.phone ILIKE :search)`,
        { search: `%${search}%` },
      );
    }

    qb.select([
      'customer.id',
      'customer.identityType',
      'customer.identityNumber',
      'customer.name',
      'customer.lastName',
      'customer.phone',
      'customer.email',
      'customer.generalScore',
      'customer.status',
      'customer.createdAt',
      'customer.updatedAt',
      'biometryRequests',
    ])
      .orderBy(`customer.${safeOrderBy}`, safeOrderDir)
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

  async findOneByIdentityNumber(
    identityNumber: string,
    user: UserActiveInterface,
  ) {
    const qb = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.registeredByUser', 'creatorUser')
      .leftJoinAndSelect('creatorUser.renter', 'creatorRenter') // Owner
      .leftJoinAndSelect('creatorUser.employee', 'creatorEmployee') // Employee
      .leftJoinAndSelect('creatorEmployee.branch', 'creatorEmpBranch') // Employee → Branch
      .leftJoinAndSelect('creatorEmpBranch.renter', 'creatorEmpRenter') // Employee → Branch → Renter
      .leftJoinAndSelect('creatorUser.branch', 'creatorBranch') // Manager
      .leftJoinAndSelect('creatorBranch.renter', 'creatorBranchRenter') // Manager → Renter
      // 3. Rentas
      .leftJoinAndSelect('customer.rentals', 'rentals')
      .leftJoinAndSelect('rentals.renter', 'renter')
      .leftJoinAndSelect('rentals.employee', 'rentalEmployee')
      .leftJoinAndSelect('rentalEmployee.user', 'rentalEmployeeUser')
      .leftJoinAndSelect('rentals.branch', 'branch')
      .leftJoinAndSelect('rentals.rentalFeedback', 'rentalFeedback')
      // 4. Biometrías solo de MI rentadora
      .leftJoinAndSelect(
        'customer.biometryRequests',
        'biometryRequests',
        'biometryRequests.renterId = :renterId',
        { renterId: user.renterId },
      )
      .select([
        'customer.id',
        'customer.name',
        'customer.lastName',
        'customer.status',
        'customer.generalScore',
        'customer.email',
        'customer.phone',
        'customer.identityType',
        'customer.identityNumber',
        'customer.createdAt',
        'customer.updatedAt',
        'creatorUser.name',
        'rentals.id',
        'rentals.startDate',
        'rentals.actualReturnDate',
        'rentalFeedback.id',
        'rentalFeedback.criticalFlags',
        'rentalFeedback.score',
        'rentalFeedback.comments',
        'biometryRequests.id',
        'biometryRequests.status',
        'biometryRequests.result',
        'biometryRequests.createdAt',
        'renter.id',
        'renter.name',
        'branch.city',
        'renter.city',
      ])
      .where('LOWER(customer.identityNumber) = LOWER(:identityNumber)', {
        identityNumber,
      })
      .orderBy('rentals.createdAt', 'DESC');

    const customer = await qb.getOne();

    if (!customer)
      throw new NotFoundException('Cliente sin historial en RentCheck.');

    const rentedWithMe = customer.rentals?.some(
      (rental) => rental.renter?.name && rental.renter.id === user.renterId,
    );

    if (!rentedWithMe && (user.role as RolesEnum) !== RolesEnum.ADMIN) {
      customer.phone = customer.phone ? '🔒 Privado' : null;
      customer.email = customer.email ? '🔒 Privado' : null;
    }

    return customer;
  }

  async findOne(id: string, user: UserActiveInterface) {
    const parameters: Record<string, any> = { renterId: user.renterId };

    switch (user.role as RolesEnum) {
      case RolesEnum.OWNER:
        break;
      case RolesEnum.MANAGER:
      case RolesEnum.EMPLOYEE:
        parameters.branchId = user.branchId;
        break;
      default:
        break;
    }

    const qb = this.customerRepository
      .createQueryBuilder('customer')
      .innerJoin(
        'customer.rentals',
        'securityRental',
        (user.role as RolesEnum) === RolesEnum.MANAGER ||
          (user.role as RolesEnum) === RolesEnum.EMPLOYEE
          ? 'securityRental.branchId = :branchId'
          : 'securityRental.renterId = :renterId',
      )
      .leftJoinAndSelect('customer.registeredByUser', 'creator')
      .leftJoinAndSelect(
        'customer.biometryRequests',
        'biometryRequests',
        'biometryRequests.renterId = :renterId',
      )
      .leftJoinAndSelect(
        'customer.rentals',
        'rentals',
        'rentals.rentalStatus IN (:...status)',
        { status: ['returned', 'late', 'cancelled'] },
      )
      .innerJoinAndSelect('rentals.rentalFeedback', 'rentalFeedback')
      .leftJoinAndSelect('rentals.renter', 'renter')
      .setParameters(parameters);

    qb.select([
      'customer.id',
      'customer.identityType',
      'customer.identityNumber',
      'customer.name',
      'customer.lastName',
      'customer.phone',
      'customer.email',
      'customer.generalScore',
      'customer.status',
      'customer.createdAt',
      'customer.updatedAt',
      'biometryRequests',
      'creator.name',
      'rentals.id',
      'rentals.actualReturnDate',
      'rentals.startDate',
      'rentalFeedback',
      'renter.id',
      'renter.name',
    ]).where('customer.id = :id', { id });

    const customer = await qb.getOne();

    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    if (customer.rentals) {
      customer.rentals = customer.rentals.slice(0, 5);
    }

    return customer;
  }

  // async update(
  //   id: string,
  //   updateCustomerDto: UpdateCustomerDto,
  //   user: UserActiveInterface,
  // ) {
  //   await this.findOne(id, user);

  //   return await this.customerRepository.update(id, updateCustomerDto);
  // }

  // async remove(id: string, user: UserActiveInterface) {
  //   await this.findOne(id, user);

  //   return await this.customerRepository.delete(id);
  // }

  async recalculateCustomerScore(customerId: string): Promise<number> {
    // Obtener todos los feedbacks del cliente
    const feedbacks = await this.rentalFeedbackRepository
      .createQueryBuilder('feedback')
      .innerJoin('feedback.rental', 'rental')
      .where('rental.customerId = :customerId', { customerId })
      .getMany();

    if (feedbacks.length === 0) {
      // Sin feedbacks, score es 5 y status normal
      await this.customerRepository.update(customerId, {
        generalScore: 5,
        status: CustomerStatusEnum.NORMAL,
      });
      return 5;
    }

    // Verificar si tiene critical flags
    const hasCriticalFlags = feedbacks.some(
      (feedback) =>
        feedback.criticalFlags.impersonation ||
        feedback.criticalFlags.vehicleTheft,
    );

    const totalScore = feedbacks.reduce((sum, feedback) => {
      const feedbackScore =
        (feedback.score.damageToCar +
          feedback.score.unpaidFines +
          feedback.score.arrears +
          feedback.score.carAbuse +
          feedback.score.badAttitude) /
        5;

      return sum + feedbackScore;
    }, 0);

    const averageScore = totalScore / feedbacks.length;
    const roundedScore = Math.round(averageScore * 100) / 100; // 2 decimales

    // Determinar el status basado en las reglas
    let status: CustomerStatusEnum;

    if (hasCriticalFlags) {
      // Prioridad 1: Critical flags = red_alert
      status = CustomerStatusEnum.RED_ALERT;
    } else if (roundedScore < 3) {
      // Prioridad 2: Score bajo = yellow_alert
      status = CustomerStatusEnum.YELLOW_ALERT;
    } else {
      // Todo bien = normal
      status = CustomerStatusEnum.NORMAL;
    }

    // Actualizar el cliente con score y status
    await this.customerRepository.update(customerId, {
      generalScore: roundedScore,
      status: status,
    });

    return roundedScore;
  }
}
