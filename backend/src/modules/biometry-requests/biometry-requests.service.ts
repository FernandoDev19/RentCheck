import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BiometryRequest } from './entities/biometry-request.entity';
import { Repository } from 'typeorm';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { RolesEnum } from '../../core/enums/roles.enum';
import { ListResponse } from '../../core/interfaces/list-response';
import { StatusBiometryRequest } from './enums/status-biometry-request.enum';
import { ResultBecomeEnum } from './enums/result-become.enum';

@Injectable()
export class BiometryRequestsService {
  constructor(
    @InjectRepository(BiometryRequest)
    private readonly biometryRequestRepository: Repository<BiometryRequest>,
  ) {}

  // async create(createBiometryRequestDto: CreateBiometryRequestDto) {
  //   const biometryRequest = this.biometryRequestRepository.create(
  //     createBiometryRequestDto,
  //   );
  //   return await this.biometryRequestRepository.save(biometryRequest);
  // }

  async findAll(
    page: number = 1,
    limit: number = 10,
    user: UserActiveInterface,
  ): Promise<ListResponse<BiometryRequest>> {
    let where = {};

    if ((user.role as RolesEnum) != RolesEnum.ADMIN) {
      where = { renterId: user.renterId };
    }

    const [data, total] = await this.biometryRequestRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
    });

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

    return await this.biometryRequestRepository.save(biometryRequest);
  }

  // Simular resultado (página pública con el token)
  async simulateResult(
    token: string,
    result: ResultBecomeEnum,
  ): Promise<BiometryRequest> {
    const biometryRequest = await this.biometryRequestRepository.findOne({
      where: { token },
    });

    if (!biometryRequest) throw new NotFoundException('Token inválido');
    if (biometryRequest.status !== StatusBiometryRequest.PENDING) {
      throw new ConflictException('Esta solicitud ya fue procesada');
    }

    biometryRequest.status = StatusBiometryRequest.COMPLETED;
    biometryRequest.result = result;

    return await this.biometryRequestRepository.save(biometryRequest);
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} biometryRequest`;
  // }

  // update(id: number, updateBiometryRequestDto: UpdateBiometryRequestDto) {
  //   return `This action updates a #${id} biometryRequest`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} biometryRequest`;
  // }
}
