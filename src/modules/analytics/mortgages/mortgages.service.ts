import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { CreateMortgageDto } from './dto/create-mortgage.dto';
import { UpdateMortgageDto } from './dto/update-mortgage.dto';
import {
  AnnualPaymentCalculator,
  calculateInterestOnlyPayment,
  calculateMonthlyInterestRate,
  calculateMonthlyPayment,
  calculateRefinancedPaymentsNew,
  calculateRemainingMortgageBalance,
  calculateTotalPayments,
  CapRateCalculator,
  // generateMonthlyCapRates,
  generateRefinanceCalculations,
  mortgageLoanPrincipal,
} from 'src/common/utils/fr-mortgage-filter.util';
import { NoiProjectionCalculator } from 'src/common/utils/fr-valuation-filter.util';
import { InjectModel } from '@nestjs/mongoose';
import { Mortgage } from './entities/mortgage.entity';
import { Model } from 'mongoose';
import { AnalyticsService } from '../analytics.service';

@Injectable()
export class MortgagesService {
  constructor(
    @InjectModel(Mortgage.name) private readonly Mortgage: Model<any>,
    @Inject(forwardRef(() => AnalyticsService))
    private readonly analyticsService: AnalyticsService,
  ) {}

  // async create(dto: CreateMortgageDto) {
  //   const calc_principal = mortgageLoanPrincipal(
  //     dto.asking_price, // D6
  //     dto.offer_perc, // D7
  //     dto.financing_ltv_perc,
  //   );

  //   const calc_monthlyRate = calculateMonthlyInterestRate(dto.loan_annual_intr); // D14

  //   const calc_totalPayments = calculateTotalPayments(dto.loan_terms_inyear);

  //   // const calc_monthlyPmt = calculateMonthlyPayment(
  //   //   calc_principal,
  //   //   dto.loan_annual_intr,
  //   //   dto.loan_terms_inyear,
  //   // );    //change 4 May, ref: stepwise mortgage doc
  //   const calc_monthlyPmt = calculateMonthlyPayment(
  //     calc_principal,
  //     calc_monthlyRate,
  //     calc_totalPayments,
  //   );

  //   const calc_interestOnlyPayment = calculateInterestOnlyPayment(
  //     calc_principal,
  //     dto.loan_annual_intr, // D14
  //   );

  //   const mortgageBalance = calculateRemainingMortgageBalance(
  //     calc_principal,
  //     calc_monthlyRate,
  //     calc_monthlyPmt,
  //     20, //37, 49, 61
  //   );

  //   //----------------------------Payment And Refinance--------------------------------//

  //   const calc_originalPayments =
  //     AnnualPaymentCalculator.calculateOriginalPayments(
  //       calc_monthlyPmt,
  //       dto.number_months_intr_only,
  //       dto.first_month_principal_and_intr_payment,
  //     );

  //   //Refinance Calculations (if applicable)
  //   let refinancedPayments = [];

  //   if (dto.refinance_37_rate) {
  //     const balanceAt37 = calculateRemainingMortgageBalance(
  //       calc_principal,
  //       dto.loan_annual_intr,
  //       calc_monthlyPmt,
  //       37,
  //     );

  //     const refinancedMonthlyPmt = calculateMonthlyPayment(
  //       balanceAt37,
  //       dto.refinance_37_rate,
  //       dto.refinance_37_term_years,
  //     );

  //     const refinancedPaymentsData =
  //       AnnualPaymentCalculator.calculateRefinancedPayments(
  //         refinancedMonthlyPmt,
  //         37,
  //       );

  //     refinancedPayments.push(refinancedPaymentsData);
  //   }

  //   if (dto.refinance_49_rate) {
  //     const balanceAt49 = calculateRemainingMortgageBalance(
  //       calc_principal,
  //       dto.loan_annual_intr,
  //       calc_monthlyPmt,
  //       49,
  //     );

  //     const refinancedMonthlyPmt = calculateMonthlyPayment(
  //       balanceAt49,
  //       dto.refinance_49_rate,
  //       dto.refinance_49_term_years,
  //     );

  //     const refinancedPaymentsData =
  //       AnnualPaymentCalculator.calculateRefinancedPayments(
  //         refinancedMonthlyPmt,
  //         49,
  //       );

  //     refinancedPayments.push(refinancedPaymentsData);
  //   }

  //   if (dto.refinance_61_rate) {
  //     const balanceAt37 = calculateRemainingMortgageBalance(
  //       calc_principal,
  //       dto.loan_annual_intr,
  //       calc_monthlyPmt,
  //       61,
  //     );

  //     const refinancedMonthlyPmt = calculateMonthlyPayment(
  //       balanceAt37,
  //       dto.refinance_61_rate,
  //       dto.refinance_61_term_years,
  //     );

  //     const refinancedPaymentsData =
  //       AnnualPaymentCalculator.calculateRefinancedPayments(
  //         refinancedMonthlyPmt,
  //         61,
  //       );

  //     refinancedPayments.push(refinancedPaymentsData);
  //   }

  //   //------------------------------Noi Projection---------------------------------//

  //   const calc_noiProjections = NoiProjectionCalculator.calculateProjections(
  //     dto.noi, // D9
  //     dto.annual_noi_increase, // D10
  //     [
  //       dto.occupancy1,
  //       dto.occupancy2,
  //       dto.occupancy3,
  //       dto.occupancy4,
  //       dto.occupancy4,
  //       dto.occupancy5,
  //       dto.occupancy6,
  //       dto.occupancy7,
  //       dto.occupancy8,
  //       dto.occupancy9,
  //       dto.occupancy10,
  //     ],
  //   );

  //   //---------------------------------Cap Rates-----------------------------------//
  //   // const calc_capRate = CapRateCalculator.getMilestoneCapRates(
  //   //   dto.purchase_cap_rate, // H18 (e.g., 5.5)
  //   //   dto.year_5_cap_rate, // H19 (e.g., 6.0)
  //   //   dto.year_7_cap_rate, // H20 (e.g., 6.25)
  //   //   dto.year_10_cap_rate, // H21 (e.g., 6.5)
  //   //   [37, 48, 60, 84, 120], // Exact months needed
  //   // );

  //   const calc_capRates = generateMonthlyCapRates(
  //     dto.purchase_cap_rate, // H18 (e.g., 5.5)
  //     dto.year_5_cap_rate, // H19 (e.g., 6.0)
  //     dto.year_7_cap_rate, // H20 (e.g., 6.25)
  //     dto.year_10_cap_rate,
  //   );

  //   const calc_capRate2 = generateRefinanceCalculations(
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
  //   );

  //   const result = {
  //     loanAmount: calc_principal,
  //     monthlyRate: calc_monthlyRate,
  //     totalPayments: calc_totalPayments,
  //     monthlyPayment: calc_monthlyPmt,
  //     interestOnlyPayment: calc_interestOnlyPayment,
  //     noiProjection: calc_noiProjections,
  //     capRates: calc_capRates,
  //     primaryAndRefinanceData: {
  //       primary: calc_originalPayments || [],
  //       refinanced: refinancedPayments || {},
  //     },
  //     data: calc_capRate2,
  //   };

  //   const data = await this.Mortgage.create(result);
  //   return data;
  // }

  async test(dto: CreateMortgageDto) {
    const calc_principal = mortgageLoanPrincipal(
      dto.asking_price, // D6
      dto.offer_perc, // D7
      dto.financing_ltv_perc,
    );

    //------------------------------Solo Values---------------------------------//

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

    const calc_capRate2 = generateRefinanceCalculations(
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

    //----------------------------Payment And Refinance--------------------------------//

    const calc_originalPayments =
      AnnualPaymentCalculator.calculateOriginalPayments(
        calc_monthlyPmt,
        dto.number_months_intr_only,
        dto.first_month_principal_and_intr_payment,
        calc_interestOnlyPayment,
      );

    console.log('---------asdasd-asda-asd', calc_capRate2[0].refinancePMT);

    //Refinance Calculations (if applicable)
    let refinancedPayments = [];

    if (dto.refinance_37_rate) {
      // const balanceAt37 = calculateRemainingMortgageBalance(
      //   calc_principal,
      //   dto.loan_annual_intr,
      //   calc_monthlyPmt,
      //   37,
      // );

      // const refinancedMonthlyPmt = calculateMonthlyPayment(
      //   balanceAt37,
      //   dto.refinance_37_rate,
      //   dto.refinance_37_term_years,
      // );

      // const refinancedPaymentsData =
      //   AnnualPaymentCalculator.calculateRefinancedPayments(
      //     refinancedMonthlyPmt,
      //     37,
      //   );

      const refinancedPaymentsData = calculateRefinancedPaymentsNew(
        calc_capRate2[0].refinancePMT,
        37,
      );

      refinancedPayments.push(refinancedPaymentsData);
    }

    if (dto.refinance_49_rate) {
      //   const balanceAt49 = calculateRemainingMortgageBalance(
      //     calc_principal,
      //     dto.loan_annual_intr,
      //     calc_monthlyPmt,
      //     49,
      //   );

      //   const refinancedMonthlyPmt = calculateMonthlyPayment(
      //     balanceAt49,
      //     dto.refinance_49_rate,
      //     dto.refinance_49_term_years,
      //   );

      const refinancedPaymentsData =
        AnnualPaymentCalculator.calculateRefinancedPayments(
          calc_capRate2[0].refinancePMT,
          49,
        );

      refinancedPayments.push(refinancedPaymentsData);
    }

    if (dto.refinance_61_rate) {
      //   const balanceAt61 = calculateRemainingMortgageBalance(
      //     calc_principal,
      //     dto.loan_annual_intr,
      //     calc_monthlyPmt,
      //     61,
      //   );

      //   const refinancedMonthlyPmt = calculateMonthlyPayment(
      //     balanceAt61,
      //     dto.refinance_61_rate,
      //     dto.refinance_61_term_years,
      //   );

      const refinancedPaymentsData = calculateRefinancedPaymentsNew(
        calc_capRate2[1].refinancePMT,
        61,
      );

      refinancedPayments.push(refinancedPaymentsData);
    }

    return {
      loanAmount: calc_principal,
      monthlyRate: calc_monthlyRate,
      totalPayments: calc_totalPayments,
      monthlyPayment: calc_monthlyPmt,
      interestOnlyPayment: calc_interestOnlyPayment,
      noiProjection: calc_noiProjections,
      // capRates: calc_capRates,
      primaryAndRefinanceData: {
        primary: calc_originalPayments || [],
        refinanced: refinancedPayments || [],
      },
      refinanceCalculation: calc_capRate2,
    };
  }

  async calculteMortgageFromId(id: string) {
    const dto = await this.analyticsService.findOneHelper({ _id: id });

    const calc_principal = mortgageLoanPrincipal(
      dto.asking_price, // D6
      dto.offer_perc, // D7
      dto.financing_ltv_perc,
    );

    //------------------------------Solo Values---------------------------------//

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

    const calc_capRate2 = generateRefinanceCalculations(
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

    //----------------------------Payment And Refinance--------------------------------//

    const calc_originalPayments =
      AnnualPaymentCalculator.calculateOriginalPayments(
        calc_monthlyPmt,
        dto.number_months_intr_only,
        dto.first_month_principal_and_intr_payment,
        calc_interestOnlyPayment,
      );

    //Refinance Calculations (if applicable)
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
      loanAmount: calc_principal,
      monthlyRate: calc_monthlyRate,
      totalPayments: calc_totalPayments,
      monthlyPayment: calc_monthlyPmt,
      interestOnlyPayment: calc_interestOnlyPayment,
      noiProjection: calc_noiProjections,
      // capRates: calc_capRates,
      primaryAndRefinanceData: {
        primary: calc_originalPayments || [],
        refinanced: refinancedPayments || [],
      },
      refinanceCalculation: calc_capRate2,
    };
  }

  // async findOne(id: string) {
  //   return await this.Mortgage.findById(id).lean();
  // }

  // update(id: number, updateMortgageDto: UpdateMortgageDto) {
  //   return `This action updates a #${id} mortgage`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} mortgage`;
  // }
}
