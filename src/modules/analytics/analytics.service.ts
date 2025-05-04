import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import { ValuationsService } from './valuations/valuations.service';
import { InjectModel } from '@nestjs/mongoose';
import { Analytics } from './entities/analytics.entity';
import { Model } from 'mongoose';
import { MortgagesService } from './mortgages/mortgages.service';
import { Pagination } from 'src/common/utils/types.util';

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

  async getAll(pagination: Pagination, query: { search: string, status: string}) {
    const dbQuery = {
          ...(!!query.search && { saveAs: { $regex: query.search, $options: 'i' } }),
          ...(!!query.status && query.status !== 'all' && {status: query.status})
        };

        const data = await this.Analytic.find(dbQuery).skip(pagination.skip).limit(pagination.limit)
        const totalAmount = await this.Analytic.countDocuments(dbQuery)

        return {data, totalAmount}
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
