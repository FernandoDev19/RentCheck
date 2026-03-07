import { ConflictException, Injectable } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from './entities/plan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PlansService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async create(createPlanDto: CreatePlanDto) {
    const planExist = await this.planRepository.findOne({
      where: {
        name: createPlanDto.name,
      },
    });

    if (planExist) throw new ConflictException('Plan already exists');

    const plan = this.planRepository.create(createPlanDto);
    return this.planRepository.save(plan);
  }

  findAll() {
    return this.planRepository.find({
      cache: true,
      order: {
        name: 'ASC',
      },
    });
  }

  findOne(id: number) {
    return this.planRepository.findOne({
      where: {
        id,
      },
    });
  }

  update(id: number, updatePlanDto: UpdatePlanDto) {
    return this.planRepository.update(id, updatePlanDto);
  }

  remove(id: number) {
    return this.planRepository.delete(id);
  }
}
