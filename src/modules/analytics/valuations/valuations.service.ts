import { Injectable } from '@nestjs/common';
import { CreateValuationDto } from './dto/create-valuation.dto';
import { UpdateValuationDto } from './dto/update-valuation.dto';
import {
  calculateDownPayment,
  calculateInvestment,
  calculatePurchasePrice,
} from 'src/common/utils/fr-valuation-filter.util';
import { CreateAnalyticsDto } from '../dto/create-analytics.dto';

@Injectable()
export class ValuationsService {
  async calculateValuation(dto: CreateValuationDto) {
    const {
      asking_price,
      offer_perc,
      financing_ltv_perc,
      bank_fee_and_closing_cost,
      reserved_amount,
    } = dto;

    const calc_purchasePrice = calculatePurchasePrice(asking_price, offer_perc);

    const calc_downPayment = calculateDownPayment(
      calc_purchasePrice,
      financing_ltv_perc,
    );

    const calc_investment = calculateInvestment(
      calc_downPayment,
      bank_fee_and_closing_cost,
      reserved_amount,
    );

    return {
      purchasePrice: calc_purchasePrice,
      downPayment: calc_downPayment,
      closingCosts: bank_fee_and_closing_cost,
      reserve: reserved_amount,
      investment: calc_investment,
    };
  }

  findAll() {
    return `This action returns all valuations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} valuation`;
  }

  update(id: number, updateValuationDto: UpdateValuationDto) {
    return `This action updates a #${id} valuation`;
  }

  remove(id: number) {
    return `This action removes a #${id} valuation`;
  }
}
