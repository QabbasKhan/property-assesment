import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import { ValuationsService } from './valuations/valuations.service';
import { InjectModel } from '@nestjs/mongoose';
import { Analytics } from './entities/analytics.entity';
import { Model } from 'mongoose';
import { MortgagesService } from './mortgages/mortgages.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly valuationsService: ValuationsService,
    private readonly mortgageService: MortgagesService,
    @InjectModel(Analytics.name) private readonly Analytic: Model<any>,
  ) {}

  async create(createAnalyticsDto: CreateAnalyticsDto) {
    return await this.Analytic.create(createAnalyticsDto);
  }

  async getAll(dto: CreateAnalyticsDto) {
    // await this.mortgageService.test(dto.)
  }

  async findOne(id: string) {
    const data = await this.Analytic.findById(id);
    if (!data) throw new BadRequestException('No Data Found With That Id');
    return data;
  }

  async update(id: string, updateAnalyticsDto: UpdateAnalyticsDto) {
    const data = await this.Analytic.findByIdAndUpdate(id, updateAnalyticsDto, {
      new: true,
    });
    if (!data) throw new BadRequestException('No Data Found With That Id');
    return data;
  }

  findAll() {
    return `This action returns all analytics`;
  }
  async remove(id: string) {
    await this.Analytic.findByIdAndDelete(id);
    return { message: 'Deleted' };
  }
}
