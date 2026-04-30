import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { Plan } from './entities/plan.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class PlansService {
  private readonly logger: Logger = new Logger(PlansService.name);

  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,
  ) {}

  async create(createPlanDto: CreatePlanDto) {
    this.logger.log(`Create: ${createPlanDto.name}`);

    const planExist = await this.planRepository.findOne({
      where: {
        name: createPlanDto.name,
      },
    });

    if (planExist) {
      this.logger.error(`Create: ${createPlanDto.name} - Plan already exists`);
      throw new ConflictException('Plan already exists');
    }

    const plan = this.planRepository.create(createPlanDto);

    this.logger.log(`Create: ${createPlanDto.name} - Plan created`);

    return this.planRepository.save(plan);
  }

  findAll() {
    this.logger.log(`FindAll`);

    return this.planRepository.find({
      cache: true,
      order: {
        name: 'ASC',
      },
    });
  }

  findOne(id: number) {
    this.logger.log(`FindOne: ${id}`);

    return this.planRepository.findOne({
      where: {
        id,
      },
    });
  }

  update(id: number, updatePlanDto: UpdatePlanDto) {
    this.logger.log(`Update: ${id}`);

    return this.planRepository.update(id, updatePlanDto);
  }

  remove(id: number) {
    this.logger.log(`Remove: ${id}`);

    return this.planRepository.delete(id);
  }
}
