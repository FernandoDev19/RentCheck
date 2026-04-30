import { Controller, Post, Body } from '@nestjs/common';
import { RentalFeedbacksService } from './rental-feedbacks.service';
import { CreateRentalFeedbackDto } from './dto/create-rental-feedback.dto';
import { Auth } from '../../core/decorators/auth.decorator';
import { RolesEnum } from '../../shared/enums/roles.enum';
import { ActiveUser } from '../../core/decorators/active-user.decorator';
import { UserActiveInterface } from '../auth/interfaces/active-user.interface';

@Controller('rental-feedbacks')
export class RentalFeedbacksController {
  constructor(
    private readonly rentalFeedbacksService: RentalFeedbacksService,
  ) {}

  @Post()
  @Auth(RolesEnum.EMPLOYEE, RolesEnum.OWNER, RolesEnum.MANAGER)
  create(
    @Body() createRentalFeedbackDto: CreateRentalFeedbackDto,
    @ActiveUser() user: UserActiveInterface,
  ) {
    return this.rentalFeedbacksService.create(createRentalFeedbackDto, user);
  }

  // @Get(':id')
  // @Auth(...Object.values(RolesEnum))
  // findOne(@Param('id') id: string) {
  //   return this.rentalFeedbacksService.findOne(+id);
  // }

  // @Put(':id')
  // @Auth(RolesEnum.ADMIN)
  // update(
  //   @Param('id') id: string,
  //   @Body() updateRentalFeedbackDto: UpdateRentalFeedbackDto,
  // ) {
  //   return this.rentalFeedbacksService.update(+id, updateRentalFeedbackDto);
  // }

  // @Delete(':id')
  // @Auth(RolesEnum.ADMIN)
  // remove(@Param('id') id: string) {
  //   return this.rentalFeedbacksService.remove(+id);
  // }
}
