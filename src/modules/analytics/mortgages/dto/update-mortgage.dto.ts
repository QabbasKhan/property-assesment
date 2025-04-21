import { PartialType } from '@nestjs/swagger';
import { CreateMortgageDto } from './create-mortgage.dto';

export class UpdateMortgageDto extends PartialType(CreateMortgageDto) {}
