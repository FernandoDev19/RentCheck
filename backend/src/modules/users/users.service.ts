import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RolesEnum } from '../../core/enums/roles.enum';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly rolesService: RolesService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
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

    return await this.userRepository.save(user);
  }

  async findAll(page: number = 1, limit: number = 10, role?: RolesEnum) {
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

    return users;
  }

  async findOne(id: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw new BadRequestException(
        error.response || 'Error trying to find user',
      );
    }
  }

  async findOneByEmail(email: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { email },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw new BadRequestException(
        error.response || 'Error trying to find user',
      );
    }
  }

  async findOneByEmailWithPassword(email: string) {
    return await this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        renterId: true,
        employeeId: true,
        roleId: true,
      },
      relations: ['role'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    return await this.userRepository.update(id, updateUserDto);
  }

  async updateByRenterId(id: string, updateUserDto: UpdateUserDto) {
    const renterExists = await this.userRepository.findOne({
      where: { renterId: id },
    });

    if (!renterExists) {
      throw new NotFoundException('Renter not found');
    }

    return await this.userRepository.update(renterExists.id, updateUserDto);
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
