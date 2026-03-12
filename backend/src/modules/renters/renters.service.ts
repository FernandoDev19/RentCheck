import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRenterDto } from './dto/create-renter.dto';
import { UpdateRenterDto } from './dto/update-renter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Renter } from './entities/renter.entity';
import { ILike, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { RolesEnum } from '../../core/enums/roles.enum';
import { ListResponse } from '../../core/interfaces/list-response';

@Injectable()
export class RentersService {
  constructor(
    @InjectRepository(Renter)
    private readonly renterRepository: Repository<Renter>,
    private readonly userService: UsersService,
    private readonly roleService: RolesService,
  ) {}

  async create(createRenterDto: CreateRenterDto) {
    const role = await this.roleService.findOneByName(RolesEnum.OWNER);

    const renterExists = await this.renterRepository.findOne({
      where: [{ nit: createRenterDto.nit }, { name: createRenterDto.name }],
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

    return savedRenter;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'ASC',
    search: string = '',
  ): Promise<ListResponse<Renter>> {
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
    try {
      const renter = await this.renterRepository.findOne({ where: { id } });

      if (!renter) throw new NotFoundException('Renter not found');

      return renter;
    } catch (error) {
      throw new BadRequestException(
        error.response || 'Error trying to find user',
      );
    }
  }

  async update(id: string, updateRenterDto: UpdateRenterDto) {
    await this.findOne(id);
    await this.renterRepository.update(id, updateRenterDto);

    if (
      updateRenterDto.name ||
      updateRenterDto.email ||
      updateRenterDto.password
    ) {
      await this.userService.updateByRenterId(id, {
        name: updateRenterDto.name,
        email: updateRenterDto.email,
        password: updateRenterDto.password,
      });
    }

    return await this.findOne(id);
  }

  // async remove(id: string) {
  //   const renter = await this.renterRepository.findOne({ where: { id } });
  //   if (!renter) throw new NotFoundException('Rentadora no encontrada');

  //   renter.status = 'suspended';
  //   await this.renterRepository.save(renter);

  //   return await this.renterRepository.softDelete(id);
  // }
}
