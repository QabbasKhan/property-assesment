import { Injectable } from '@nestjs/common';
import {
  calculateCompleteNoRefinance,
  // calculateCompleteNoRefinance,
  calculateDownPayment,
  calculateExitValuations,
  calculateInvestment,
  calculateNoRefinance,
  calculatePurchasePrice,
  calculateSingleExitValuation,
  calculateWithRefinance,
  NoiProjectionCalculator,
} from 'src/common/utils/fr-valuation-filter.util';
import { CreateValuationDto } from './dto/create-valuation.dto';
import { UpdateValuationDto } from './dto/update-valuation.dto';
import {
  AnnualPaymentCalculator,
  calculateMonthlyInterestRate,
  calculateMonthlyPayment,
  calculateRemainingMortgageBalance,
  calculateTotalPayments,
  generateRefinanceCalculations,
  mortgageLoanPrincipal,
} from 'src/common/utils/fr-mortgage-filter.util';
import { PrimaryRefinanceData } from '../mortgages/entities/mortgage.entity';

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
    const primaryRefinanceData = this.getPrimaryAndRefinanceData(dto);
    const noRefinanceYear5 = calculateNoRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      calc_originalPayments,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      5,
    );
    const noRefinanceYear7 = calculateNoRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      calc_originalPayments,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      7,
    );
    const noRefinanceYear10 = calculateNoRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      calc_originalPayments,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      10,
    );
    const refinanceYear5m37 = calculateWithRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      primaryRefinanceData,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      5,
      37,
    );
    const refinanceYear7m37 = calculateWithRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      primaryRefinanceData,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      7,
      37,
    );
    const refinanceYear7m49 = calculateWithRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      primaryRefinanceData,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      7,
      49,
    );
    const refinanceYear10m37 = calculateWithRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      primaryRefinanceData,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      10,
      37,
    );
    const refinanceYear10m49 = calculateWithRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      primaryRefinanceData,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      10,
      49,
    );
    const refinanceYear10m61 = calculateWithRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      primaryRefinanceData,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      10,
      61,
    );

    // const tableZero = calculateExitValuations(mortgageData,noRefinanceYear5, noRefinanceYear7, noRefinanceYear10,  calc_investment.toNumber(), dto.preferred_ann_return_perc, dto.waterfall_share,  dto.syndi_sale_price_fee, dto.transaction_and_bank_fee, dto.realtor_fee )

    const exitValuation = [];
    const year5 = calculateSingleExitValuation(
      mortgageData,
      noRefinanceYear5,
      calc_investment.toNumber(),
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      dto.realtor_fee,
      37,
      5,
    );
    if (year5) exitValuation.push(year5);

    const year7 = calculateSingleExitValuation(
      mortgageData,
      noRefinanceYear7,
      calc_investment.toNumber(),
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      dto.realtor_fee,
      84,
      7,
    );
    if (year7) exitValuation.push(year7);

    const year10 = calculateSingleExitValuation(
      mortgageData,
      noRefinanceYear10,
      calc_investment.toNumber(),
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      dto.realtor_fee,
      120,
      10,
    );
    console.log('year10', year10);

    if (year10) exitValuation.push(year10);

    // console.log(exitValuation);

    const result5yr = calculateCompleteNoRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      calc_originalPayments,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      mortgageData,
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      dto.realtor_fee,
      5,
    );
    const result7yr = calculateCompleteNoRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      calc_originalPayments,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      mortgageData,
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      dto.realtor_fee,
      7,
    );
    const result10yr = calculateCompleteNoRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      calc_originalPayments,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      mortgageData,
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      dto.realtor_fee,
      5,
    );

    // return {data, calc_investment}
    return {
      purchasePrice: calc_purchasePrice.toNumber(),
      downPayment: calc_downPayment.toNumber(),
      closingCosts: bank_fee_and_closing_cost,
      reserve: reserved_amount,
      investment: calc_investment.toNumber(),
      noRefinanceYear5: result5yr,
      noRefinanceYear7: result7yr,
      noRefinanceYear10: result10yr,
      refinanceYear5_37month: refinanceYear5m37,
      refinanceYear7_37month: refinanceYear7m37,
      refinanceYear7_49month: refinanceYear7m49,
      refinanceYear10_37month: refinanceYear10m37,
      refinanceYear10_month49: refinanceYear10m49,
      refinanceYear10_month61: refinanceYear10m61,
      exitValuation,
      noiData: calc_noiProjections,
    };
  }

  getPrimaryAndRefinanceData(dto: CreateValuationDto) {
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

    let refinancedPayments = [];

    if (dto.refinance_37_rate) {
      const balanceAt37 = calculateRemainingMortgageBalance(
        calc_principal,
        dto.loan_annual_intr,
        calc_monthlyPmt,
        37,
      );

      const refinancedMonthlyPmt = calculateMonthlyPayment(
        balanceAt37,
        dto.refinance_37_rate,
        dto.refinance_37_term_years,
      );

      const refinancedPaymentsData =
        AnnualPaymentCalculator.calculateRefinancedPayments(
          refinancedMonthlyPmt,
          37,
        );

      refinancedPayments.push(refinancedPaymentsData);
    }

    if (dto.refinance_49_rate) {
      const balanceAt49 = calculateRemainingMortgageBalance(
        calc_principal,
        dto.loan_annual_intr,
        calc_monthlyPmt,
        49,
      );

      const refinancedMonthlyPmt = calculateMonthlyPayment(
        balanceAt49,
        dto.refinance_49_rate,
        dto.refinance_49_term_years,
      );

      const refinancedPaymentsData =
        AnnualPaymentCalculator.calculateRefinancedPayments(
          refinancedMonthlyPmt,
          49,
        );

      refinancedPayments.push(refinancedPaymentsData);
    }

    if (dto.refinance_61_rate) {
      const balanceAt37 = calculateRemainingMortgageBalance(
        calc_principal,
        dto.loan_annual_intr,
        calc_monthlyPmt,
        61,
      );

      const refinancedMonthlyPmt = calculateMonthlyPayment(
        balanceAt37,
        dto.refinance_61_rate,
        dto.refinance_61_term_years,
      );

      const refinancedPaymentsData =
        AnnualPaymentCalculator.calculateRefinancedPayments(
          refinancedMonthlyPmt,
          61,
        );

      refinancedPayments.push(refinancedPaymentsData);
    }

    return {
      primary: calc_originalPayments || [],
      refinanced: refinancedPayments || [],
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
