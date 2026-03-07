import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { ILike, Repository } from 'typeorm';
import { RolesService } from '../roles/roles.service';
import { RolesEnum } from '../../core/enums/roles.enum';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { ListResponse } from '../../core/interfaces/list-response';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly roleService: RolesService,
    private readonly userService: UsersService,
  ) {}

  // async create(
  //   createEmployeeDto: CreateEmployeeDto,
  //   user: UserActiveInterface,
  // ) {
  //   const role = await this.roleService.findOneByName(RolesEnum.EMPLOYEE);

  //   const employeeExists = await this.employeeRepository.findOne({
  //     where: {
  //       identityNumber: createEmployeeDto.identityNumber,
  //       branchId: user.branchId,
  //     },
  //   });

  //   if (employeeExists) throw new ConflictException('Employee already exists');

  //   const employee = this.employeeRepository.create({
  //     ...createEmployeeDto,
  //     branchId: user.branchId,
  //   });
  //   const savedEmployee = await this.employeeRepository.save(employee);

  //   await this.userService.create({
  //     name: createEmployeeDto.name,
  //     email: createEmployeeDto.email,
  //     password: await bcrypt.hash(createEmployeeDto.password, 10),
  //     roleId: role.id || 3,
  //     employeeId: savedEmployee.id,
  //   });

  //   return savedEmployee;
  // }

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'ASC',
    search: string = '',
    user: UserActiveInterface,
  ): Promise<ListResponse<Employee>> {
    const safeOrderDir =
      String(orderDir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedOrderBy = new Set<keyof Employee>([
      'name',
      'identityNumber',
      'createdAt',
    ]);

    const safeOrderBy = allowedOrderBy.has(orderBy as keyof Employee)
      ? (orderBy as keyof Employee)
      : 'createdAt';

    let where: any[] = [];
    switch (user.role as RolesEnum) {
      case RolesEnum.OWNER:
        where = [
          { branch: { renterId: user.renterId }, name: ILike(`%${search}%`) },
          {
            branch: { renterId: user.renterId },
            identityNumber: ILike(`%${search}%`),
          },
        ];
        break;
      case RolesEnum.MANAGER:
        where = [
          { branchId: user.branchId, name: ILike(`%${search}%`) },
          { branchId: user.branchId, identityNumber: ILike(`%${search}%`) },
        ];
        break;
    }

    const [data, total] = await this.employeeRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      where,
      order: {
        [safeOrderBy]: safeOrderDir,
      },
      relations: ['user', 'branch'],
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: UserActiveInterface) {
    try {
      const employee = await this.employeeRepository.findOne({
        where: [{ id }, { branchId: user.branchId }],
        relations: ['user'],
      });

      if (!employee) throw new NotFoundException('employee not found');

      return employee;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error.response || 'Error trying to find user',
      );
    }
  }

  async update(
    id: string,
    updateEmployeeDto: UpdateEmployeeDto,
    user: UserActiveInterface,
  ) {
    await this.findOne(id, user);
    return await this.employeeRepository.update(id, updateEmployeeDto);
  }

  async remove(id: string, user: UserActiveInterface) {
    await this.findOne(id, user);
    return await this.employeeRepository.delete(id);
  }
}
