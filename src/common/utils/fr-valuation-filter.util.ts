import Decimal from 'decimal.js';
import { irr } from 'financial'; // Using financial library for IRR calculation
import { DROP_DOWN } from 'src/modules/analytics/enums/input-fields.enum';
import { calculateRemainingMortgageBalance } from './fr-mortgage-filter.util';

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
      // Calculate Target NOI
      const targetNoi = previousNoi.mul(annualIncreaseFactor);

      // Calculate Realized NOI with occupancy adjustment
      const currentOccupancy = new Decimal(occupancyRates[year - 1]).div(100);
      // const occupancyAdjustment = currentOccupancy.div(baseOccupancy);
      // const realizedNoi = targetNoi.mul(occupancyAdjustment);
      const step1 = targetNoi.div(baseOccupancy);
      const realizedNoi = step1.mul(currentOccupancy);

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

export function calculateExitValuations(
  mortgageData: any[],
  noiResults5yr: any, // NOI results for 5 years
  noiResults7yr: any, // NOI results for 7 years
  noiResults10yr: any, // NOI results for 10 years
  investmentAmount: number, // C7
  preferredReturnPerc: number, // D25
  waterfallSharePerc: number, // D26
  syndiFeePercent: number, // D34
  transactionFeePercent: number, // D35
  realtorFeePercent: number, // D36
  principal: number,
  annualInterest: number,
  monthlyPayment: number,
): [] {
  const results = [];

  // Calculate for 5th year (month 60)
  const year5 = calculateSingleExitValuation(
    mortgageData,
    noiResults5yr,
    investmentAmount,
    preferredReturnPerc,
    waterfallSharePerc,
    syndiFeePercent,
    transactionFeePercent,
    realtorFeePercent,
    60,
    5,
    principal,
    annualInterest,
    monthlyPayment,
  );
  if (year5) results.push(year5);

  // Calculate for 7th year (month 84)
  const year7 = calculateSingleExitValuation(
    mortgageData,
    noiResults7yr,
    investmentAmount,
    preferredReturnPerc,
    waterfallSharePerc,
    syndiFeePercent,
    transactionFeePercent,
    realtorFeePercent,
    84,
    7,
    principal,
    annualInterest,
    monthlyPayment,
  );
  if (year7) results.push(year7);

  // Calculate for 10th year (month 120)
  const year10 = calculateSingleExitValuation(
    mortgageData,
    noiResults10yr,
    investmentAmount,
    preferredReturnPerc,
    waterfallSharePerc,
    syndiFeePercent,
    transactionFeePercent,
    realtorFeePercent,
    120,
    10,
    principal,
    annualInterest,
    monthlyPayment,
  );
  if (year10) results.push(year10);

  return results as any;
}

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
    targetMonth,
  );

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
  let capitalLift_dec = new Decimal(capitalLift);

  let refinancePayout = 0;

  // Find the matching refinance data if refinanceMonth is provided
  if (refinanceMonth !== null) {
    const refinanceOption = primaryAndRefinanceData.refinanced.find(
      (r) => parseInt(r.month) === refinanceMonth,
    );

    refinanceData = refinanceOption?.payments || null;
    refinanceStartYear = Math.floor(refinanceMonth / 12); // Convert month to starting year
  }

  for (let year = 0; year < years; year++) {
    const noiValue = new Decimal(noiProjection[year]?.realizedNoi || 0);
    const propertyManagementFee = noiValue
      .div(0.2)
      .mul(propManagerFees)
      .div(100);
    const aumFee = new Decimal(investment).mul(syndiAumFee).div(100);

    // Determine which debt service to use
    let debtService: Decimal;
    if (refinanceData && year >= refinanceStartYear) {
      // Use refinanced payments (adjusting for the year offset)
      const refinanceYearIndex = year - refinanceStartYear;
      debtService = new Decimal(refinanceData[refinanceYearIndex] || 0);

      if (refinancePayout == 0) {
        refinancePayout = capitalLift;
      }
    } else {
      // Use primary payments
      debtService = new Decimal(primaryAndRefinanceData.primary[year] || 0);
    }

    // Calculate cash flow with conditional fee application
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

    // if (years == 5) {
    //   console.log(
    //     year,
    //     refinanceStartYear,
    //     refinancePayout,
    //     cashFlow,
    //     propManagerFees,
    //     debtService,
    //   );
    // }

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
  const averageCashOnCash = new Decimal(
    cashFlowsWithCoc.reduce((sum, flow) => sum + flow.cashOnCashReturn, 0) /
      years,
  )
    .toDecimalPlaces(0)
    .toNumber();

  // 7. Calculate total and annualized return
  const totalReturn = new Decimal(cashFlowTotal)
    .div(investment)
    .mul(100)
    .toDecimalPlaces(0)
    .toNumber();
  const annualizedReturn = new Decimal(totalReturn)
    .div(years)
    .toDecimalPlaces(0)
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
