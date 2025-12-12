import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pagination } from 'src/common/utils/types.util';
import { CreateAnalyticsDto } from './dto/create-analytics.dto';
import { UpdateAnalyticsDto } from './dto/update-analytics.dto';
import { Analytics, IAnalytics } from './entities/analytics.entity';
import {
  calculateCompleteNoRefinance,
  calculateCompleteWithRefinance,
  calculateDownPayment,
  calculateInvestment,
  calculateNoRefinance,
  calculateNoRefinanceForYear10,
  calculatePurchasePrice,
  calculateSingleExitValuation,
  calculateWithRefinance,
  calculateWithRefinanceForYear10,
  NoiProjectionCalculator,
} from 'src/common/utils/fr-valuation-filter.util';
import {
  AnnualPaymentCalculator,
  calculateInterestOnlyPayment,
  calculateMonthlyInterestRate,
  calculateMonthlyPayment,
  calculateRefinancedPaymentsNew,
  calculateTotalPayments,
  generateRefinanceCalculations,
  mortgageLoanPrincipal,
} from 'src/common/utils/fr-mortgage-filter.util';
import Decimal from 'decimal.js';
import { CreateValuationDto } from './valuations/dto/create-valuation.dto';
import {
  evaluateInvestmentPerformance,
  evaluateSyndicatorsDealData,
} from 'src/common/utils/fr-report-filter.util';

@Injectable()
export class AnalyticsService {
  constructor(
    // @Inject(forwardRef(() => ValuationsService))
    // private readonly valuationsService: ValuationsService,
    // private readonly mortgageService: MortgagesService,
    // @Inject(forwardRef(() => ValuationsService))
    @InjectModel(Analytics.name)
    private readonly Analytic: Model<IAnalytics>,
  ) {}

  async create(createAnalyticsDto: CreateAnalyticsDto) {
    //createAnalyticsDto.user = userId;
    return await this.Analytic.create(createAnalyticsDto);
  }

  async generateReportData(id: string) {
    const dto = await this.Analytic.findById(id);
    if (!dto) throw new BadRequestException('No Input Found');

    //----------------------------Simple Calculations ------------------------------//

    const calc_offerPrice = new Decimal(dto.asking_price)
      .mul(dto.offer_perc)
      .div(100);

    const calc_purchasePrice = calculatePurchasePrice(
      dto.asking_price,
      dto.offer_perc,
    );

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
      dto.bank_fee_and_closing_cost,
      dto.reserved_amount,
    );

    //--------------------------------- Helpers -----------------------------------//

    const calc_monthlyRate = calculateMonthlyInterestRate(dto.loan_annual_intr); // D14

    const calc_totalPayments = calculateTotalPayments(dto.loan_terms_inyear);

    //change 4 May, ref: stepwise mortgage doc
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

    //------------------------------Noi Projection---------------------------------//

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

    //----------------------------Mortgage Calculations ------------------------------//

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
      dto.refinance_37_rate,
      dto.number_months_intr_only,
    );

    const primaryRefinanceData = this.getPrimaryAndRefinanceData(
      dto,
      mortgageData,
    );

    //----------------------------Valuations No Hold------------------------------//
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
    const noRefinanceYear10 = calculateNoRefinanceForYear10(
      calc_noiProjections,
      dto.property_manager_fee,
      calc_investment.toNumber(),
      dto.syndi_aum_ann_fee,
      calc_originalPayments,
      dto.dynamic_drop_down_one,
      dto.dynamic_drop_down_two,
      10,
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
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
      dto.number_months_intr_only,
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
      dto.number_months_intr_only,
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
      dto.number_months_intr_only,
    );

    if (year10) exitValuation.push(year10);
    //----------------------------Valuations No Hold Completed------------------------------//
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
      dto.number_months_intr_only,
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
      dto.number_months_intr_only,
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
      dto.number_months_intr_only,
    );

    //----------------------------Valuations With Refinance ------------------------------//

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
      dto.refinance_61_rate,
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
      dto.refinance_37_rate,
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
      84,
      7,
      dto.refinance_49_rate,
    );

    const refinanceYear10m37 = calculateWithRefinanceForYear10(
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
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
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
      dto.refinance_37_rate,
    );

    const refinanceYear10m49 = calculateWithRefinanceForYear10(
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
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
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
      dto.refinance_37_rate,
    );

    const refinanceYear10m61 = calculateWithRefinanceForYear10(
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
      dto.preferred_ann_return_perc,
      dto.waterfall_share,
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
      dto.refinance_37_rate,
    );

    //----------------------------Performance------------------------------//

    const valuationData = {
      noRefinanceYear5: result5yr,
      noRefinanceYear7: result7yr,
      noRefinanceYear10: result10yr,
      refinanceYear5_37month: complete_refinanceYear5m37,
      refinanceYear7_37month: complete_refinanceYear7m37,
      refinanceYear7_49month: complete_refinanceYear7m49,
      refinanceYear10_37month: complete_refinanceYear10m37,
      refinanceYear10_month49: complete_refinanceYear10m49,
      refinanceYear10_month61: complete_refinanceYear10m61,
    };

    const investmentInsights = evaluateInvestmentPerformance(valuationData);

    //----------------------------Performance------------------------------//
    const syndicatorsDealData = evaluateSyndicatorsDealData(
      dto.syndi_origination_fee,
      dto.syndi_sale_price_fee,
      calc_investment,
      result5yr,
      result7yr,
      result10yr,
      mortgageData,
      exitValuation,
    );

    return {
      property: dto.name,
      location: dto.location,
      offerPrice: calc_offerPrice.toNumber().toFixed(2),
      askingPrice: dto.asking_price,
      offerPercent: dto.offer_perc,
      mortgageLtv: dto.financing_ltv_perc,
      interestRate: dto.loan_annual_intr,
      termsInYears: dto.loan_terms_inyear,
      monthsInterestOnly: dto.number_months_intr_only,
      preferredDivident: dto.preferred_ann_return_perc,
      lpWaterFallShare: dto.waterfall_share,
      investorFunding: calc_investment.toNumber().toFixed(2),
      investmentInsights,
      syndicatorsDealData,
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

  async getAll(
    pagination: Pagination,
    query: { search: string; status: string },
  ) {
    const dbQuery = {
      ...(!!query.search && { name: { $regex: query.search, $options: 'i' } }),
      ...(!!query.status && query.status !== 'all' && { status: query.status }),
    };

    const data = await this.Analytic.find(dbQuery)
      .skip(pagination.skip)
      .limit(pagination.limit);
    const totalCount = await this.Analytic.countDocuments(dbQuery);

    return { data, totalCount };
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

  async findOneHelper(filter) {
    const data = await this.Analytic.findOne(filter);
    return data;
  }

  async remove(id: string) {
    await this.Analytic.findByIdAndDelete(id);
    return { message: 'Deleted' };
  }
}
