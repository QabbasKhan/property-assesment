import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import { ApiTags } from '@nestjs/swagger';
import path from 'path';

@ApiTags('ANALYTICS')
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('/create')
  async create(@Body() createAnalyticsDto: CreateAnalyticsDto) {
    const data = await this.analyticsService.create(createAnalyticsDto);
    return { data };
  }

  @Post('/all')
  async getAll(@Body() createAnalyticsDto: CreateAnalyticsDto) {
    const data = await this.analyticsService.getAll(createAnalyticsDto);
    return { data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.analyticsService.findOne(id);
    return { data };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAnalyticsDto: UpdateAnalyticsDto,
  ) {
    const data = await this.analyticsService.update(id, updateAnalyticsDto);
    return { data };
  }
  @Get()
  findAll() {
    return this.analyticsService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.analyticsService.remove(id);
  }
}
