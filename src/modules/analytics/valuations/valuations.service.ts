import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  AnnualPaymentCalculator,
  calculateInterestOnlyPayment,
  calculateMonthlyInterestRate,
  calculateMonthlyPayment,
  calculateRefinancedPaymentsNew,
  calculateRemainingMortgageBalance,
  calculateTotalPayments,
  generateRefinanceCalculations,
  mortgageLoanPrincipal,
} from 'src/common/utils/fr-mortgage-filter.util';
import {
  calculateCompleteNoRefinance,
  calculateCompleteWithRefinance,
  // calculateCompleteNoRefinance,
  calculateDownPayment,
  calculateInvestment,
  calculateNoRefinance,
  calculatePurchasePrice,
  calculateSingleExitValuation,
  calculateWithRefinance,
  NoiProjectionCalculator,
} from 'src/common/utils/fr-valuation-filter.util';
import { CreateValuationDto } from './dto/create-valuation.dto';
import { UpdateValuationDto } from './dto/update-valuation.dto';
import { AnalyticsService } from '../analytics.service';
import Decimal from 'decimal.js';

@Injectable()
export class ValuationsService {
  constructor(
    @Inject(forwardRef(() => AnalyticsService))
    private readonly analyticsService: AnalyticsService,
  ) {}

  // async calculateValuation(dto: CreateValuationDto) {
  //   const {
  //     asking_price,
  //     offer_perc,
  //     financing_ltv_perc,
  //     bank_fee_and_closing_cost,
  //     reserved_amount,
  //   } = dto;

  //   const calc_monthlyRate = calculateMonthlyInterestRate(dto.loan_annual_intr); // D14

  //   const calc_totalPayments = calculateTotalPayments(dto.loan_terms_inyear);

  //   const calc_purchasePrice = calculatePurchasePrice(asking_price, offer_perc);

  //   const calc_principal = mortgageLoanPrincipal(
  //     dto.asking_price, // D6
  //     dto.offer_perc, // D7
  //     dto.financing_ltv_perc,
  //   );

  //   const calc_downPayment = calculateDownPayment(
  //     calc_purchasePrice,
  //     calc_principal,
  //   );

  //   const calc_investment = calculateInvestment(
  //     calc_downPayment,
  //     bank_fee_and_closing_cost,
  //     reserved_amount,
  //   );

  //   const calc_noiProjections = NoiProjectionCalculator.calculateProjections(
  //     dto.noi, // D9
  //     dto.annual_noi_increase, // D10
  //     [
  //       dto.occupancy1,
  //       dto.occupancy2,
  //       dto.occupancy3,
  //       dto.occupancy4,
  //       dto.occupancy5,
  //       dto.occupancy6,
  //       dto.occupancy7,
  //       dto.occupancy8,
  //       dto.occupancy9,
  //       dto.occupancy10,
  //     ],
  //   );

  //   //-----------------------helpers--------------------------//
  //   // const calc_principal = mortgageLoanPrincipal(
  //   //   dto.asking_price, // D6
  //   //   dto.offer_perc, // D7
  //   //   dto.financing_ltv_perc,
  //   // );
  //   const calc_monthlyPmt = calculateMonthlyPayment(
  //     calc_principal,
  //     calc_monthlyRate,
  //     calc_totalPayments,
  //   );

  //   const calc_interestOnlyPayment = calculateInterestOnlyPayment(
  //     calc_principal,
  //     dto.loan_annual_intr, // D14
  //   );

  //   const calc_originalPayments =
  //     AnnualPaymentCalculator.calculateOriginalPayments(
  //       calc_monthlyPmt,
  //       dto.number_months_intr_only,
  //       dto.first_month_principal_and_intr_payment,
  //       calc_interestOnlyPayment,
  //     );
  //   //---------------------------------------------------------//

  //   const mortgageData = generateRefinanceCalculations(
  //     dto.purchase_cap_rate, // H18 (e.g., 5.5)
  //     dto.year_5_cap_rate, // H19 (e.g., 6.0)
  //     dto.year_7_cap_rate, // H20 (e.g., 6.25)
  //     dto.year_10_cap_rate,
  //     calc_noiProjections,
  //     dto.financing_ltv_perc,
  //     dto.syndi_sale_price_fee,
  //     dto.transaction_and_bank_fee,
  //     calc_monthlyRate,
  //     calc_totalPayments,
  //     calc_principal,
  //     calc_monthlyPmt,
  //   );

  //   const primaryRefinanceData = this.getPrimaryAndRefinanceData(dto);

  //   const noRefinanceYear5 = calculateNoRefinance(
  //     calc_noiProjections,
  //     dto.property_manager_fee,
  //     calc_investment.toNumber(),
  //     dto.syndi_aum_ann_fee,
  //     calc_originalPayments,
  //     dto.dynamic_drop_down_one,
  //     dto.dynamic_drop_down_two,
  //     5,
  //   );
  //   const noRefinanceYear7 = calculateNoRefinance(
  //     calc_noiProjections,
  //     dto.property_manager_fee,
  //     calc_investment.toNumber(),
  //     dto.syndi_aum_ann_fee,
  //     calc_originalPayments,
  //     dto.dynamic_drop_down_one,
  //     dto.dynamic_drop_down_two,
  //     7,
  //   );
  //   const noRefinanceYear10 = calculateNoRefinance(
  //     calc_noiProjections,
  //     dto.property_manager_fee,
  //     calc_investment.toNumber(),
  //     dto.syndi_aum_ann_fee,
  //     calc_originalPayments,
  //     dto.dynamic_drop_down_one,
  //     dto.dynamic_drop_down_two,
  //     10,
  //   );

  //   const refinanceYear5m37 = calculateWithRefinance(
  //     calc_noiProjections,
  //     dto.property_manager_fee,
  //     calc_investment.toNumber(),
  //     dto.syndi_aum_ann_fee,
  //     primaryRefinanceData,
  //     dto.dynamic_drop_down_one,
  //     dto.dynamic_drop_down_two,
  //     5,
  //     37,
  //   );
  //   const refinanceYear7m37 = calculateWithRefinance(
  //     calc_noiProjections,
  //     dto.property_manager_fee,
  //     calc_investment.toNumber(),
  //     dto.syndi_aum_ann_fee,
  //     primaryRefinanceData,
  //     dto.dynamic_drop_down_one,
  //     dto.dynamic_drop_down_two,
  //     7,
  //     37,
  //   );
  //   const refinanceYear7m49 = calculateWithRefinance(
  //     calc_noiProjections,
  //     dto.property_manager_fee,
  //     calc_investment.toNumber(),
  //     dto.syndi_aum_ann_fee,
  //     primaryRefinanceData,
  //     dto.dynamic_drop_down_one,
  //     dto.dynamic_drop_down_two,
  //     7,
  //     49,
  //   );
  //   const refinanceYear10m37 = calculateWithRefinance(
  //     calc_noiProjections,
  //     dto.property_manager_fee,
  //     calc_investment.toNumber(),
  //     dto.syndi_aum_ann_fee,
  //     primaryRefinanceData,
  //     dto.dynamic_drop_down_one,
  //     dto.dynamic_drop_down_two,
  //     10,
  //     37,
  //   );
  //   const refinanceYear10m49 = calculateWithRefinance(
  //     calc_noiProjections,
  //     dto.property_manager_fee,
  //     calc_investment.toNumber(),
  //     dto.syndi_aum_ann_fee,
  //     primaryRefinanceData,
  //     dto.dynamic_drop_down_one,
  //     dto.dynamic_drop_down_two,
  //     10,
  //     49,
  //   );
  //   const refinanceYear10m61 = calculateWithRefinance(
  //     calc_noiProjections,
  //     dto.property_manager_fee,
  //     calc_investment.toNumber(),
  //     dto.syndi_aum_ann_fee,
  //     primaryRefinanceData,
  //     dto.dynamic_drop_down_one,
  //     dto.dynamic_drop_down_two,
  //     10,
  //     61,
  //   );

  //   // const tableZero = calculateExitValuations(mortgageData,noRefinanceYear5, noRefinanceYear7, noRefinanceYear10,  calc_investment.toNumber(), dto.preferred_ann_return_perc, dto.waterfall_share,  dto.syndi_sale_price_fee, dto.transaction_and_bank_fee, dto.realtor_fee )

  //   const exitValuation = [];
  //   const year5 = calculateSingleExitValuation(
  //     mortgageData,
  //     noRefinanceYear5,
  //     calc_investment.toNumber(),
  //     dto.preferred_ann_return_perc,
  //     dto.waterfall_share,
  //     dto.syndi_sale_price_fee,
  //     dto.transaction_and_bank_fee,
  //     dto.realtor_fee,
  //     60,
  //     5,
  //     calc_principal,
  //     dto.loan_annual_intr,
  //     calc_monthlyPmt,
  //   );
  //   if (year5) exitValuation.push(year5);

  //   const year7 = calculateSingleExitValuation(
  //     mortgageData,
  //     noRefinanceYear7,
  //     calc_investment.toNumber(),
  //     dto.preferred_ann_return_perc,
  //     dto.waterfall_share,
  //     dto.syndi_sale_price_fee,
  //     dto.transaction_and_bank_fee,
  //     dto.realtor_fee,
  //     84,
  //     7,
  //     calc_principal,
  //     dto.loan_annual_intr,
  //     calc_monthlyPmt,
  //   );
  //   if (year7) exitValuation.push(year7);

  //   const year10 = calculateSingleExitValuation(
  //     mortgageData,
  //     noRefinanceYear10,
  //     calc_investment.toNumber(),
  //     dto.preferred_ann_return_perc,
  //     dto.waterfall_share,
  //     dto.syndi_sale_price_fee,
  //     dto.transaction_and_bank_fee,
  //     dto.realtor_fee,
  //     120,
  //     10,
  //     calc_principal,
  //     dto.loan_annual_intr,
  //     calc_monthlyPmt,
  //   );

  //   if (year10) exitValuation.push(year10);

  //   // console.log(exitValuation);

  //   const result5yr = calculateCompleteNoRefinance(
  //     calc_noiProjections,
  //     dto.property_manager_fee,
  //     calc_investment.toNumber(),
  //     dto.syndi_aum_ann_fee,
  //     calc_originalPayments,
  //     dto.dynamic_drop_down_one,
  //     dto.dynamic_drop_down_two,
  //     mortgageData,
  //     dto.preferred_ann_return_perc,
  //     dto.waterfall_share,
  //     dto.syndi_sale_price_fee,
  //     dto.transaction_and_bank_fee,
  //     dto.realtor_fee,
  //     5,
  //     calc_principal,
  //     dto.loan_annual_intr,
  //     calc_monthlyPmt,
  //   );
  //   const result7yr = calculateCompleteNoRefinance(
  //     calc_noiProjections,
  //     dto.property_manager_fee,
  //     calc_investment.toNumber(),
  //     dto.syndi_aum_ann_fee,
  //     calc_originalPayments,
  //     dto.dynamic_drop_down_one,
  //     dto.dynamic_drop_down_two,
  //     mortgageData,
  //     dto.preferred_ann_return_perc,
  //     dto.waterfall_share,
  //     dto.syndi_sale_price_fee,
  //     dto.transaction_and_bank_fee,
  //     dto.realtor_fee,
  //     7,
  //     calc_principal,
  //     dto.loan_annual_intr,
  //     calc_monthlyPmt,
  //   );
  //   const result10yr = calculateCompleteNoRefinance(
  //     calc_noiProjections,
  //     dto.property_manager_fee,
  //     calc_investment.toNumber(),
  //     dto.syndi_aum_ann_fee,
  //     calc_originalPayments,
  //     dto.dynamic_drop_down_one,
  //     dto.dynamic_drop_down_two,
  //     mortgageData,
  //     dto.preferred_ann_return_perc,
  //     dto.waterfall_share,
  //     dto.syndi_sale_price_fee,
  //     dto.transaction_and_bank_fee,
  //     dto.realtor_fee,
  //     5,
  //     calc_principal,
  //     dto.loan_annual_intr,
  //     calc_monthlyPmt,
  //   );

  //   // return {data, calc_investment}
  //   return {
  //     purchasePrice: calc_purchasePrice.toNumber(),
  //     downPayment: calc_downPayment.toNumber(),
  //     closingCosts: bank_fee_and_closing_cost,
  //     reserve: reserved_amount,
  //     investment: calc_investment.toNumber(),
  //     noRefinanceYear5: result5yr,
  //     noRefinanceYear7: result7yr,
  //     noRefinanceYear10: result10yr,
  //     refinanceYear5_37month: refinanceYear5m37,
  //     refinanceYear7_37month: refinanceYear7m37,
  //     refinanceYear7_49month: refinanceYear7m49,
  //     refinanceYear10_37month: refinanceYear10m37,
  //     refinanceYear10_month49: refinanceYear10m49,
  //     refinanceYear10_month61: refinanceYear10m61,
  //     exitValuation,
  //     noiData: calc_noiProjections,
  //   };
  // }

  async calculateValuationFromId(id: string) {
    const dto = await this.analyticsService.findOneHelper({ _id: id });
    if (!dto) throw new BadRequestException('No Input Found');

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

    const calc_principal = mortgageLoanPrincipal(
      dto.asking_price, // D6
      dto.offer_perc, // D7
      dto.financing_ltv_perc,
    );

    const calc_downPayment = calculateDownPayment(
      calc_purchasePrice,
      calc_principal,
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
        dto.occupancy5,
        dto.occupancy6,
        dto.occupancy7,
        dto.occupancy8,
        dto.occupancy9,
        dto.occupancy10,
      ],
    );

    //-----------------------helpers--------------------------//
    // const calc_principal = mortgageLoanPrincipal(
    //   dto.asking_price, // D6
    //   dto.offer_perc, // D7
    //   dto.financing_ltv_perc,
    // );
    const calc_monthlyPmt = calculateMonthlyPayment(
      calc_principal,
      calc_monthlyRate,
      calc_totalPayments,
    );

    const calc_interestOnlyPayment = calculateInterestOnlyPayment(
      calc_principal,
      dto.loan_annual_intr, // D14
    );

    const calc_originalPayments =
      AnnualPaymentCalculator.calculateOriginalPayments(
        calc_monthlyPmt,
        dto.number_months_intr_only,
        dto.first_month_principal_and_intr_payment,
        calc_interestOnlyPayment,
      );
    //---------------------------------------------------------//

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
      calc_principal,
      calc_monthlyPmt,
    );

    const primaryRefinanceData = this.getPrimaryAndRefinanceData(
      dto,
      mortgageData,
    );

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
      mortgageData[0].capitalLift,
      5,
      37,
    );
    const complete_refinanceYear5m37 = calculateCompleteWithRefinance(
      refinanceYear5m37,
      calc_investment.toNumber(),
      mortgageData,
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      dto.realtor_fee,
      60,
      60,
      5,
    );

    const refinanceYear7m37 = calculateWithRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      primaryRefinanceData,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      mortgageData[0].capitalLift,
      7,
      37,
    );
    const complete_refinanceYear7m37 = calculateCompleteWithRefinance(
      refinanceYear7m37,
      calc_investment.toNumber(),
      mortgageData,
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      dto.realtor_fee,
      37,
      84,
      7,
    );

    const refinanceYear7m49 = calculateWithRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      primaryRefinanceData,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      mortgageData[1].capitalLift,
      7,
      49,
    );
    const complete_refinanceYear7m49 = calculateCompleteWithRefinance(
      refinanceYear7m49,
      calc_investment.toNumber(),
      mortgageData,
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      dto.realtor_fee,
      48,
      80,
      7,
    );

    const refinanceYear10m37 = calculateWithRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      primaryRefinanceData,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      mortgageData[0].capitalLift,
      10,
      37,
    );
    const complete_refinanceYear10m37 = calculateCompleteWithRefinance(
      refinanceYear10m37,
      calc_investment.toNumber(),
      mortgageData,
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      dto.realtor_fee,
      37,
      120,
      10,
    );

    const refinanceYear10m49 = calculateWithRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      primaryRefinanceData,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      mortgageData[1].capitalLift,
      10,
      49,
    );
    const complete_refinanceYear10m49 = calculateCompleteWithRefinance(
      refinanceYear10m49,
      calc_investment.toNumber(),
      mortgageData,
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      dto.realtor_fee,
      48,
      120,
      10,
    );

    const refinanceYear10m61 = calculateWithRefinance(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      primaryRefinanceData,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      mortgageData[2].capitalLift,
      10,
      61,
    );
    const complete_refinanceYear10m61 = calculateCompleteWithRefinance(
      refinanceYear10m61,
      calc_investment.toNumber(),
      mortgageData,
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
      dto.syndi_sale_price_fee,
      dto.transaction_and_bank_fee,
      dto.realtor_fee,
      60,
      120,
      10,
    );

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
      60,
      5,
      calc_principal,
      dto.loan_annual_intr,
      calc_monthlyPmt,
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
      calc_principal,
      dto.loan_annual_intr,
      calc_monthlyPmt,
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
      calc_principal,
      dto.loan_annual_intr,
      calc_monthlyPmt,
    );

    if (year10) exitValuation.push(year10);

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
      calc_principal,
      dto.loan_annual_intr,
      calc_monthlyPmt,
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
      calc_principal,
      dto.loan_annual_intr,
      calc_monthlyPmt,
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
      10,
      calc_principal,
      dto.loan_annual_intr,
      calc_monthlyPmt,
    );

    return {
      purchasePrice: calc_purchasePrice.toNumber(),
      downPayment: calc_downPayment.toNumber(),
      closingCosts: bank_fee_and_closing_cost,
      reserve: reserved_amount,
      investment: calc_investment.toNumber(),
      noRefinanceYear5: result5yr,
      noRefinanceYear7: result7yr,
      noRefinanceYear10: result10yr,
      refinanceYear5_37month: complete_refinanceYear5m37,
      refinanceYear7_37month: complete_refinanceYear7m37,
      refinanceYear7_49month: complete_refinanceYear7m49,
      refinanceYear10_37month: complete_refinanceYear10m37,
      refinanceYear10_month49: complete_refinanceYear10m49,
      refinanceYear10_month61: complete_refinanceYear10m61,
      // refinanceYear5_37month: refinanceYear5m37,
      // refinanceYear7_37month: refinanceYear7m37,
      // refinanceYear7_49month: refinanceYear7m49,
      // refinanceYear10_37month: refinanceYear10m37,
      // refinanceYear10_month49: refinanceYear10m49,
      // refinanceYear10_month61: refinanceYear10m61,
      exitValuation,
      noiData: calc_noiProjections,
    };
  }

  getPrimaryAndRefinanceData(dto: CreateValuationDto, mortgageBalance) {
    const calc_capRate2 = mortgageBalance;
    const calc_monthlyRate = calculateMonthlyInterestRate(dto.loan_annual_intr); // D14

    const calc_totalPayments = calculateTotalPayments(dto.loan_terms_inyear);

    const calc_principal = mortgageLoanPrincipal(
      dto.asking_price, // D6
      dto.offer_perc, // D7
      dto.financing_ltv_perc,
    );
    const calc_monthlyPmt = calculateMonthlyPayment(
      calc_principal,
      calc_monthlyRate,
      calc_totalPayments,
    );

    const calc_interestOnlyPayment = calculateInterestOnlyPayment(
      calc_principal,
      dto.loan_annual_intr, // D14
    );

    const calc_originalPayments =
      AnnualPaymentCalculator.calculateOriginalPayments(
        calc_monthlyPmt,
        dto.number_months_intr_only,
        dto.first_month_principal_and_intr_payment,
        calc_interestOnlyPayment,
      );

    let refinancedPayments = [];

    if (dto.refinance_37_rate) {
      const refinancedPaymentsData = calculateRefinancedPaymentsNew(
        calc_capRate2[0].refinancePMT,
        37,
      );

      refinancedPayments.push(refinancedPaymentsData);
    }

    if (dto.refinance_49_rate) {
      const refinancedPaymentsData = calculateRefinancedPaymentsNew(
        calc_capRate2[1].refinancePMT,
        49,
      );

      refinancedPayments.push(refinancedPaymentsData);
    }

    if (dto.refinance_61_rate) {
      const refinancedPaymentsData = calculateRefinancedPaymentsNew(
        calc_capRate2[2].refinancePMT,
        61,
      );

      refinancedPayments.push(refinancedPaymentsData);
    }

    return {
      primary: calc_originalPayments || [],
      refinanced: refinancedPayments || [],
    };
  }
}
