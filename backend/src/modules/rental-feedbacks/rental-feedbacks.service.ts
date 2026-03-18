import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRentalFeedbackDto } from './dto/create-rental-feedback.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RentalFeedback } from './entities/rental-feedback.entity';
import { Repository } from 'typeorm';
import { CustomersService } from '../customers/customers.service';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';
import { Rental } from '../rentals/entities/rental.entity';
import { RenterStatus } from '../renters/enums/renter-status.enum';

@Injectable()
export class RentalFeedbacksService {
  constructor(
    @InjectRepository(RentalFeedback)
    private readonly rentalFeedbackRepository: Repository<RentalFeedback>,
    private readonly customerService: CustomersService,
    @InjectRepository(Rental)
    private readonly rentalRepository: Repository<Rental>,
  ) {}

  async create(
    createRentalFeedbackDto: CreateRentalFeedbackDto,
    user: UserActiveInterface,
  ) {
    const rental = await this.rentalRepository.findOne({
      where: { id: createRentalFeedbackDto.rentalId },
      relations: ['renter'],
    });

    if (!rental) throw new NotFoundException('La renta no existe');

    if (rental.renter.status === RenterStatus.SUSPENDED) {
      throw new ForbiddenException('Rentadora suspendida');
    }

    const existingFeedback = await this.rentalFeedbackRepository.findOne({
      where: { rentalId: rental.id },
    });

    if (existingFeedback) {
      throw new BadRequestException('Ya se ha calificado esta renta');
    }

    const feedbackData = {
      ...createRentalFeedbackDto,
      employeeId: user.employeeId || null,
      branchId: user.branchId || null,
      renterId: user.renterId,
    };

    const feedback = this.rentalFeedbackRepository.create(feedbackData);

    const savedFeedback = await this.rentalFeedbackRepository.save(feedback);

    await this.customerService.recalculateCustomerScore(rental.customerId);

    return savedFeedback;
  }

  // async findAll(rentalId: string) {
  //   return await this.rentalFeedbackRepository.find({
  //     where: { rentalId },
  //   });
  // }

  // async findOne(id: string) {
  //   const rentalFeedback = await this.rentalFeedbackRepository.findOne({
  //     where: { id },
  //   });

  //   if (!rentalFeedback) {
  //     throw new NotFoundException('Rental feedback not found');
  //   }

  //   return rentalFeedback;
  // }

  // async update(id: string, updateRentalFeedbackDto: UpdateRentalFeedbackDto) {
  //   await this.findOne(id);
  //   return await this.rentalFeedbackRepository.update(
  //     id,
  //     updateRentalFeedbackDto,
  //   );
  // }

  // async remove(id: string) {
  //   await this.findOne(id);
  //   return await this.rentalFeedbackRepository.delete(id);
  // }
}
