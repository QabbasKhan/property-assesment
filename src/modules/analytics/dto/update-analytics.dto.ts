import { PartialType } from '@nestjs/swagger';
import { CreateAnalyticsDto } from './create-analytics.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateAnalyticsDto extends PartialType(CreateAnalyticsDto) {}
