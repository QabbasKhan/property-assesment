import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Search,
  Query,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import { ApiTags } from '@nestjs/swagger';
import path from 'path';
import { Paginate } from 'src/common/decorators/pagination.decorator';
import { Pagination } from 'src/common/utils/types.util';
import { ROLE } from '../users/enums/user.enum';
import { Auth } from 'src/common/decorators/auth.decorator';
import { IUser } from '../users/entities/user.entity';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@ApiTags('ANALYTICS')
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Auth(ROLE.USER, ROLE.ADMIN)
  @Post('/create')
  async create(
    @GetUser() user: IUser,
    @Body() createAnalyticsDto: CreateAnalyticsDto,
  ) {
    const data = await this.analyticsService.create(user, createAnalyticsDto);
    return { data };
  }

  @Auth(ROLE.USER, ROLE.ADMIN)
  @Get('/all')
  async getAll(
    @GetUser() user: IUser,
    @Paginate() pagination: Pagination,
    @Query() query: { search: string; status: string },
  ) {
    const data = await this.analyticsService.getAll(user, pagination, query);
    return { data };
  }

  @Auth(ROLE.USER, ROLE.ADMIN)
  @Get('report/:id')
  async generateReportData(@Param('id') id: string) {
    const data = await this.analyticsService.generateReportData(id);
    return { data };
  }

  @Auth(ROLE.USER, ROLE.ADMIN)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.analyticsService.findOne(id);
    return { data };
  }

  @Auth(ROLE.USER, ROLE.ADMIN)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAnalyticsDto: UpdateAnalyticsDto,
  ) {
    const data = await this.analyticsService.update(id, updateAnalyticsDto);
    return { data };
  }

  // @Delete('/deleteAll')
  // removeAll() {
  //   return this.analyticsService.removeMany();
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.analyticsService.remove(id);
  }
}
