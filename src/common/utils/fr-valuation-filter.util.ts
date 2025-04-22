import Decimal from 'decimal.js';
import { DROP_DOWN } from 'src/modules/analytics/enums/input-fields.enum';

export function calculatePurchasePrice(
  asking_price: number,
  offer_perc: number,
): Decimal {
  return new Decimal(asking_price).mul(new Decimal(offer_perc).div(100))
}

export function calculateDownPayment(
  calc_purchasePrice: Decimal,
  financingLtvPercent: number,
): Decimal {
  console.log(calc_purchasePrice, financingLtvPercent);

  return calc_purchasePrice.mul(new Decimal(financingLtvPercent).div(100));
}

export function calculateInvestment(
  downPayment: Decimal,
  closingCosts: number,
  reserve: number,
): Decimal {
  console.log('--', typeof downPayment);

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
      const occupancyAdjustment = currentOccupancy.div(baseOccupancy);
      const realizedNoi = targetNoi.mul(occupancyAdjustment);

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

    const salePrice = new Decimal(data.value)

    const sellingCosts = salePrice.mul(totalFeePercent);

    const netProceeds = salePrice.minus(sellingCosts)

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
  realtorFeePercent: number // D36
): [] {
  const results = [];

  console.log(noiResults10yr, noiResults5yr);
  
  
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
    5
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
    7
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
    10
  );
  if (year10) results.push(year10);

  return results as any
}

function calculateSingleExitValuation(
  mortgageData: any[],
  noiResults: any[],
  investmentAmount: number,
  preferredReturnPerc: number,
  waterfallSharePerc: number,
  syndiFeePercent: number,
  transactionFeePercent: number,
  realtorFeePercent: number,
  targetMonth: number,
  targetYear: number
){
  // 1. Get sale price from mortgage data
  const mortgageEntry = mortgageData.find(d => d.month === targetMonth);
  if (!mortgageEntry) return null;
  
  const salePrice = new Decimal(mortgageEntry.value);

  // 2. Calculate net proceeds
  const totalFeePercent = new Decimal(syndiFeePercent)
    .plus(transactionFeePercent)
    .plus(realtorFeePercent)
    .div(100);
  const sellingCosts = salePrice.mul(totalFeePercent);
  const netProceeds = salePrice.minus(sellingCosts);

  // 3. Calculate total due investor
  const totalDividendsPaid = calculateTotalDividendsPaid(noiResults);
  const preferredDividend = new Decimal(investmentAmount)
    .mul(preferredReturnPerc)
    .div(100)
    .mul(targetYear);
  
  const totalDueInvestor = preferredDividend
    .plus(investmentAmount) // Return of capital
    .minus(totalDividendsPaid); // Subtract dividends already paid

  // 4. Calculate excess capital gains
  const excessCapitalGains = netProceeds.plus(totalDueInvestor);

  // 5. Calculate LP payment (waterfall)
  const lpPayment = excessCapitalGains.mul(waterfallSharePerc).div(100);

  // 6. Calculate GP share
  const gpShare = excessCapitalGains.minus(lpPayment);

  return {
    year: targetYear,
    salePrice: salePrice.toDecimalPlaces(2).toNumber(),
    sellingCosts: sellingCosts.toDecimalPlaces(2).toNumber(),
    netProceeds: netProceeds.toDecimalPlaces(2).toNumber(),
    totalDueInvestor: totalDueInvestor.toDecimalPlaces(2).toNumber(),
    excessCapitalGains: excessCapitalGains.toDecimalPlaces(2).toNumber(),
    lpPayment: lpPayment.toDecimalPlaces(2).toNumber(),
    gpShare: gpShare.toDecimalPlaces(2).toNumber()
  };
}

function calculateTotalDividendsPaid(noiResults: any[]): Decimal {
  return noiResults.reduce(
    (sum, result) => sum.plus(result.cashFlow > 0 ? result.cashFlow : 0),
    new Decimal(0)
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
  years: number // Analysis period (5, 7, or 10 years)
) {
  const annualCashFlows = [];
  // let totalCashFlow = new Decimal(0);
  // let totalCashOnCashReturn = new Decimal(0);

  for (let year = 0; year < years; year++) {
    // Use realizedNoi if available, otherwise fall back to targetNoi
    const noiValue = new Decimal(
      noiProjection[year]?.realizedNoi || 0
    );

    const propertyManagementFee = noiValue.div(0.2).mul(propManagerFees).div(100)

    // 3. Calculate AUM Fee (if dynamicTwo is 'Y')
    const aumFee = new Decimal(investment).mul(syndiAumFee).div(100)

    // 4. Get Debt Service (from refinanceData)
    const debtService = new Decimal(
      primaryData[year] || 0
  )

      // 5. Calculate Cash Flow with conditional fee application
      let cashFlow = noiValue;
    
      if (dynamicOne === DROP_DOWN.YES) {
        cashFlow = cashFlow.minus(propertyManagementFee);
      }
      if (dynamicTwo === DROP_DOWN.YES) {
        cashFlow = cashFlow.minus(aumFee);
      }
      cashFlow = cashFlow.plus(debtService);

    // Calculate AUM Fee (if dynamicTwo is 'Y')
    // const aumFee = dynamicTwo === DROP_DOWN.YES
    //   ? new Decimal(investment).mul(new Decimal(syndiAumFee).div(100)
    //   : new Decimal(0);

    // Calculate Cash Flow Before Tax
    // const cashFlowBeforeTax = noiValue
    //   .minus(propertyManagementFee)
    //   .minus(aumFee);

    // Calculate Cash on Cash Return
    // const cashOnCashReturn = investment > 0
    //   ? cashFlowBeforeTax.div(investment).mul(100)
    //   : new Decimal(0);

    // Add to totals
    // totalCashFlow = totalCashFlow.plus(cashFlowBeforeTax);
    // totalCashOnCashReturn = totalCashOnCashReturn.plus(cashOnCashReturn);

    annualCashFlows.push({
      year: year + 1,
      noi: noiValue.toDecimalPlaces(2).toNumber(),
      propertyManagementFee: propertyManagementFee.toDecimalPlaces(2).toNumber(),
      aumFee: aumFee.toDecimalPlaces(2).toNumber(),
      cashFlow
      // cashFlowBeforeTax: cashFlowBeforeTax.toDecimalPlaces(2).toNumber(),
      // cashOnCashReturn: cashOnCashReturn.toDecimalPlaces(2).toNumber()
    });
  }

  return annualCashFlows
}

