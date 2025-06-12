export function evaluateInvestmentPerformance(input) {
  const scenarios = input;
  const parsed = [];

  console.log('1');

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

  console.log('2');

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

  console.log('3');

  console.log(parsed);

  const bestCash = parsed.reduce((a, b) =>
    a.averageCashOnCash > b.averageCashOnCash ? a : b,
  );
  console.log('4');

  const worstCash = parsed.reduce((a, b) =>
    a.averageCashOnCash < b.averageCashOnCash ? a : b,
  );
  console.log('5');

  const bestAnnual = parsed.reduce((a, b) =>
    a.annualizedReturn > b.annualizedReturn ? a : b,
  );
  console.log('6');

  const worstAnnual = parsed.reduce((a, b) =>
    a.annualizedReturn < b.annualizedReturn ? a : b,
  );
  console.log('7');

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
