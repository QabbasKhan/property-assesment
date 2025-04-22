import { Injectable } from '@nestjs/common';
import {
  calculateDownPayment,
  calculateExitValuations,
  calculateInvestment,
  calculateNoRefinance,
  calculatePurchasePrice,
  NoiProjectionCalculator,
} from 'src/common/utils/fr-valuation-filter.util';
import { CreateValuationDto } from './dto/create-valuation.dto';
import { UpdateValuationDto } from './dto/update-valuation.dto';
import {
  AnnualPaymentCalculator,
  calculateMonthlyInterestRate,
  calculateMonthlyPayment,
  calculateTotalPayments,
  generateRefinanceCalculations,
  mortgageLoanPrincipal,
} from 'src/common/utils/fr-mortgage-filter.util';

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

    const calc_monthlyRate = calculateMonthlyInterestRate(dto.loan_annual_intr); // D14

    const calc_totalPayments = calculateTotalPayments(dto.loan_terms_inyear);

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

    const calc_noiProjections = NoiProjectionCalculator.calculateProjections(
      dto.noi, // D9
      dto.annual_noi_increase, // D10
      [
        dto.occupancy1,
        dto.occupancy2,
        dto.occupancy3,
        dto.occupancy4,
        dto.occupancy4,
        dto.occupancy5,
        dto.occupancy6,
        dto.occupancy7,
        dto.occupancy8,
        dto.occupancy9,
        dto.occupancy10,
      ],
    );

    const mortgageData = generateRefinanceCalculations(
      dto.purchase_cap_rate, // H18 (e.g., 5.5)
      dto.year_5_cap_rate, // H19 (e.g., 6.0)
      dto.year_7_cap_rate, // H20 (e.g., 6.25)
      dto.year_10_cap_rate,
      calc_noiProjections,
      dto.financing_ltv_perc,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      calc_monthlyRate,
      calc_totalPayments,
    );

        //-----------------------helpers--------------------------//
        const calc_principal = mortgageLoanPrincipal(
          dto.asking_price, // D6
          dto.offer_perc, // D7
          dto.financing_ltv_perc,
        );
        const calc_monthlyPmt = calculateMonthlyPayment(
          calc_principal,
          dto.loan_annual_intr,
          dto.loan_terms_inyear,
        );
        const calc_originalPayments =
          AnnualPaymentCalculator.calculateOriginalPayments(
            calc_monthlyPmt,
            dto.number_months_intr_only,
            dto.first_month_principal_and_intr_payment,
          );
    //---------------------------------------------------------//

    const noRefinanceYear5 = calculateNoRefinance(calc_noiProjections, dto.property_manager_fee, calc_investment.toNumber(), dto.syndi_aum_ann_fee, calc_originalPayments, dto.dynamic_drop_down_one, dto.dynamic_drop_down_two, 5)
    const noRefinanceYear7 = calculateNoRefinance(calc_noiProjections, dto.property_manager_fee, calc_investment.toNumber(), dto.syndi_aum_ann_fee, calc_originalPayments, dto.dynamic_drop_down_one, dto.dynamic_drop_down_two, 7)
    const noRefinanceYear10 = calculateNoRefinance(calc_noiProjections, dto.property_manager_fee, calc_investment.toNumber(), dto.syndi_aum_ann_fee, calc_originalPayments, dto.dynamic_drop_down_one, dto.dynamic_drop_down_two, 10)


    const tableZero = calculateExitValuations(mortgageData,noRefinanceYear5, noRefinanceYear7, noRefinanceYear10,  calc_investment.toNumber(), dto.preferred_ann_return_perc, dto.waterfall_share,  dto.syndi_sale_price_fee, dto.transaction_and_bank_fee, dto.realtor_fee )

    // return {data, calc_investment}
    return {
      purchasePrice: calc_purchasePrice.toNumber(),
      downPayment: calc_downPayment.toNumber(),
      closingCosts: bank_fee_and_closing_cost,
      reserve: reserved_amount,
      investment: calc_investment.toNumber(),
      noRefinanceYear5,
      noRefinanceYear7,
      noRefinanceYear10,
      tableZero,
      noiData: calc_noiProjections,
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
