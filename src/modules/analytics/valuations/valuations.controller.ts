import { Body, Controller, Get, Param } from '@nestjs/common';
import { ValuationsService } from './valuations.service';
import { calculateRemainingMortgageBalance } from 'src/common/utils/fr-mortgage-filter.util';

@Controller({ path: 'valuations', version: '1' })
export class ValuationsController {
  constructor(private readonly valuationsService: ValuationsService) {}

  // @Post('/test')
  // async getValuation(@Body() dto: CreateValuationDto) {
  //   const data = await this.valuationsService.calculateValuation(dto);
  //   return { data };
  // }

  @Get('/test')
  async test(
    @Body()
    body: {
      startValue: number; // F16
      refinancePayment: number; // F24
      annualIncreasePercent: number; // F1, e.g., 0.0050833 (%)
      targetMonth: number; // targetMonth - startMonth
      refMonth: number;
    },
  ) {
    return await calculateRemainingMortgageBalance(
      body.startValue,
      body.annualIncreasePercent,
      body.refinancePayment,
      body.targetMonth,
      // body.refMonth,
    );
  }

  @Get('/:id')
  async findOne(@Param('id') id: string) {
    const data = await this.valuationsService.calculateValuationFromId(id);
    return { data };
  }
}
