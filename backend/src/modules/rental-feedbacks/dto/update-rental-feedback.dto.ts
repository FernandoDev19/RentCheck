import { PartialType } from '@nestjs/mapped-types';
import { CreateRentalFeedbackDto } from './create-rental-feedback.dto';

export class UpdateRentalFeedbackDto extends PartialType(CreateRentalFeedbackDto) {}
