import Decimal from 'decimal.js';

export function calculatePurchasePrice(
  asking_price: number,
  offer_perc: number,
): Decimal {
  return new Decimal(asking_price).mul(new Decimal(offer_perc).div(100));
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

export function calculateNetProceeds(
  salePrice: number,
  mortgageBalance: number,
  syndicatorFeePercent: number, // D34
  transactionAndBankFeePercent: number, // D35
  realtorFeePercent: number, // D36
): Decimal {
  const salePriceDec = new Decimal(salePrice);
  const mortgageBalanceDec = new Decimal(mortgageBalance);
  const syndicatorFeeDec = new Decimal(syndicatorFeePercent);
  const transactionFeeDec = new Decimal(transactionAndBankFeePercent);
  const realtorFeeDec = new Decimal(realtorFeePercent);

  const totalSellingFeePercent = syndicatorFeeDec
    .plus(transactionFeeDec)
    .plus(realtorFeeDec)
    .div(100); // convert to decimal format

  const sellingCosts = salePriceDec.mul(totalSellingFeePercent);

  const netProceeds = salePriceDec
    .minus(sellingCosts)
    .minus(mortgageBalanceDec);

  return netProceeds;
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
        targetNoi: targetNoi.toDecimalPlaces(2).toNumber(),
        realizedNoi: realizedNoi.toDecimalPlaces(2).toNumber(),
      });

      previousNoi = targetNoi;
    }

    return projections;
  }
}
