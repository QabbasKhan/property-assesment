import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ValuationsService } from './valuations.service';
import { CreateValuationDto } from './dto/create-valuation.dto';
import { UpdateValuationDto } from './dto/update-valuation.dto';
import { CreateAnalyticsDto } from '../dto/create-analytics.dto';

@Controller({ path: 'valuations', version: '1' })
export class ValuationsController {
  constructor(private readonly valuationsService: ValuationsService) {}

  @Post('/test')
  async getValuation(@Body() dto: CreateValuationDto) {
    const data = await this.valuationsService.calculateValuation(dto);
    return { data };
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.valuationsService.calculateValuationFromId(id);
    return { data };
  }

  // @Get()
  // findAll() {
  //   return this.valuationsService.findAll();
  // }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateValuationDto: UpdateValuationDto,
  // ) {
  //   return this.valuationsService.update(+id, updateValuationDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.valuationsService.remove(+id);
  // }
}
