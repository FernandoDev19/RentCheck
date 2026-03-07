import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Branch } from './entities/branch.entity';
import { ILike, Repository } from 'typeorm';
import { RolesService } from '../roles/roles.service';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { ListResponse } from '../../core/interfaces/list-response';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    private readonly roleService: RolesService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // async create(createBranchDto: CreateBranchDto) {
  //   const role = await this.roleService.findOneByName(RolesEnum.MANAGER);

  //   const brachExists = await this.branchRepository.findOne({
  //     where: [
  //       { name: createBranchDto.name },
  //       { phone: createBranchDto.phone },
  //       { email: createBranchDto.email },
  //     ],
  //   });

  //   if (brachExists) throw new ConflictException('Branch already exists');

  //   const branch = this.branchRepository.create(createBranchDto);
  //   const savedBranch = await this.branchRepository.save(branch);

  //   await this.userService.create({
  //     name: createBranchDto.name,
  //     email: createBranchDto.email,
  //     password: await bcrypt.hash(createBranchDto.password, 10),
  //     roleId: role.id || 3,
  //     branchId: savedBranch.id,
  //   });

  //   return savedBranch;
  // }

  async findAll(
    page: number = 1,
    limit: number = 10,
    orderBy: string = 'createdAt',
    orderDir: string = 'ASC',
    search: string = '',
    user: UserActiveInterface,
  ): Promise<ListResponse<Branch>> {
    const safeOrderDir =
      String(orderDir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const allowedOrderBy = new Set<keyof Branch>([
      'name',
      'email',
      'phone',
      'city',
      'responsible',
      'responsiblePhone',
      'status',
      'createdAt',
    ]);

    const safeOrderBy = allowedOrderBy.has(orderBy as keyof Branch)
      ? (orderBy as keyof Branch)
      : 'createdAt';

    const [data, total] = await this.branchRepository.findAndCount({
      take: limit,
      skip: (page - 1) * limit,
      relations: ['user'],
      where: [
        { renterId: user.renterId, name: ILike(`%${search}%`) },
        { renterId: user.renterId, email: ILike(`%${search}%`) },
        { renterId: user.renterId, phone: ILike(`%${search}%`) },
        { renterId: user.renterId, responsible: ILike(`%${search}%`) },
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

  async findAllNames(
    user: UserActiveInterface,
  ): Promise<{ id: string; name: string }[]> {
    const data = await this.branchRepository.find({
      where: { renterId: user.renterId },
    });

    return data.map((b) => ({ id: b.id, name: b.name }));
  }

  async findOne(id: string, user: UserActiveInterface) {
    try {
      const branch = await this.branchRepository.findOne({ where: { id } });

      if (!branch) throw new NotFoundException('Branch not found');

      if (branch.renterId !== user.renterId)
        throw new UnauthorizedException('Unauthorized');

      return branch;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new BadRequestException('Error trying to find branch');
    }
  }

  async update(
    id: string,
    updateBranchDto: UpdateBranchDto,
    user: UserActiveInterface,
  ) {
    await this.findOne(id, user);

    return await this.branchRepository.update(id, updateBranchDto);
  }

  async remove(id: string, user: UserActiveInterface) {
    await this.findOne(id, user);

    return await this.branchRepository.delete(id);
  }
}
