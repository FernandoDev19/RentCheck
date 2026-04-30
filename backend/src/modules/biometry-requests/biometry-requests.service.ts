import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BiometryRequest } from './entities/biometry-request.entity';
import { Repository } from 'typeorm';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { ListResponse } from '../../shared/interfaces/list-response';
import { StatusBiometryRequest } from './enums/status-biometry-request.enum';
import { ResultBecomeEnum } from './enums/result-become.enum';
import { Logger } from '@nestjs/common';
import { BiometryRequestsCacheService } from '../../core/cache/services/biometry-requests-cache.service';

@Injectable()
export class BiometryRequestsService {
  private readonly logger: Logger = new Logger(BiometryRequestsService.name);

  constructor(
    @InjectRepository(BiometryRequest)
    private readonly biometryRequestRepository: Repository<BiometryRequest>,
    private readonly biometryRequestsCacheService: BiometryRequestsCacheService,
  ) {}

  async findAll(
    page: number = 1,
    limit: number = 10,
    user: UserActiveInterface,
  ): Promise<ListResponse<BiometryRequest>> {
    this.logger.log(`FindAll: ${user.email}`);

    let where = {};

    if ((user.role as RolesEnum) != RolesEnum.ADMIN) {
      where = { renterId: user.renterId };
    }

    const [data, total] = await this.biometryRequestRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      cache: {
        id: this.biometryRequestsCacheService.keys.list,
        milliseconds: 60000,
      },
    });

    this.logger.log(`FindAll: ${user.email} - ${total} registros`);

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // Solicitar biometría (empleado)
  async requestBiometry(
    customerId: string,
    user: UserActiveInterface,
  ): Promise<BiometryRequest> {
    this.logger.log(`RequestBiometry: ${user.email} - ${customerId}`);

    const existing = await this.biometryRequestRepository.findOne({
      where: {
        customerId,
        renterId: user.renterId,
        status: StatusBiometryRequest.PENDING,
      },
      relations: ['employee'],
    });

    if (existing) {
      throw new ConflictException(
        'Ya hay una solicitud pendiente para este cliente',
      );
    }

    const biometryRequest = this.biometryRequestRepository.create({
      customerId,
      renterId: user.renterId,
      branchId: user.branchId || null,
      employeeId: user.employeeId || null,
      providerReference: `SIM-${Date.now()}`, // simulado
      status: StatusBiometryRequest.PENDING,
    });

    this.logger.log(
      `RequestBiometry: ${user.email} - ${customerId} - Solicitud creada`,
    );

    await this.biometryRequestsCacheService.invalidateAll();

    return await this.biometryRequestRepository.save(biometryRequest);
  }

  // Simular resultado (página pública con el token)
  async simulateResult(
    token: string,
    result: ResultBecomeEnum,
  ): Promise<BiometryRequest> {
    this.logger.log(`SimulateResult: ${token} - ${result}`);

    const biometryRequest = await this.biometryRequestRepository.findOne({
      where: { token },
    });

    if (!biometryRequest) {
      this.logger.error(`SimulateResult: ${token} - Token inválido`);
      throw new NotFoundException('Token inválido');
    }
    if (biometryRequest.status !== StatusBiometryRequest.PENDING) {
      this.logger.error(`SimulateResult: ${token} - Solicitud procesada`);
      throw new ConflictException('Esta solicitud ya fue procesada');
    }

    biometryRequest.status = StatusBiometryRequest.COMPLETED;
    biometryRequest.result = result;

    this.logger.log(
      `SimulateResult: ${token} - ${result} - Solicitud procesada`,
    );

    await this.biometryRequestsCacheService.invalidateAll();

    return await this.biometryRequestRepository.save(biometryRequest);
  }
}
