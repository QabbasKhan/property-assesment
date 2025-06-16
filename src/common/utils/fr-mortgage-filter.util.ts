import Decimal from 'decimal.js';

/**
 * Calculate loan principal amount
 * Formula: askingPrice * (offerPerc/100) * (ltvPerc/100)
 */
export function mortgageLoanPrincipal(
  asking_price: number,
  offer_perc: number,
  financing_ltv_perc: number,
): number {
  return new Decimal(asking_price)
    .mul(new Decimal(offer_perc).div(100))
    .mul(new Decimal(financing_ltv_perc).div(100))
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Calculate monthly interest rate
 * Formula: annualRate / 12
 * @throws if invalid rate
 */
export function calculateMonthlyInterestRate(annualRate: number): number {
  const rate = new Decimal(annualRate);
  //   if (rate.lte(0)) throw new BadRequestException('Annual rate must be > 0');
  return rate.div(100).div(12).toDecimalPlaces(6).toNumber();
}

/**
 * Calculate total payment periods
 * Formula: years * 12
 */
export function calculateTotalPayments(years: number): number {
  return new Decimal(years).mul(12).toNearest(1).toNumber();
}

/*
 * Calculate monthly mortgage payment (P&I)
 * Formula: P * (r(1+r)^n) / ((1+r)^n-1)
 *
 * @param principal - Loan amount in dollars
 * @param annualRate - Annual interest rate (e.g., 5.5 for 5.5%)
 * @param years - Loan term in years
 * @returns Monthly payment amount rounded to 2 decimal places (cents)
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number,
): number {
  // Validate inputs
  //   if (principal <= 0) throw new Error('Principal must be greater than 0');
  //   if (annualRate <= 0) throw new Error('Annual rate must be greater than 0');
  //   if (years <= 0) throw new Error('Loan term must be greater t

  const P = new Decimal(principal);
  const r = new Decimal(annualRate); // Monthly rate with 6 intermediate precision
  const n = new Decimal(years); // Total months
  // const r = new Decimal(annualRate).div(100).div(12).toDecimalPlaces(6); // Monthly rate with 6 intermediate precision
  // const n = new Decimal(years).mul(12); // Total months

  // Calculate (1+r)^n
  const onePlusR = new Decimal(1).plus(r);
  const onePlusRPowN = onePlusR.pow(n);

  // Full calculation: P * (r * onePlusRPowN) / (onePlusRPowN - 1)
  return P.mul(r.mul(onePlusRPowN))
    .div(onePlusRPowN.minus(1))
    .toDecimalPlaces(2) // Round to cents
    .toNumber();
}

/**
 * Calculate interest-only payment amount
 *
 * @param askingPrice - Input D6 (asking_price)
 * @param offerPerc - Input D7 (offer_perc)
 * @param annualInterestRate - Input D14 (loan_annual_intr)
 * @returns Monthly interest-only payment rounded to 2 decimal places (currency)
 */
export function calculateInterestOnlyPayment(
  principal: number,
  // offerPerc: number,
  annualInterestRate: number,
): number {
  // Convert all inputs to Decimal for precise calculations
  // const principal = new Decimal(askingPrice).mul(
  //   new Decimal(offerPerc).div(100),
  // );

  const dec_principal = new Decimal(principal);
  const monthlyRate = new Decimal(annualInterestRate).div(100).div(12);

  return dec_principal
    .mul(monthlyRate)
    .toDecimalPlaces(2) // Round to cents
    .toNumber();
}

/**
 * CORRECTED mortgage balance calculation
 * Formula: Bt = P*(1+r)^t - M*[((1+r)^t - 1)/r]
 *
 * @param principal - Initial loan amount
 * @param annualRate - Annual interest rate (e.g., 5.5 for 5.5%)
 * @param monthlyPayment - Monthly payment amount
 * @param monthsElapsed - Months since loan start
 * @returns Remaining balance
 */
// here
export function calculateRemainingMortgageBalance(
  principal: number,
  annualRate: number,
  monthlyPayment: number,
  monthsElapsed: number,
): number {
  const P = new Decimal(principal);
  const r = new Decimal(annualRate).div(100).div(12);
  const M = new Decimal(monthlyPayment);
  const t = new Decimal(monthsElapsed);

  // (1+r)^t
  const onePlusRPowT = r.plus(1).pow(t);

  // [((1+r)^t - 1)/r]
  const paymentFactor = onePlusRPowT.minus(1).div(r);

  // P*(1+r)^t - M*[((1+r)^t - 1)/r]
  return P.mul(onePlusRPowT)
    .minus(M.mul(paymentFactor))
    .toDecimalPlaces(2)
    .toNumber();
}

//------------------helpers----------------------//
export function calculateOriginalLoanPayments(
  baseMonthlyPayment: number,
  interestOnlyMonths: number,
  firstPaymentMonth: number,
  analysisYears: number,
): number[] {
  const payments: number[] = [];
  const monthlyPmt = new Decimal(baseMonthlyPayment).abs(); // Ensure positive

  // Year 1 calculation
  if (interestOnlyMonths > 0) {
    const effectiveMonths = 12 - Math.min(firstPaymentMonth - 1, 11);
    payments.push(monthlyPmt.mul(effectiveMonths).toNumber());
  } else {
    payments.push(monthlyPmt.mul(12).toNumber());
  }

  // Subsequent years (2 through analysis period)
  for (let year = 2; year <= analysisYears; year++) {
    payments.push(monthlyPmt.mul(12).toNumber());
  }

  return payments;
}

function calculateRefinancedPayments(
  refinancedMonthlyPayment: number,
  refinanceMonth: number,
  totalAnalysisMonths: number,
): number[] {
  const payments: number[] = [];
  const monthlyPmt = new Decimal(refinancedMonthlyPayment).abs(); // Ensure positive

  // Calculate the year when refinance occurs (1-based)
  const refinanceYear = Math.ceil(refinanceMonth / 12);

  // Calculate remaining months in the refinance year
  const monthsInRefinanceYear = 12 - (refinanceMonth % 12 || 12);

  // 1st year of refinance (partial year)
  payments.push(monthlyPmt.mul(monthsInRefinanceYear).toNumber());

  // Full years after refinance
  const remainingMonths = totalAnalysisMonths - refinanceMonth;
  const fullYears = Math.floor(remainingMonths / 12);

  for (let year = 1; year <= fullYears; year++) {
    payments.push(monthlyPmt.mul(12).toNumber());
  }

  return payments;
}

//---------------------tables--------------------//

export class AnnualPaymentCalculator {
  /**
   * Original Mortgage Payments
   */
  static calculateOriginalPayments(
    monthlyPayment: number,
    interestOnlyMonths: number,
    firstPaymentMonth: number,
    interestOnlyPayment: number,
    analysisYears: number = 10,
  ): number[] {
    const payments: number[] = [];
    const monthlyPmt = new Decimal(monthlyPayment).abs();
    const interestOnlyPmt = new Decimal(interestOnlyPayment);

    //-----------------------------------------old-----------------------------------------//

    // Year 1 Calculation
    // if (interestOnlyMonths > 0) {
    //   const effectiveMonths = new Decimal(12).minus(interestOnlyMonths);
    //   payments.push(monthlyPmt.mul(effectiveMonths).toNumber());
    //   // console.log(effectiveMonths, interestOnlyMonths, monthlyPayment);
    // } else {
    //   payments.push(monthlyPmt.mul(12).toNumber());
    // }

    // // Years 2-10
    // for (let year = 2; year <= analysisYears; year++) {
    //   payments.push(monthlyPmt.mul(12).toNumber());
    // }
    //-----------------------------------------old-----------------------------------------//

    //-----------------------------------------new-----------------------------------------//

    // Interest-only months per year
    const year1IOMonths =
      interestOnlyMonths > 0
        ? Math.max(0, Math.min(12, interestOnlyMonths) - firstPaymentMonth + 1)
        : 0;

    const year2IOMonths =
      interestOnlyMonths > 12
        ? interestOnlyMonths < 25
          ? interestOnlyMonths - 12
          : interestOnlyMonths < 36
            ? 12
            : 0
        : 0;

    const year3IOMonths = interestOnlyMonths > 24 ? interestOnlyMonths - 24 : 0;

    // console.log(year1IOMonths, year2IOMonths, year3IOMonths);

    for (let year = 1; year <= analysisYears; year++) {
      let ioMonths = 0;
      let piMonth = new Decimal(12);
      if (year === 1) {
        ioMonths = year1IOMonths;
        piMonth = new Decimal(12)
          .minus(firstPaymentMonth)
          .add(1)
          .minus(ioMonths);
      } else if (year === 2) {
        ioMonths = year2IOMonths;
        piMonth = new Decimal(12).minus(ioMonths);
      } else if (year === 3) {
        ioMonths = year3IOMonths;
        piMonth = new Decimal(12).minus(ioMonths);
      }

      // console.log(year, ioMonths, piMonth);

      const mortgage = monthlyPmt.mul(piMonth);
      const toAdd = interestOnlyPmt.mul(ioMonths);
      payments.push(mortgage.add(toAdd).toNumber());
    }

    //-----------------------------------------new-----------------------------------------//

    return payments;
  }

  /**
   * Refinanced Mortgage Payments
   */
  static calculateRefinancedPayments(
    refinancedMonthlyPayment: number,
    refinanceMonth: number,
    analysisYears: number = 10,
  ): { month: string; payments: number[] } {
    const payments: number[] = [];
    const monthlyPmt = new Decimal(refinancedMonthlyPayment).abs();
    const refinanceYear = Math.ceil(refinanceMonth / 12);

    // First Year of Refinance (Partial Year)
    // if (refinanceYear <= analysisYears) {
    //   const monthsPaid = refinanceMonth % 12 || 12;
    //   payments.push(monthlyPmt.mul(12 - monthsPaid).toNumber());
    // }

    payments.push(monthlyPmt.mul(12 - 1).toNumber());

    // Full Years After Refinance
    const remainingYears = analysisYears - refinanceYear;
    for (let year = 1; year <= remainingYears; year++) {
      payments.push(monthlyPmt.mul(12).toNumber());
    }

    const month = refinanceMonth.toString();
    return { month, payments };
  }
}

export function generateMonthlyCapRates(
  purchaseCapRate: number,
  year5CapRate: number,
  year7CapRate: number,
  year10CapRate: number,
): number[] {
  const capRates = [];

  const rate0 = new Decimal(purchaseCapRate);
  const rate60 = new Decimal(year5CapRate);
  const rate84 = new Decimal(year7CapRate);
  const rate120 = new Decimal(year10CapRate);

  // Step 1: Months 1–60
  const step1 = rate60.minus(rate0).div(60);
  // for (let i = 0; i < 60; i++) {
  //   const monthlyRate37 = rate0.plus(step1.mul(i));
  //   capRates.push(Number(monthlyRate37.toFixed(4)));
  // }

  // Step 2: Months 61–84
  const step2 = rate84.minus(rate60).div(24);
  // for (let i = 0; i < 24; i++) {
  //   const monthlyRate60 = rate60.plus(step2.mul(i));
  //   capRates.push(Number(monthlyRate60.toFixed(4)));
  // }

  // Step 3: Months 85–120
  const step3 = rate120.minus(rate84).div(36);
  // for (let i = 0; i < 36; i++) {
  //   const monthlyRate84 = rate84.plus(step3.mul(i));
  //   capRates.push(Number(monthlyRate84.toFixed(4)));
  // }

  const monthlyRate37 = rate0.plus(step1.mul(36));
  const result37 = Number(monthlyRate37.div(100).toFixed(4));
  capRates.push({ month: '37', capRate: result37 });

  const monthlyRate60 = rate60.plus(step2.mul(59));
  const result60 = Number(monthlyRate60.div(100).toFixed(4));
  capRates.push({ month: '60', capRate: result60 });

  const monthlyRate84 = rate84.plus(step3.mul(83));
  const result84 = Number(monthlyRate84.div(100).toFixed(4));
  capRates.push({ month: '84', capRate: result84 });

  const monthlyRate120 = rate84.plus(step3.mul(120));
  const result120 = Number(monthlyRate84.div(100).toFixed(4));
  capRates.push({ month: '120', capRate: result120 });

  return capRates;
}

export function generateRefinanceCalculations(
  purchaseCapRate: number,
  year5CapRate: number,
  year7CapRate: number,
  year10CapRate: number,
  NOIs: any, // e.g., { 37: 250000, ... }
  LTV: number, // e.g. 0.7
  syndicatorFee: number, // e.g. 0.01
  transactionFee: number, // e.g. 0.005
  monthlyRate: number, // e.g. 0.06 (6%)
  totalPayments: number, // e.g. 30
  principal: number,
  monthlyPayment: number,
) {
  const syndicatorFeeD = new Decimal(syndicatorFee).div(100);
  const transactionFeeD = new Decimal(transactionFee).div(100);
  const LTVD = new Decimal(LTV);
  const capRates = [];

  const rate0 = new Decimal(purchaseCapRate);
  const rate60 = new Decimal(year5CapRate);
  const rate84 = new Decimal(year7CapRate);
  const rate120 = new Decimal(year10CapRate);

  const step1 = rate60.minus(rate0).div(60); // Convert to decimal
  const step2 = rate84.minus(rate60).div(24);
  const step3 = rate120.minus(rate84).div(36);

  const keyFor60 = rate60.minus(rate0).div(60);
  const keyFor84 = rate84.minus(rate60).div(24);
  const keyFor120 = rate120.minus(rate84).div(36);

  console.log('rate:', rate0, rate60, rate84);

  console.log('step1:', step1, step2, step3);

  const targetMonths = [37, 48, 60, 84, 120];

  let lastCapRate = new Decimal(0);
  for (const month of targetMonths) {
    let capRate: Decimal;

    //1st approach long before
    // if (month <= 60) {
    //   capRate = rate0.plus(step1.mul(month - 1));
    //   // console.log(capRate);
    // } else if (month <= 84) {
    //   capRate = rate60.plus(step2.mul(month - 60));
    // } else {
    //   capRate = rate84.plus(step3.mul(month - 84));
    // }

    //2nd approach before 6/16/25
    // if (month < 60) {
    //   capRate = rate0.plus(rate60).div(2);
    //   // console.log(capRate);
    // } else if (month >= 60 && month < 84) {
    //   capRate = rate60.plus(rate84).div(2);
    // } else {
    //   capRate = rate84.plus(rate120).div(2);
    // }

    if (month <= 60) {
      capRate = rate0.plus(step1.mul(month));
      lastCapRate = capRate;
    } else if (month <= 84) {
      const monthDiff = month - 60;
      capRate = lastCapRate.plus(rate60).mul(step2.mul(monthDiff));

      // capRate = rate60.plus(step2.mul(month - 60));
    } else {
      const monthDiff = month - 84;
      capRate = lastCapRate.plus(rate60).mul(step3.mul(monthDiff));

      // capRate = rate84.plus(step3.mul(month - 84));
    }

    let value: Decimal;
    const capRatePercent = capRate.div(100);
    // const capRatePercent = capRate;
    // console.log(purchaseCapRate, capRate, capRatePercent);

    let NOI;
    if (month == 37) {
      // capRatePercent = capRate.div(100).toDecimalPlaces(4); // convert to decimal
      NOI = new Decimal(NOIs[2].realizedNoi);
      value = NOI.div(capRatePercent).toDecimalPlaces(0);
      // console.log(month, NOI);
    } else if (month == 48) {
      // capRatePercent = capRate.div(100).toDecimalPlaces(4); // convert to decimal
      NOI = new Decimal(NOIs[4].realizedNoi);
      value = NOI.div(capRatePercent).toDecimalPlaces(0);
      // console.log(month, NOI);
    } else if (month == 60) {
      // capRatePercent = capRate.div(100).toDecimalPlaces(4); // convert to decimal
      NOI = new Decimal(NOIs[5].realizedNoi);
      value = NOI.div(capRatePercent).toDecimalPlaces(0);
      // console.log(month, NOI);
    } else if (month == 84) {
      // capRatePercent = capRate.div(100).toDecimalPlaces(4); // convert to decimal
      NOI = new Decimal(NOIs[7].realizedNoi);
      value = NOI.div(capRatePercent).toDecimalPlaces(0);
      // console.log(month, NOI);
    } else if (month == 120) {
      // capRatePercent = capRate.div(100).toDecimalPlaces(4); // convert to decimal
      NOI = new Decimal(NOIs[9].realizedNoi);
      value = NOI.div(capRatePercent).toDecimalPlaces(0);
      // console.log(month, NOI);
    } else {
      // capRatePercent = capRate.div(100).toDecimalPlaces(4); // convert to decimal
      NOI = new Decimal(NOIs[9].realizedNoi);
      value = NOI.div(capRatePercent).toDecimalPlaces(0);
      // console.log(month, NOI);
    }

    const mortgage = value.mul(LTVD.div(100)).toDecimalPlaces(0);

    // console.log(syndicatorFee, transactionFee);

    const feesAndCosts = value
      .mul(syndicatorFeeD.plus(transactionFeeD))
      .toDecimalPlaces(0);

    const monthlyRateD = new Decimal(monthlyRate);
    const totalPaymentsD = new Decimal(totalPayments);

    console.log(monthlyRateD, totalPaymentsD);

    //For Refinance PMT
    const one = new Decimal(1);
    const base = one.plus(monthlyRateD); // (1 + monthlyRate)
    const numerator = mortgage.mul(monthlyRateD).mul(base.pow(totalPaymentsD));
    const denominator = base.pow(totalPaymentsD).minus(one);
    const refinancePMT = numerator.div(denominator).toDecimalPlaces(0);

    const onePlusR = monthlyRateD.plus(1);
    const onePlusRPowerT = onePlusR.pow(month);
    const firstTerm = new Decimal(principal).mul(onePlusRPowerT);
    const secondTerm = new Decimal(monthlyPayment)
      .mul(onePlusRPowerT.minus(1))
      .div(monthlyRateD);

    const balanceAtRefinance = firstTerm.minus(secondTerm).toDecimalPlaces(0);

    const balance = mortgage;

    const capitalLift = balance
      .minus(balanceAtRefinance)
      .minus(feesAndCosts)
      .toDecimalPlaces(0);

    // console.log(monthlyRateD, totalPaymentsD, mortgage, balanceAtRefinance);

    capRates.push({
      month,
      capRate: Number(capRatePercent),
      value: Number(value),
      mortgage: Number(mortgage),
      feesAndCosts: Number(feesAndCosts),
      capitalLift: Number(capitalLift),
      refinancePMT: Number(refinancePMT),
      balanceAtRefinance: Number(balanceAtRefinance),
    });
  }

  return capRates;
}

//
export function calculateRefinancedPaymentsNew(
  refinancedMonthlyPayment: number,
  refinanceMonth: number,
  analysisYears: number = 10,
): { month: string; payments: number[] } {
  const payments: number[] = [];
  const monthlyPmt = new Decimal(refinancedMonthlyPayment).abs();
  const refinanceYear = Math.ceil(refinanceMonth / 12);

  // First Year of Refinance (Partial Year)
  // if (refinanceYear <= analysisYears) {
  //   const monthsPaid = refinanceMonth % 12 || 12;
  //   payments.push(monthlyPmt.mul(12 - monthsPaid).toNumber());
  // }

  payments.push(monthlyPmt.mul(12 - 1).toNumber());

  // Full Years After Refinance
  const remainingYears = analysisYears - refinanceYear;
  for (let year = 1; year <= remainingYears; year++) {
    payments.push(monthlyPmt.mul(12).toNumber());
  }

  const month = refinanceMonth.toString();
  return { month, payments };
}

//Un used table functions
export class CapRateCalculator {
  /**
   * Calculate interpolated CAP rate for any month (1-120)
   * @param purchaseCap - H18 (Purchase CAP rate)
   * @param year5Cap - H19 (Year 5 CAP)
   * @param year7Cap - H20 (Year 7 CAP)
   * @param year10Cap - H21 (Year 10 CAP)
   * @param targetMonth - Month to calculate (1-120)
   * @returns CAP rate as percentage (e.g., 5.5 for 5.5%)
   */
  static calculateCapRate(
    purchaseCap: number,
    year5Cap: number,
    year7Cap: number,
    year10Cap: number,
    targetMonth: number,
  ): number {
    const month = new Decimal(targetMonth);

    // Phase 1: Months 1-60 (59 intervals)
    if (month.lessThanOrEqualTo(60)) {
      return new Decimal(purchaseCap)
        .div(100)
        .plus(
          new Decimal(year5Cap)
            .div(100)
            .minus(purchaseCap)
            .mul(month.minus(1).div(59)), // 1/59th per month
        )
        .toDecimalPlaces(4)
        .toNumber();
    }

    // Phase 2: Months 61-84 (24 intervals)
    if (month.lessThanOrEqualTo(84)) {
      return new Decimal(year5Cap)
        .plus(
          new Decimal(year7Cap)
            .div(100)
            .minus(year5Cap)
            .mul(month.minus(60).div(24)), // 1/24th per month
        )
        .toDecimalPlaces(4)
        .toNumber();
    }

    // Phase 3: Months 85-120 (36 intervals)
    return new Decimal(year7Cap)
      .plus(
        new Decimal(year10Cap)
          .div(100)
          .minus(year7Cap)
          .mul(month.minus(84).div(36)), // 1/36th per month
      )
      .toDecimalPlaces(4)
      .toNumber();
  }

  /**
   * Get CAP rates at key milestone months
   */
  static getMilestoneCapRates(
    purchaseCap: number,
    year5Cap: number,
    year7Cap: number,
    year10Cap: number,
    months: number[] = [37, 60, 84, 120],
  ): { month: number; capRate: number }[] {
    return months.map((month) => ({
      month,
      capRate: this.calculateCapRate(
        purchaseCap,
        year5Cap,
        year7Cap,
        year10Cap,
        month,
      ),
    }));
  }
}

export class MortgagePaymentsCalculator1 {
  /**
   * Calculate original mortgage annual payments
   * @param baseMonthlyPayment - Monthly P&I from calculateMonthlyPayment()
   * @param interestOnlyMonths - From D16 (number_months_intr_only)
   * @param firstPaymentMonth - From D17 (first_month_principal_and_intr_payment)
   * @param analysisYears - Total analysis period (5,7,10 years)
   * @returns Array of annual payments for each year
   */
  static calculateOriginalLoanPayments(
    baseMonthlyPayment: number,
    interestOnlyMonths: number,
    firstPaymentMonth: number,
    analysisYears: number,
  ): number[] {
    const payments: number[] = [];
    const monthlyPmt = new Decimal(baseMonthlyPayment).abs(); // Ensure positive

    // Year 1 calculation
    if (interestOnlyMonths > 0) {
      const effectiveMonths = 12 - Math.min(firstPaymentMonth - 1, 11);
      payments.push(monthlyPmt.mul(effectiveMonths).toNumber());
    } else {
      payments.push(monthlyPmt.mul(12).toNumber());
    }

    // Subsequent years (2 through analysis period)
    for (let year = 2; year <= analysisYears; year++) {
      payments.push(monthlyPmt.mul(12).toNumber());
    }

    return payments;
  }

  /**
   * Calculate refinanced mortgage annual payments
   * @param refinancedMonthlyPayment - New monthly P&I after refinance
   * @param refinanceMonth - When refinance occurred (month number)
   * @param totalAnalysisMonths - Total analysis period in months (e.g., 60 for 5 years)
   * @returns Array of annual payments for each year after refinance
   */
  static calculateRefinancedPayments(
    refinancedMonthlyPayment: number,
    refinanceMonth: number,
    totalAnalysisMonths: number,
  ): number[] {
    const payments: number[] = [];
    const monthlyPmt = new Decimal(refinancedMonthlyPayment).abs(); // Ensure positive

    // Calculate the year when refinance occurs (1-based)
    const refinanceYear = Math.ceil(refinanceMonth / 12);

    // Calculate remaining months in the refinance year
    const monthsInRefinanceYear = 12 - (refinanceMonth % 12 || 12);

    // 1st year of refinance (partial year)
    payments.push(monthlyPmt.mul(monthsInRefinanceYear).toNumber());

    // Full years after refinance
    const remainingMonths = totalAnalysisMonths - refinanceMonth;
    const fullYears = Math.floor(remainingMonths / 12);

    for (let year = 1; year <= fullYears; year++) {
      payments.push(monthlyPmt.mul(12).toNumber());
    }

    return payments;
  }

  /**
   * Combined calculation for original + refinanced payments
   * @param originalParams Parameters for original mortgage
   * @param refinanceParams Parameters for refinanced mortgage (optional)
   * @param analysisYears Total analysis period in years
   * @returns Complete payment schedule and total payments
   */
  static calculateCompletePaymentSchedule(
    originalParams: {
      monthlyPayment: number;
      interestOnlyMonths: number;
      firstPaymentMonth: number;
    },
    refinanceParams?: {
      monthlyPayment: number;
      refinanceMonth: number; // Month when refinance occurs (e.g., 37)
    },
    analysisYears: number = 10,
  ): { annualPayments: number[]; totalPayments: number } {
    const totalMonths = analysisYears * 12;
    let annualPayments: number[] = [];

    // Calculate original payments
    const originalPayments = this.calculateOriginalLoanPayments(
      originalParams.monthlyPayment,
      originalParams.interestOnlyMonths,
      originalParams.firstPaymentMonth,
      analysisYears,
    );

    // If no refinance, return original payments
    if (!refinanceParams) {
      const total = originalPayments.reduce((sum, payment) => sum + payment, 0);
      return { annualPayments: originalPayments, totalPayments: total };
    }

    // Calculate payments before refinance
    const refinanceYear = Math.ceil(refinanceParams.refinanceMonth / 12);
    const paymentsBeforeRefinance = originalPayments.slice(
      0,
      refinanceYear - 1,
    );

    // Calculate refinanced payments
    const refinancedPayments = this.calculateRefinancedPayments(
      refinanceParams.monthlyPayment,
      refinanceParams.refinanceMonth,
      totalMonths,
    );

    // Combine payments
    annualPayments = [...paymentsBeforeRefinance, ...refinancedPayments];

    // Ensure we have exactly analysisYears entries
    if (annualPayments.length > analysisYears) {
      annualPayments = annualPayments.slice(0, analysisYears);
    } else if (annualPayments.length < analysisYears) {
      const lastPayment = annualPayments[annualPayments.length - 1] || 0;
      while (annualPayments.length < analysisYears) {
        annualPayments.push(lastPayment);
      }
    }

    const totalPayments = annualPayments.reduce(
      (sum, payment) => sum + payment,
      0,
    );

    return { annualPayments, totalPayments };
  }
}
