import { PartialType } from '@nestjs/mapped-types';
import { RegisterBranchDto } from './register-branch.dto';

export class UpdateBranchDto extends PartialType(RegisterBranchDto) {}
