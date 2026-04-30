import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { RolesService } from '../roles/roles.service';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly rolesService: RolesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    this.logger.log(`Creating user: ${createUserDto.email}`);

    const userExists = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email: createUserDto.email })
      .getOne();

    if (userExists) throw new ConflictException('User already exists');

    const user = this.userRepository.create({
      ...createUserDto,
      password: await bcrypt.hash(createUserDto.password, 10),
    });

    this.logger.log(`User created: ${user.email}`);

    return await this.userRepository.save(user);
  }

  async findAll(page: number = 1, limit: number = 10, role?: RolesEnum) {
    this.logger.log(`Finding all users: ${page} ${limit} ${role}`);

    const roleExist = await this.rolesService.findOneByName(role);

    if (role) {
      const users = await this.userRepository.find({
        where: { role: roleExist },
        take: limit,
        skip: (page - 1) * limit,
      });

      return users;
    }

    const users = await this.userRepository.find({
      take: limit,
      skip: (page - 1) * limit,
    });

    this.logger.log(`Users found: ${users.length}`);

    return users;
  }

  async findOne(id: string) {
    this.logger.log(`Finding user: ${id}`);

    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        this.logger.error(`User not found: ${id}`);
        throw new NotFoundException('User not found');
      }

      this.logger.log(`User found: ${user.email}`);

      return user;
    } catch (error) {
      this.logger.error(`Error finding user: ${error}`);
      const msg =
        error instanceof Error
          ? ((error as { response?: string }).response ?? error.message)
          : String(error);
      throw new BadRequestException(msg);
    }
  }

  async findOneByEmail(email: string) {
    this.logger.log(`Finding user by email: ${email}`);

    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'name',
        'email',
        'password',
        'roleId',
        'renterId',
        'branchId',
        'employeeId',
        'status',
      ],
      relations: ['role'],
    });

    if (!user) {
      this.logger.error(`User not found: ${email}`);
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User found: ${user.email}`);

    return user;
  }

  async findOneByEmailWithPassword(email: string) {
    this.logger.log(`Finding user by email: ${email}`);

    let user: User;

    try {
      user = await this.userRepository.findOne({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          renterId: true,
          employeeId: true,
          branchId: true,
          roleId: true,
          status: true,
        },
        relations: ['role'],
      });
    } catch (error) {
      this.logger.error(`Error finding user by email: ${email} - ${error}`);
      throw new UnauthorizedException('Email o usuario no existe');
    }

    if (!user) {
      this.logger.error(`User not found: ${email}`);
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User found: ${user.email}`);

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    this.logger.log(`Updating user: ${id}`);

    await this.findOne(id);

    const userUpdated = await this.userRepository.update(id, updateUserDto);

    this.logger.log(`User updated: ${JSON.stringify(userUpdated)}`);

    return userUpdated;
  }

  async updateByRenterId(id: string, updateUserDto: UpdateUserDto) {
    this.logger.log(`Updating user by renter id: ${id}`);

    const renterExists = await this.userRepository.findOne({
      where: { renterId: id },
    });

    if (!renterExists) {
      this.logger.error(`Renter not found: ${id}`);
      throw new NotFoundException('Renter not found');
    }

    const userUpdated = await this.userRepository.update(
      renterExists.id,
      updateUserDto,
    );

    this.logger.log(`User updated: ${JSON.stringify(userUpdated)}`);

    return userUpdated;
  }

  async profile({ email, role }: UserActiveInterface) {
    this.logger.log(`Finding profile: ${email} ${role}`);

    switch (role as RolesEnum) {
      case RolesEnum.OWNER: {
        const owner = await this.userRepository.findOne({
          where: { email },
          select: ['id', 'name', 'email', 'role', 'renter'],
          relations: ['renter', 'renter.plan'],
        });

        this.logger.log(`Owner found: ${JSON.stringify(owner)}`);

        return owner;
      }
      case RolesEnum.MANAGER: {
        const manager = await this.userRepository.findOne({
          where: { email },
          select: ['id', 'name', 'email', 'role', 'branch'],
          relations: ['branch', 'branch.renter', 'branch.renter.plan'],
        });

        this.logger.log(`Manager found: ${JSON.stringify(manager)}`);

        return manager;
      }
      case RolesEnum.EMPLOYEE: {
        const employee = await this.userRepository.findOne({
          where: { email },
          select: ['id', 'name', 'email', 'role', 'employee'],
          relations: [
            'employee',
            'employee.branch',
            'employee.branch.renter',
            'employee.branch.renter.plan',
          ],
        });

        this.logger.log(`Employee found: ${JSON.stringify(employee)}`);

        return employee;
      }
      case RolesEnum.ADMIN: {
        const admin = await this.userRepository.findOne({
          where: { email },
          select: ['id', 'name', 'email', 'role'],
        });

        this.logger.log(`Admin found: ${JSON.stringify(admin)}`);

        return admin;
      }
      default: {
        const user = await this.userRepository.findOne({
          where: { email },
          select: ['id', 'name', 'email', 'role'],
        });

        this.logger.log(`User found: ${JSON.stringify(user)}`);

        return user;
      }
    }
  }

  // async remove(id: string) {
  //   const userExist = await this.userRepository.findOne({
  //     where: { id },
  //     relations: ['role'],
  //   });

  //   if (!userExist) {
  //     throw new NotFoundException('User not found');
  //   }

  //   switch (userExist.role.name as RolesEnum) {
  //     case RolesEnum.OWNER: {
  //       await this.rentersService.remove(userExist.renterId);

  //       await this.userRepository.update(id, { status: 'inactive' });

  //       return await this.userRepository.softDelete(id);
  //     }
  //     case RolesEnum.MANAGER:
  //       // TODO: Delete manager
  //       break;
  //     case RolesEnum.EMPLOYEE:
  //       // TODO: Delete employee
  //       break;
  //   }
  // }
}
