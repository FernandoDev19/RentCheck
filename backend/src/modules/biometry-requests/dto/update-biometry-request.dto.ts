import { PartialType } from '@nestjs/mapped-types';
import { CreateBiometryRequestDto } from './create-biometry-request.dto';

export class UpdateBiometryRequestDto extends PartialType(CreateBiometryRequestDto) {}
