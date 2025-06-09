import { Controller, Get, Param } from '@nestjs/common';
import { ValuationsService } from './valuations.service';

@Controller({ path: 'valuations', version: '1' })
export class ValuationsController {
  constructor(private readonly valuationsService: ValuationsService) {}

  // @Post('/test')
  // async getValuation(@Body() dto: CreateValuationDto) {
  //   const data = await this.valuationsService.calculateValuation(dto);
  //   return { data };
  // }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.valuationsService.calculateValuationFromId(id);
    return { data };
  }
}
