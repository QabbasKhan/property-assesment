import Decimal from 'decimal.js';
import { irr } from 'financial'; // Using financial library for IRR calculation
import { DROP_DOWN } from 'src/modules/analytics/enums/input-fields.enum';
import { calculateRemainingMortgageBalance } from './fr-mortgage-filter.util';
import { exit } from 'process';
import { BadRequestException } from '@nestjs/common';
import { log } from 'console';

export function calculatePurchasePrice(
  asking_price: number,
  offer_perc: number,
): Decimal {
  return new Decimal(asking_price).mul(new Decimal(offer_perc).div(100));
}

export function calculateDownPayment(
  calc_purchasePrice: Decimal,
  calc_principal: number,
): Decimal {
  return calc_purchasePrice.minus(new Decimal(calc_principal));
}

export function calculateInvestment(
  downPayment: Decimal,
  closingCosts: number,
  reserve: number,
): Decimal {
  return downPayment.plus(new Decimal(closingCosts)).plus(new Decimal(reserve));
}

export class NoiProjectionCalculator {
  /**
   * Calculate NOI projections for years 1-10
   * @param baseNoi - Year 1 NOI (D9)
   * @param annualNoiIncrease - Annual increase % (D10)
   * @param occupancyRates - Array of occupancy rates [year1 (H6), year2 (H7), ..., year10 (H15)]
   */
  static calculateProjections(
    baseNoi: number,
    annualNoiIncrease: number,
    occupancyRates: number[],
  ): { targetNoi: number; realizedNoi: number }[] {
    const projections = [];
    const annualIncreaseFactor = new Decimal(1).plus(
      new Decimal(annualNoiIncrease).div(100),
    );

    // Year 1 (use as-is)
    projections.push({
      targetNoi: baseNoi,
      realizedNoi: baseNoi,
    });

    // Years 2-10
    let previousNoi = new Decimal(baseNoi);
    const baseOccupancy = new Decimal(occupancyRates[0]).div(100);

    for (let year = 2; year <= 10; year++) {
      let targetNoi;
      let realizedNoi;

      if (year == 10) {
        const powerOfTen = annualIncreaseFactor.pow(10);
        targetNoi = new Decimal(baseNoi).mul(powerOfTen);

        const currentOccupancy = new Decimal(occupancyRates[year - 1]).div(100);
        // const occupancyAdjustment = currentOccupancy.div(baseOccupancy);
        // const realizedNoi = targetNoi.mul(occupancyAdjustment);
        const step1 = targetNoi.div(baseOccupancy);
        realizedNoi = step1.mul(currentOccupancy);
      } else {
        targetNoi = previousNoi.mul(annualIncreaseFactor);
        // Calculate Realized NOI with occupancy adjustment
        const currentOccupancy = new Decimal(occupancyRates[year - 1]).div(100);
        // const occupancyAdjustment = currentOccupancy.div(baseOccupancy);
        // const realizedNoi = targetNoi.mul(occupancyAdjustment);
        const step1 = targetNoi.div(baseOccupancy);
        realizedNoi = step1.mul(currentOccupancy);
      }

      projections.push({
        targetNoi: targetNoi.toDecimalPlaces(0).toNumber(),
        realizedNoi: realizedNoi.toDecimalPlaces(0).toNumber(),
      });

      previousNoi = targetNoi;
    }

    return projections;
  }
}

export function calculateNetProceeds(
  mortgageData: any[],
  syndiFeePercent: number,
  transactionFeePercent: number,
  realtorFeePercent: number,
  targetMonths: number[],
) {
  const results = [];

  targetMonths.forEach((month) => {
    const data = mortgageData.find((d) => d.month === month);
    if (!data) return;

    const totalFeePercent = new Decimal(syndiFeePercent)
      .plus(transactionFeePercent)
      .plus(realtorFeePercent)
      .div(100);

    const salePrice = new Decimal(data.value);

    const sellingCosts = salePrice.mul(totalFeePercent);

    const netProceeds = salePrice.minus(sellingCosts);

    results.push({
      month,
      netProceeds: Number(netProceeds.toFixed(2)),
    });
  });

  return results;
}

// export function calculateExitValuations(
//   mortgageData: any[],
//   noiResults5yr: any, // NOI results for 5 years
//   noiResults7yr: any, // NOI results for 7 years
//   noiResults10yr: any, // NOI results for 10 years
//   investmentAmount: number, // C7
//   preferredReturnPerc: number, // D25
//   waterfallSharePerc: number, // D26
//   syndiFeePercent: number, // D34
//   transactionFeePercent: number, // D35
//   realtorFeePercent: number, // D36
//   principal: number,
//   annualInterest: number,
//   monthlyPayment: number,
// ): [] {
//   const results = [];

//   // Calculate for 5th year (month 60)
//   const year5 = calculateSingleExitValuation(
//     mortgageData,
//     noiResults5yr,
//     investmentAmount,
//     preferredReturnPerc,
//     waterfallSharePerc,
//     syndiFeePercent,
//     transactionFeePercent,
//     realtorFeePercent,
//     60,
//     5,
//     principal,
//     annualInterest,
//     monthlyPayment,
//   );
//   if (year5) results.push(year5);

//   // Calculate for 7th year (month 84)
//   const year7 = calculateSingleExitValuation(
//     mortgageData,
//     noiResults7yr,
//     investmentAmount,
//     preferredReturnPerc,
//     waterfallSharePerc,
//     syndiFeePercent,
//     transactionFeePercent,
//     realtorFeePercent,
//     84,
//     7,
//     principal,
//     annualInterest,
//     monthlyPayment,
//   );
//   if (year7) results.push(year7);

//   // Calculate for 10th year (month 120)
//   const year10 = calculateSingleExitValuation(
//     mortgageData,
//     noiResults10yr,
//     investmentAmount,
//     preferredReturnPerc,
//     waterfallSharePerc,
//     syndiFeePercent,
//     transactionFeePercent,
//     realtorFeePercent,
//     120,
//     10,
//     principal,
//     annualInterest,
//     monthlyPayment,
//   );
//   if (year10) results.push(year10);

//   return results as any;
// }

export function calculateSingleExitValuation(
  mortgageData: any[],
  noRefinanceResults: any[],
  investmentAmount: number,
  preferredReturnPerc: number,
  waterfallSharePerc: number,
  syndiFeePercent: number,
  transactionFeePercent: number,
  realtorFeePercent: number,
  targetMonth: number,
  targetYear: number,
  principal: number,
  annualInterest: number,
  monthlyPayment: number,
  numberMonthInterestOnly: number, // Not used in this function, but can be added if needed
) {
  // 1. Get sale price from mortgage data
  const mortgageEntry = mortgageData.find((d) => d.month === targetMonth);
  if (!mortgageEntry) return null;

  const salePrice = new Decimal(mortgageEntry.value);

  // 2. Calculate net proceeds
  const totalFeePercent = new Decimal(syndiFeePercent)
    .plus(transactionFeePercent)
    .plus(realtorFeePercent)
    .div(100);

  const sellingCosts = salePrice.mul(totalFeePercent);

  const mortgage = calculateRemainingMortgageBalance(
    principal,
    annualInterest,
    monthlyPayment,
    numberMonthInterestOnly,
    targetMonth + 1,
  );

  // if (targetYear == 5) {
  //   // console.log('mortgage: ', mortgage);
  // }

  const netProceeds = salePrice.minus(sellingCosts).minus(mortgage);

  // 3. Calculate total due investor

  const totalDividendsPaid = calculateTotalDividendsPaid(noRefinanceResults);
  const preferredDividend = new Decimal(investmentAmount)
    .mul(preferredReturnPerc)
    .div(100)
    .mul(targetYear);

  const totalDueInvestor = preferredDividend
    .plus(investmentAmount) // Return of capital
    .minus(totalDividendsPaid); // Subtract dividends already paid

  // 4. Calculate excess capital gains
  // const excessCapitalGains = netProceeds.plus(totalDueInvestor);
  const excessCapitalGains = netProceeds.minus(totalDueInvestor);

  // 5. Calculate LP payment (waterfall)
  const lpPayment = excessCapitalGains.mul(waterfallSharePerc).div(100);

  // 6. Calculate GP share
  const gpShare = excessCapitalGains.minus(lpPayment);

  return {
    year: targetYear,
    salePrice: salePrice.toDecimalPlaces(0).toNumber(),
    sellingCosts: sellingCosts.toDecimalPlaces(0).toNumber(),
    netProceeds: netProceeds.toDecimalPlaces(0).toNumber(),
    totalDueInvestor: totalDueInvestor.toDecimalPlaces(0).toNumber(),
    excessCapitalGains: excessCapitalGains.toDecimalPlaces(0).toNumber(),
    lpPayment: lpPayment.toDecimalPlaces(0).toNumber(),
    gpShare: gpShare.toDecimalPlaces(0).toNumber(),
  };
}

function calculateTotalDividendsPaid(noiResults: any[]): Decimal {
  // console.log('NR:', noiResults);

  return noiResults.reduce(
    (sum, result) => sum.plus(result.cashFlow > 0 ? result.cashFlow : 0),
    new Decimal(0),
  );
}

export function calculateNoRefinance(
  noiProjection: any[], // row17
  propManagerFees: number, // Property manager fee percentage
  investment: number, // c7
  syndiAumFee: number, // D29
  primaryData: any[], // for debt (not used in this calculation)
  dynamicOne: string, // Determines if property management fees apply
  dynamicTwo: string, // Determines if AUM fees apply
  years: number, // Analysis period (5, 7, or 10 years)
) {
  const annualCashFlows = [];

  for (let year = 0; year < years; year++) {
    const noiValue = new Decimal(noiProjection[year]?.realizedNoi || 0);

    const propertyManagementFee = noiValue
      .div(0.2)
      .mul(propManagerFees)
      .div(100);

    // 3. Calculate AUM Fee (
    const aumFee = new Decimal(investment).mul(syndiAumFee).div(100);

    // 4. Get Debt Service (from refinanceData)

    const debtService = new Decimal(primaryData[year] || 0).toDecimalPlaces(0);

    // 5. Calculate Cash Flow with conditional fee application
    let cashFlow = noiValue;

    if (dynamicTwo === DROP_DOWN.YES) {
      cashFlow = cashFlow.minus(propertyManagementFee);
    }
    if (dynamicOne === DROP_DOWN.YES) {
      cashFlow = cashFlow.minus(aumFee);
    }
    cashFlow = cashFlow.minus(debtService).toDecimalPlaces(0);

    // if (year == 0) {
    //   console.log(
    //     cashFlow,
    //     noiValue,
    //     propManagerFees,
    //     aumFee,
    //     debtService,
    //     dynamicTwo,
    //     dynamicOne,
    //   );
    // }

    annualCashFlows.push({
      year: year + 1,
      noi: noiValue.toDecimalPlaces(0).toNumber(),
      propertyManagementFee: propertyManagementFee
        .toDecimalPlaces(0)
        .toNumber(),
      debtService: debtService.toDecimalPlaces(0).toNumber(), // Show as positive value
      aumFee: aumFee.toDecimalPlaces(2).toNumber(),
      cashFlow: cashFlow.toNumber(),
    });
  }

  return annualCashFlows;
}

export function calculateCompleteNoRefinance(
  noiProjection: any[],
  propManagerFees: number,
  investment: number,
  syndiAumFee: number,
  primaryData: any[],
  dynamicOne: string,
  dynamicTwo: string,
  mortgageData: any[],
  preferredReturnPerc: number,
  waterfallSharePerc: number,
  syndiFeePercent: number,
  transactionFeePercent: number,
  realtorFeePercent: number,
  years: number,
  principal: number,
  annualInterest: number,
  monthlyPayment: number,
  numberMonthInterestOnly: number,
) {
  // 1. Calculate annual cash flows
  const annualCashFlows = calculateNoRefinance(
    noiProjection,
    propManagerFees,
    investment,
    syndiAumFee,
    primaryData,
    dynamicOne,
    dynamicTwo,
    years,
  );

  // 2. Calculate exit valuation
  const targetMonth = years * 12; // 60, 84, or 120
  const exitValuation = calculateSingleExitValuation(
    mortgageData,
    annualCashFlows,
    investment,
    preferredReturnPerc,
    waterfallSharePerc,
    syndiFeePercent,
    transactionFeePercent,
    realtorFeePercent,
    targetMonth,
    years,
    principal,
    annualInterest,
    monthlyPayment,
    numberMonthInterestOnly,
  );

  if (!exitValuation) {
    throw new Error(`No mortgage data found for ${years} year exit`);
  }

  // 3. Calculate cash flow from closing (Total Due Investor)
  const cashFlowFromClosing = new Decimal(exitValuation.lpPayment)
    .toDecimalPlaces(0)
    .toNumber();

  // 4. Calculate cash flow total (sum of annual + closing + investment)
  const totalAnnualCashFlow = annualCashFlows.reduce(
    (sum, flow) => sum.plus(new Decimal(flow.cashFlow)),
    new Decimal(0),
  );
  const cashFlowTotal = totalAnnualCashFlow
    .plus(cashFlowFromClosing)
    .plus(investment)
    .toDecimalPlaces(0)
    .toNumber();

  // 5. Calculate cash-on-cash returns
  const investmentDec = new Decimal(investment);
  const cashFlowsWithCoc = annualCashFlows.map((flow) => ({
    ...flow,
    noi: new Decimal(flow.noi).toDecimalPlaces(0).toNumber(),
    propertyManagementFee: new Decimal(flow.propertyManagementFee)
      .toDecimalPlaces(0)
      .toNumber(),
    aumFee: new Decimal(flow.aumFee).toDecimalPlaces(2).toNumber(),
    cashFlow: new Decimal(flow.cashFlow).toDecimalPlaces(0).toNumber(),
    cashOnCashReturn:
      investment > 0
        ? new Decimal(flow.cashFlow)
            .div(investmentDec)
            .mul(100)
            .toDecimalPlaces(2)
            .toNumber()
        : 0,
  }));

  // 6. Calculate average cash-on-cash
  const averageCashOnCash = cashFlowsWithCoc
    .reduce(
      (sum, flow) => sum.plus(new Decimal(flow.cashOnCashReturn)),
      new Decimal(0),
    )
    .div(years)
    .toDecimalPlaces(2)
    .toNumber();

  // 7. Calculate total and annualized return
  const totalReturn = new Decimal(cashFlowTotal)
    .div(investment)
    .mul(100)
    .toDecimalPlaces(2)
    .toNumber();
  const annualizedReturn = new Decimal(totalReturn)
    .div(years)
    .toDecimalPlaces(2)
    .toNumber();

  // 8. Calculate IRR

  let irrCashFlows;

  if (years == 5) {
    irrCashFlows = [
      -investment, // Initial investment (negative)
      ...annualCashFlows.map((flow) => flow.cashFlow),
      cashFlowFromClosing + investment,
    ];
  } else if (years == 7) {
    irrCashFlows = [
      -investment, // Initial investment (negative)
      ...annualCashFlows.map((flow) => flow.cashFlow),
      cashFlowFromClosing,
      cashFlowFromClosing + investment,
    ];
  } else if (years == 10) {
    irrCashFlows = [
      -investment, // Initial investment (negative)
      ...annualCashFlows.map((flow) => flow.cashFlow),
      cashFlowFromClosing,
      cashFlowFromClosing + investment,
    ];
  }

  // console.log('IRR Cash Flows For NR:', irrCashFlows, years, targetMonth);

  // const irrCashFlows = [
  //   -investment, // Initial investment (negative)
  //   ...annualCashFlows.map((flow) => flow.cashFlow),
  //   cashFlowFromClosing + investment,
  // ];

  const irrValue = new Decimal(irr(irrCashFlows, 0.1) * 100)
    .toDecimalPlaces(2)
    .toNumber();

  return {
    annualCashFlows: cashFlowsWithCoc,
    cashFlowFromClosing,
    cashFlowTotal,
    averageCashOnCash,
    totalReturn,
    annualizedReturn,
    irr: irrValue,
  };
}

export function calculateSingleExitValuationWithRefinance(
  mortgageData: any[],
  noRefinanceResults: any[],
  investmentAmount: number,
  preferredReturnPerc: number,
  waterfallSharePerc: number,
  syndiFeePercent: number,
  transactionFeePercent: number,
  realtorFeePercent: number,
  targetMonth: number,
  exitMonth: number,
  targetYear: number,
  refinaceMonthlyRate: number,
) {
  // 1. Get sale price from mortgage data
  const mortgageEntry = mortgageData.find((d) => d.month === targetMonth);
  if (!mortgageEntry) return null;

  const mortgageEntry2 = mortgageData.find((d) => d.month === exitMonth);
  if (!mortgageEntry) return null;

  const salePrice = new Decimal(mortgageEntry2.value);

  const realtorfee = new Decimal(realtorFeePercent).mul(100);
  // 2. Calculate net proceeds
  const totalFeePercent = new Decimal(syndiFeePercent)
    .plus(transactionFeePercent)
    .plus(realtorfee);
  const totalFeePercentDecimal = totalFeePercent.div(100);

  const sellingCosts = salePrice.mul(totalFeePercentDecimal);

  // if (targetMonth === 37 && exitMonth === 84 && targetYear === 7) {
  //   console.log(
  //     ' INSIDE SINGLE EV Target Month:',
  //     targetMonth,
  //     'Exit Month:',
  //     exitMonth,
  //   );
  // }

  // const mortgage = calculateRemainingMortgageBalance(
  //   mortgageEntry.mortgage,
  //   mortgageEntry.refinancePMT,
  //   targetMonth,
  //   exitMonth,
  // );

  //WORKING HERE 6/17/25
  const mortgage = calculateRemainingMortgageBalanceWithRefinance(
    mortgageEntry.mortgage,
    mortgageEntry.refinancePMT,
    refinaceMonthlyRate,
    targetMonth,
    exitMonth,
  );

  // console.log('dat:', mortgage, exitMonth, targetMonth, targetYear);

  const netProceeds = salePrice.minus(sellingCosts).minus(mortgage);

  // 3. Calculate total due investor

  const totalDividendsPaid = calculateTotalDividendsPaid(noRefinanceResults);
  const preferredDividend = new Decimal(investmentAmount)
    .mul(preferredReturnPerc)
    .div(100)
    .mul(targetYear);

  const totalDueInvestor = preferredDividend
    .plus(investmentAmount) // Return of capital
    .minus(totalDividendsPaid); // Subtract dividends already paid

  // 4. Calculate excess capital gains
  // const excessCapitalGains = netProceeds.plus(totalDueInvestor);
  const excessCapitalGains = netProceeds.minus(totalDueInvestor);

  // 5. Calculate LP payment (waterfall)
  const lpPayment = excessCapitalGains.mul(waterfallSharePerc).div(100);

  // 6. Calculate GP share
  const gpShare = excessCapitalGains.minus(lpPayment);

  // console.log(
  //   targetYear,
  //   salePrice,
  //   sellingCosts,
  //   netProceeds,
  //   totalDueInvestor,
  //   excessCapitalGains,
  //   lpPayment,
  //   gpShare,
  // );

  return {
    year: targetYear,
    salePrice: salePrice.toDecimalPlaces(0).toNumber(),
    sellingCosts: sellingCosts.toDecimalPlaces(0).toNumber(),
    mortgageBalance: mortgage.toFixed(),
    netProceeds: netProceeds.toDecimalPlaces(0).toNumber(),
    totalDueInvestor: totalDueInvestor.toDecimalPlaces(0).toNumber(),
    excessCapitalGains: excessCapitalGains.toDecimalPlaces(0).toNumber(),
    lpPayment: lpPayment.toDecimalPlaces(0).toNumber(),
    gpShare: gpShare.toDecimalPlaces(0).toNumber(),
    totalDividendsPaid,
    preferredDividend,
  };
}

export function calculateWithRefinance(
  noiProjection: any[], // row17
  propManagerFees: number, // Property manager fee percentage
  investment: number, // c7
  syndiAumFee: number, // D29
  primaryAndRefinanceData: {
    primary: number[];
    refinanced: Array<{ month: string; payments: number[] }>;
  },
  dynamicOne: string, // Determines if property management fees apply
  dynamicTwo: string, // Determines if AUM fees apply
  capitalLift: number,
  years: number, // Analysis period (5, 7, or 10 years)
  refinanceMonth: number | null, // Month when refinance occurs (37, 49, 61) or null for no refinance
) {
  const annualCashFlows = [];
  let refinanceData: number[] | null = null;
  let refinanceStartYear = 0;

  // Find the matching refinance data if refinanceMonth is provided
  if (refinanceMonth !== null) {
    const refinanceOption = primaryAndRefinanceData.refinanced.find(
      (r) => parseInt(r.month) === refinanceMonth,
    );

    refinanceData = refinanceOption?.payments || null;
    refinanceStartYear = Math.floor(refinanceMonth / 12); // Convert month to starting year
  }

  for (let year = 0; year < years; year++) {
    let refinancePayout = 0;

    const noiValue = new Decimal(noiProjection[year]?.realizedNoi || 0);
    const propertyManagementFee = noiValue
      .div(0.2)
      .mul(propManagerFees)
      .div(100);
    const aumFee = new Decimal(investment).mul(syndiAumFee).div(100);

    let debtService: Decimal;
    if (refinanceData && year >= refinanceStartYear) {
      const refinanceYearIndex = year - refinanceStartYear;
      debtService = new Decimal(refinanceData[refinanceYearIndex] || 0);

      if (year == refinanceStartYear) {
        refinancePayout = capitalLift;
      }
    } else {
      debtService = new Decimal(primaryAndRefinanceData.primary[year] || 0);
    }

    let cashFlow = noiValue;
    if (dynamicTwo === DROP_DOWN.YES) {
      cashFlow = cashFlow.minus(propertyManagementFee);
    }
    if (dynamicOne === DROP_DOWN.YES) {
      cashFlow = cashFlow.minus(aumFee);
    }
    cashFlow = cashFlow
      .minus(debtService)
      .add(refinancePayout)
      .toDecimalPlaces(0);

    annualCashFlows.push({
      year: year + 1,
      noi: noiValue.toDecimalPlaces(0).toNumber(),
      propertyManagementFee: propertyManagementFee
        .toDecimalPlaces(0)
        .toNumber(),
      aumFee: aumFee.toDecimalPlaces(0).toNumber(),
      debtService: debtService.toDecimalPlaces(0).toNumber(), // Show as positive value
      cashFlow: cashFlow.toDecimalPlaces().toNumber(),
    });
  }

  return annualCashFlows;
}

export function calculateWithRefinanceForYear10(
  noiProjection: any[],
  propManagerFees: number,
  investment: number,
  syndiAumFee: number,
  primaryAndRefinanceData: {
    primary: number[];
    refinanced: Array<{ month: string; payments: number[] }>;
  },
  dynamicOne: string,
  dynamicTwo: string,
  capitalLift: number,
  years: number,
  refinanceMonth: number | null,
  prefDividentRate: number,
  waterFallShareRate: number,
) {
  const annualCashFlows = [];
  let refinanceData: number[] | null = null;
  let refinanceStartYear = 0;
  let cumulativeDividends = new Decimal(0);
  let investorBalanceDue = new Decimal(0);

  if (refinanceMonth !== null) {
    const refinanceOption = primaryAndRefinanceData.refinanced.find(
      (r) => parseInt(r.month) === refinanceMonth,
    );
    refinanceData = refinanceOption?.payments || null;
    refinanceStartYear = Math.floor(refinanceMonth / 12);
  }

  for (let year = 0; year < years; year++) {
    let refinancePayout = 0;
    const currentYear = year + 1;

    const noiValue = new Decimal(noiProjection[year]?.realizedNoi || 0);
    const propertyManagementFee = noiValue
      .div(0.2)
      .mul(propManagerFees)
      .div(100);
    const aumFee = new Decimal(investment).mul(syndiAumFee).div(100);

    let debtService: Decimal;
    if (refinanceData && year >= refinanceStartYear) {
      const refinanceYearIndex = year - refinanceStartYear;
      debtService = new Decimal(refinanceData[refinanceYearIndex] || 0);
      if (year == refinanceStartYear) {
        refinancePayout = capitalLift;
      }
    } else {
      debtService = new Decimal(primaryAndRefinanceData.primary[year] || 0);
    }

    let availableDividends = noiValue;
    if (dynamicTwo === DROP_DOWN.YES) {
      availableDividends = availableDividends.minus(propertyManagementFee);
    }
    if (dynamicOne === DROP_DOWN.YES) {
      availableDividends = availableDividends.minus(aumFee);
    }
    availableDividends = availableDividends
      .minus(debtService)
      .toDecimalPlaces(0);

    // Initialize all special fields to 0 for year 1
    let prefDividendDue = new Decimal(0);
    let excessDividendPaid = new Decimal(0);

    if (currentYear > 1) {
      cumulativeDividends = cumulativeDividends.plus(availableDividends);
      prefDividendDue = new Decimal(investment)
        .mul(new Decimal(prefDividentRate).div(100))
        .mul(currentYear)
        .toDecimalPlaces(0);
      excessDividendPaid = cumulativeDividends.minus(prefDividendDue);
      investorBalanceDue = new Decimal(investment)
        .plus(excessDividendPaid)
        .minus(refinancePayout);
    }

    // CASH FLOW CALCULATION
    let cashFlow;
    if (currentYear === 1) {
      // SPECIAL CASE: Year 1 cashFlow equals availableDividends
      cashFlow = availableDividends;
    } else if (investorBalanceDue.lt(0)) {
      // Waterfall case
      cashFlow = availableDividends.mul(waterFallShareRate / 100);
    } else {
      // Normal case
      cashFlow = availableDividends.plus(refinancePayout);
    }
    cashFlow = cashFlow.toDecimalPlaces(0);

    annualCashFlows.push({
      year: currentYear,
      noi: noiValue.toDecimalPlaces(0).toNumber(),
      propertyManagementFee: propertyManagementFee
        .toDecimalPlaces(0)
        .toNumber(),
      aumFee: aumFee.toDecimalPlaces(0).toNumber(),
      debtService: debtService.toDecimalPlaces(0).toNumber(),
      cashFlow: cashFlow.toNumber(),
      availableToBeDividends: availableDividends.toNumber(),
      cumulativeDividends: currentYear > 1 ? cumulativeDividends.toNumber() : 0,
      preferredDividendDue: currentYear > 1 ? prefDividendDue.toNumber() : 0,
      excessDividendPaid: currentYear > 1 ? excessDividendPaid.toNumber() : 0,
      investorBalanceDue: currentYear > 1 ? investorBalanceDue.toNumber() : 0,
    });
  }

  return annualCashFlows;
}

// export function calculateWithRefinanceForYear10(
//   noiProjection: any[], // row17
//   propManagerFees: number, // Property manager fee percentage
//   investment: number, // c7
//   syndiAumFee: number, // D29
//   primaryAndRefinanceData: {
//     primary: number[];
//     refinanced: Array<{ month: string; payments: number[] }>;
//   },
//   dynamicOne: string, // Determines if property management fees apply
//   dynamicTwo: string, // Determines if AUM fees apply
//   capitalLift: number,
//   years: number, // Analysis period (5, 7, or 10 years)
//   refinanceMonth: number | null, // Month when refinance occurs (37, 49, 61) or null for no refinance
// ) {
//   const annualCashFlows = [];
//   let refinanceData: number[] | null = null;
//   let refinanceStartYear = 0;

//   // Find the matching refinance data if refinanceMonth is provided
//   if (refinanceMonth !== null) {
//     const refinanceOption = primaryAndRefinanceData.refinanced.find(
//       (r) => parseInt(r.month) === refinanceMonth,
//     );

//     refinanceData = refinanceOption?.payments || null;
//     refinanceStartYear = Math.floor(refinanceMonth / 12); // Convert month to starting year
//   }

//   for (let year = 0; year < years; year++) {
//     let refinancePayout = 0;

//     const noiValue = new Decimal(noiProjection[year]?.realizedNoi || 0);
//     const propertyManagementFee = noiValue
//       .div(0.2)
//       .mul(propManagerFees)
//       .div(100);
//     const aumFee = new Decimal(investment).mul(syndiAumFee).div(100);

//     let debtService: Decimal;
//     if (refinanceData && year >= refinanceStartYear) {
//       const refinanceYearIndex = year - refinanceStartYear;
//       debtService = new Decimal(refinanceData[refinanceYearIndex] || 0);

//       if (year == refinanceStartYear) {
//         refinancePayout = capitalLift;
//       }
//     } else {
//       debtService = new Decimal(primaryAndRefinanceData.primary[year] || 0);
//     }

//     let cashFlow = noiValue;
//     if (dynamicTwo === DROP_DOWN.YES) {
//       cashFlow = cashFlow.minus(propertyManagementFee);
//     }
//     if (dynamicOne === DROP_DOWN.YES) {
//       cashFlow = cashFlow.minus(aumFee);
//     }
//     cashFlow = cashFlow
//       .minus(debtService)
//       .add(refinancePayout)
//       .toDecimalPlaces(0);

//     annualCashFlows.push({
//       year: year + 1,
//       noi: noiValue.toDecimalPlaces(0).toNumber(),
//       propertyManagementFee: propertyManagementFee
//         .toDecimalPlaces(0)
//         .toNumber(),
//       aumFee: aumFee.toDecimalPlaces(0).toNumber(),
//       debtService: debtService.toDecimalPlaces(0).toNumber(), // Show as positive value
//       cashFlow: cashFlow.toDecimalPlaces().toNumber(),
//     });
//   }

//   return annualCashFlows;
// }

// export function calculateCompleteWithRefinance() {}

export function calculateRemainingMortgageBalanceWithRefinance(
  refMortgage: number,
  monthlyPayment: number,
  refinaceMonthlyRate: number,
  targetMonth: number, //mortgage row 13:24
  refMonth: number, //mortgage row 37:128
) {
  console.log(
    'Remaining Mortgage Balance Calculation:',
    refMortgage,
    monthlyPayment,
    refinaceMonthlyRate,
    targetMonth,
    refMonth,
  );

  const r = new Decimal(refMonth);
  const t = new Decimal(targetMonth);
  let P = new Decimal(refMortgage);
  const i = new Decimal(refinaceMonthlyRate).div(12).div(100); // Convert percentage to decimal
  const pmt = new Decimal(monthlyPayment);

  // console.log('----1111----', targetMonth, refMonth);

  if (r.lt(t)) return 0;
  if (r.eq(t)) return P.toNumber();

  // Calculate monthly rate
  const monthlyRate = i.plus(1).pow(new Decimal(1)).minus(1);

  // Calculate each month sequentially
  for (let m = t.plus(1); m.lte(r); m = m.plus(1)) {
    P = P.times(monthlyRate.plus(1)).minus(pmt);
  }

  // if (refMonth === 37 && targetMonth === 84) {
  //   console.log(
  //     'REMAINING MORTGAGE :',
  //     P.toNumber(),
  //     refMortgage,
  //     monthlyPayment,
  //     annualIncrease,
  //     targetMonth,
  //     refMonth,
  //   );
  // }
  // if (refMonth === 84 && targetMonth === 37) {
  //   console.log(
  //     'REMAINING MORTGAGE 2:',
  //     P.toNumber(),
  //     refMortgage,
  //     monthlyPayment,
  //     annualIncrease,
  //     targetMonth,
  //     refMonth,
  //   );

  return P.toNumber();
}

export function calculateCompleteWithRefinance(
  withRefinanceCalculations: any[],
  // noiProjection: any[],
  // propManagerFees: number,
  investment: number,
  // syndiAumFee: number,
  // primaryData: any[],
  // dynamicOne: string,
  // dynamicTwo: string,
  mortgageData: any[],
  preferredReturnPerc: number,
  waterfallSharePerc: number,
  syndiFeePercent: number,
  transactionFeePercent: number,
  realtorFeePercent: number,
  targetMonth: number, //37, 48, 60
  exitMonth: number, //60, 84, 120
  years: number,
  refinanceRate: number, //input k row
  // principal: number,
  // annualInterest: number,
  // monthlyPayment: number,
) {
  // 1. Calculate annual cash flows
  const annualCashFlows = withRefinanceCalculations;

  // / 2. Calculate exit valuation

  // const targetMonth = years * 12; // 60, 84, or 120
  const exitValuation = calculateSingleExitValuationWithRefinance(
    mortgageData,
    annualCashFlows,
    investment,
    preferredReturnPerc,
    waterfallSharePerc,
    syndiFeePercent,
    transactionFeePercent,
    realtorFeePercent,
    targetMonth, // 37, 48, 60
    exitMonth, // 60, 84, 120
    years,
    refinanceRate, // input k row
  );

  if (!exitValuation) {
    throw new BadRequestException(
      `Error While Calculating Valuation for ${years} year exit. Try with different values and report the bug. Thank You!`,
    );
  }

  // if (targetMonth === 37 && exitMonth === 84 && years === 7) {
  //   console.log(exitValuation);
  // }
  // const logData = { exitValuation, targetMonth, exitMonth, years };
  // console.log(logData);

  // console.log('Exit Valuation:', years, targetMonth, exitMonth, exitValuation);

  const is5YearExit = years === 5 && targetMonth === 60;
  // const is7YearExit = years === 7 && targetMonth === 48;
  // const is10YearExit = years === 10 && targetMonth === 60;

  // 3. Calculate cash flow from closing (Total Due Investor)
  let cashFlowFromClosing: number;

  if (is5YearExit) {
    cashFlowFromClosing = new Decimal(exitValuation.gpShare)
      .toDecimalPlaces(0)
      .toNumber();

    // console.log('++++exit++++', exitMonth, targetMonth, years);
  } else {
    cashFlowFromClosing = new Decimal(exitValuation.lpPayment)
      .toDecimalPlaces(0)
      .toNumber();
  }

  // 4. Calculate cash flow total (sum of annual + closing + investment)
  const totalAnnualCashFlow = annualCashFlows.reduce(
    (sum, flow) => sum.plus(new Decimal(flow.cashFlow)),
    new Decimal(0),
  );
  const cashFlowTotal = totalAnnualCashFlow
    .plus(cashFlowFromClosing)
    .plus(investment)
    .toDecimalPlaces(2)
    .toNumber();

  // 5. Calculate cash-on-cash returns
  const investmentDec = new Decimal(investment);
  const cashFlowsWithCoc = annualCashFlows.map((flow) => ({
    ...flow,
    noi: new Decimal(flow.noi).toDecimalPlaces(0).toNumber(),
    propertyManagementFee: new Decimal(flow.propertyManagementFee)
      .toDecimalPlaces(2)
      .toNumber(),
    aumFee: new Decimal(flow.aumFee).toDecimalPlaces(2).toNumber(),
    cashFlow: new Decimal(flow.cashFlow).toDecimalPlaces(0).toNumber(),
    cashOnCashReturn:
      investment > 0
        ? new Decimal(flow.cashFlow)
            .div(investmentDec)
            .mul(100)
            .toDecimalPlaces(2)
            .toNumber()
        : 0,
  }));

  // 6. Calculate average cash-on-cash
  const averageCashOnCash = new Decimal(
    cashFlowsWithCoc.reduce((sum, flow) => sum + flow.cashOnCashReturn, 0) /
      years,
  )
    .toDecimalPlaces(2)
    .toNumber();

  // 7. Calculate total and annualized return
  const totalReturn = new Decimal(cashFlowTotal)
    .div(investment)
    .mul(100)
    .toDecimalPlaces(2)
    .toNumber();
  const annualizedReturn = new Decimal(totalReturn)
    .div(years)
    .toDecimalPlaces(2)
    .toNumber();

  // 8. Calculate IRR

  let irrCashFlows;

  if (years == 5) {
    irrCashFlows = [
      -investment, // Initial investment (negative)
      ...annualCashFlows.map((flow) => flow.cashFlow),
      cashFlowFromClosing + investment,
    ];
  } else if (years == 7) {
    irrCashFlows = [
      -investment, // Initial investment (negative)
      ...annualCashFlows.map((flow) => flow.cashFlow),
      cashFlowFromClosing,
      cashFlowFromClosing + investment,
    ];
  } else if (years == 10) {
    irrCashFlows = [
      -investment, // Initial investment (negative)
      ...annualCashFlows.map((flow) => flow.cashFlow),
      cashFlowFromClosing,
      cashFlowFromClosing + investment,
    ];
  }

  console.log(
    'IRR Cash Flows:',
    irrCashFlows,
    years,
    targetMonth,
    exitMonth,
    cashFlowFromClosing,
    investment,
  );

  // const irrCashFlows = [
  //   -investment, // Initial investment (negative)
  //   ...annualCashFlows.map((flow) => flow.cashFlow),
  //   cashFlowFromClosing + investment,
  // ];

  const irrValue = new Decimal(irr(irrCashFlows, 0.1) * 100)
    .toDecimalPlaces(2)
    .toNumber();

  console.log(irrValue, 'IRR Value');

  return {
    annualCashFlows: cashFlowsWithCoc,
    cashFlowFromClosing,
    cashFlowTotal,
    averageCashOnCash,
    totalReturn,
    annualizedReturn,
    irr: irrValue,
  };
}
