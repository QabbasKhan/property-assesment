import Decimal from 'decimal.js';
import { calculateSingleExitValuation } from './fr-valuation-filter.util';

export function evaluateInvestmentPerformance(input) {
  const scenarios = input;
  const parsed = [];

  // console.log('1');

  for (const key in scenarios) {
    const value = scenarios[key];
    const irr = value.irr !== null ? value.irr : null;
    const avgCash =
      typeof value.averageCashOnCash === 'number'
        ? value.averageCashOnCash
        : null;
    const annualReturn =
      typeof value.annualizedReturn === 'number'
        ? value.annualizedReturn
        : null;

    if (avgCash !== null && annualReturn !== null) {
      parsed.push({
        key,
        irr,
        averageCashOnCash: avgCash,
        annualizedReturn: annualReturn,
      });
    }
  }

  // console.log('2');

  // Filter only valid IRR values
  const validIrrs = parsed.filter(
    (item) => typeof item.irr === 'number' && isFinite(item.irr),
  );

  let bestIrr = null;
  let worstIrr = null;

  if (validIrrs.length > 0) {
    bestIrr = validIrrs.reduce((a, b) => (a.irr > b.irr ? a : b));
    worstIrr = validIrrs.reduce((a, b) => (a.irr < b.irr ? a : b));
  }

  // console.log('3');

  // console.log(parsed);

  const bestCash = parsed.reduce((a, b) =>
    a.averageCashOnCash > b.averageCashOnCash ? a : b,
  );
  // console.log('4');

  const worstCash = parsed.reduce((a, b) =>
    a.averageCashOnCash < b.averageCashOnCash ? a : b,
  );
  // console.log('5');

  const bestAnnual = parsed.reduce((a, b) =>
    a.annualizedReturn > b.annualizedReturn ? a : b,
  );
  // console.log('6');

  const worstAnnual = parsed.reduce((a, b) =>
    a.annualizedReturn < b.annualizedReturn ? a : b,
  );
  // console.log('7');

  return {
    bestIrr: bestIrr ? { key: bestIrr.key, value: bestIrr.irr } : null,
    worstIrr: worstIrr ? { key: worstIrr.key, value: worstIrr.irr } : null,
    bestCashOnCash: { key: bestCash.key, value: bestCash.averageCashOnCash },
    worstCashOnCash: { key: worstCash.key, value: worstCash.averageCashOnCash },
    bestAnnualizedReturn: {
      key: bestAnnual.key,
      value: bestAnnual.annualizedReturn,
    },
    worstAnnualizedReturn: {
      key: worstAnnual.key,
      value: worstAnnual.annualizedReturn,
    },
  };
}

export function evaluateSyndicatorsDealData(
  syndicatorOriginationFee,
  syndicatorSaleFee,
  investment, // Decimal.js instance
  noRefinanceYear5,
  noRefinanceYear7,
  noRefinanceYear10,
  mortgageData,
  exitValuation,
) {
  let syndicatorsDealValues = [];
  let propertyManagerValues = [];
  let increaseInSyndicationFeesValues = [];

  function processYearData(year, yearObject, monthIndex) {
    const annualCashFlows = yearObject?.annualCashFlows || [];

    const syndicatorAcquisation = investment
      .mul(syndicatorOriginationFee)
      .div(100);

    const mortgageEntry = mortgageData.find((m) => m.month === monthIndex);
    const syndicationExit = mortgageEntry
      ? new Decimal(mortgageEntry.value).mul(syndicatorSaleFee).div(100)
      : new Decimal(0);

    const totalAumFee = annualCashFlows.reduce(
      (sum, item) => sum + (item.aumFee || 0),
      0,
    );

    const totalPropertyManagerFee = annualCashFlows.reduce(
      (sum, item) => sum + (item.propertyManagementFee || 0),
      0,
    );

    const exitInfo = exitValuation.find((x) => x.year === year);
    const gainShare = exitInfo?.gpShare || 0;

    const totalValue = syndicatorAcquisation
      .plus(syndicationExit)
      .plus(totalAumFee)
      .plus(gainShare);

    const annualizedValue = totalValue.div(year);

    syndicatorsDealValues.push({
      year,
      syndicatorAcquisation: syndicatorAcquisation
        .toDecimalPlaces(2)
        .toNumber(),
      syndicationExit: syndicationExit.toDecimalPlaces(2).toNumber(),
      syndicatorAumFee: totalAumFee.toFixed(2),
      gainShare: gainShare.toFixed(2),
      totalValue: totalValue.toDecimalPlaces(2).toNumber(),
      annualizedTotalValue: annualizedValue.toDecimalPlaces(2).toNumber(),
    });

    propertyManagerValues.push({
      year,
      propertyManagerFee: totalPropertyManagerFee,
    });
  }

  if (noRefinanceYear5?.annualCashFlows?.length) {
    processYearData(5, noRefinanceYear5, 60);
  }
  if (noRefinanceYear7?.annualCashFlows?.length) {
    processYearData(7, noRefinanceYear7, 84);
  }
  if (noRefinanceYear10?.annualCashFlows?.length) {
    processYearData(10, noRefinanceYear10, 120);
  }

  // Refinance months mapping
  const refinanceScenarios = [
    { label: '5yr_37mo', month: 37 },
    { label: '7yr_37mo', month: 37 },
    { label: '7yr_49mo', month: 49 },
    { label: '10yr_37mo', month: 37 },
    { label: '10yr_49mo', month: 49 },
    { label: '10yr_61mo', month: 61 },
  ];

  refinanceScenarios.forEach(({ label, month }) => {
    const entry = mortgageData.find((m) => m.month === month);
    if (entry) {
      const increaseFee = new Decimal(entry.value)
        .mul(syndicatorSaleFee)
        .div(100);
      increaseInSyndicationFeesValues.push({
        label,
        month,
        increaseInSyndicationFee: increaseFee.toDecimalPlaces(2).toNumber(),
      });
    }
  });

  return {
    syndicatorsDealValues,
    propertyManagerValues,
    increaseInSyndicationFeesValues,
  };
}
