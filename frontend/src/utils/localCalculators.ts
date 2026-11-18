// Client-side high-precision financial calculator fallback engine
// Matches backend/services/calculators.py exactly

export interface EmiResult {
  monthly_emi: number;
  total_interest: number;
  total_payment: number;
  principal: number;
  tenure_months: number;
  annual_rate: number;
  amortization_summary: Array<{
    month: number;
    emi: number;
    principal: number;
    interest: number;
    remaining_balance: number;
  }>;
  chart_data: Array<{
    year: string;
    principal_paid: number;
    interest_paid: number;
    remaining_balance: number;
  }>;
}

export function calculateEmiLocal(
  principal: number,
  annualRate: number,
  tenureMonths: number
): EmiResult {
  const P = Math.max(0, principal);
  const annual_rate = Math.max(0, annualRate);
  const N = Math.max(1, Math.round(tenureMonths));

  let emi = 0;
  let total_payment = 0;
  let total_interest = 0;

  if (annual_rate === 0) {
    emi = P / N;
    total_payment = P;
    total_interest = 0;
  } else {
    const r = annual_rate / 12.0 / 100.0;
    const compound = Math.pow(1 + r, N);
    emi = (P * r * compound) / (compound - 1);
    total_payment = emi * N;
    total_interest = total_payment - P;
  }

  let balance = P;
  const amortization_summary: EmiResult['amortization_summary'] = [];
  const yearlyTracker: Record<number, { year: number; principal_paid: number; interest_paid: number; ending_balance: number }> = {};
  const r_monthly = annual_rate > 0 ? annual_rate / 12.0 / 100.0 : 0;

  for (let m = 1; m <= N; m++) {
    let interest_for_month = balance * r_monthly;
    let principal_for_month = emi - interest_for_month;

    if (principal_for_month > balance || m === N) {
      principal_for_month = balance;
      interest_for_month = annual_rate > 0 ? Math.max(0, emi - principal_for_month) : 0;
      balance = 0;
    } else {
      balance -= principal_for_month;
    }

    const year = Math.floor((m - 1) / 12) + 1;
    if (!yearlyTracker[year]) {
      yearlyTracker[year] = { year, principal_paid: 0, interest_paid: 0, ending_balance: 0 };
    }
    yearlyTracker[year].principal_paid += principal_for_month;
    yearlyTracker[year].interest_paid += interest_for_month;
    yearlyTracker[year].ending_balance = Math.round(balance * 100) / 100;

    if (m % 6 === 0 || m === N || m === 1) {
      amortization_summary.push({
        month: m,
        emi: Math.round(emi * 100) / 100,
        principal: Math.round(principal_for_month * 100) / 100,
        interest: Math.round(interest_for_month * 100) / 100,
        remaining_balance: Math.round(Math.max(0, balance) * 100) / 100,
      });
    }
  }

  const chart_data = Object.values(yearlyTracker).map((v) => ({
    year: `Yr ${v.year}`,
    principal_paid: Math.round(v.principal_paid * 100) / 100,
    interest_paid: Math.round(v.interest_paid * 100) / 100,
    remaining_balance: Math.round(v.ending_balance * 100) / 100,
  }));

  return {
    monthly_emi: Math.round(emi * 100) / 100,
    total_interest: Math.round(total_interest * 100) / 100,
    total_payment: Math.round(total_payment * 100) / 100,
    principal: Math.round(P * 100) / 100,
    tenure_months: N,
    annual_rate: Math.round(annual_rate * 100) / 100,
    amortization_summary,
    chart_data,
  };
}

export interface SipResult {
  invested_amount: number;
  estimated_returns: number;
  total_value: number;
  monthly_investment: number;
  annual_return_rate: number;
  tenure_years: number;
  yearly_breakdown: Array<{
    year: string;
    invested: number;
    returns: number;
    total_value: number;
  }>;
  chart_data: Array<{
    year: string;
    invested: number;
    returns: number;
    total_value: number;
  }>;
}

export function calculateSipLocal(
  monthlyInvestment: number,
  annualReturnRate: number,
  tenureYears: number,
  initialLumpSum: number = 0
): SipResult {
  const P = Math.max(0, monthlyInvestment);
  const r_annual = Math.max(0, annualReturnRate);
  const years = Math.max(1, Math.round(tenureYears));
  const lump_sum = Math.max(0, initialLumpSum);

  const i = r_annual / 12.0 / 100.0;
  const yearly_breakdown: SipResult['yearly_breakdown'] = [];
  let current_value = lump_sum;
  let total_invested = lump_sum;

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      if (i > 0) {
        current_value = (current_value + P) * (1 + i);
      } else {
        current_value = current_value + P;
      }
      total_invested += P;
    }

    const gains = Math.max(0, current_value - total_invested);
    yearly_breakdown.push({
      year: `Year ${y}`,
      invested: Math.round(total_invested * 100) / 100,
      returns: Math.round(gains * 100) / 100,
      total_value: Math.round(current_value * 100) / 100,
    });
  }

  const estimated_returns = Math.max(0, current_value - total_invested);

  return {
    invested_amount: Math.round(total_invested * 100) / 100,
    estimated_returns: Math.round(estimated_returns * 100) / 100,
    total_value: Math.round(current_value * 100) / 100,
    monthly_investment: Math.round(P * 100) / 100,
    annual_return_rate: Math.round(r_annual * 100) / 100,
    tenure_years: years,
    yearly_breakdown,
    chart_data: yearly_breakdown,
  };
}

export interface BudgetSplitterResult {
  monthly_income: number;
  needs: {
    category: string;
    percentage: number;
    amount: number;
    suggestions: string[];
  };
  wants: {
    category: string;
    percentage: number;
    amount: number;
    suggestions: string[];
  };
  savings: {
    category: string;
    percentage: number;
    amount: number;
    suggestions: string[];
  };
  chart_data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export function calculateBudgetLocal(
  monthlyIncome: number,
  needsPct: number = 50,
  wantsPct: number = 30,
  savingsPct: number = 20
): BudgetSplitterResult {
  const income = Math.max(0, monthlyIncome);
  let n = Math.max(0, needsPct);
  let w = Math.max(0, wantsPct);
  let s = Math.max(0, savingsPct);

  const total = n + w + s;
  if (total === 0) {
    n = 50;
    w = 30;
    s = 20;
  } else {
    n = (n / total) * 100;
    w = (w / total) * 100;
    s = (s / total) * 100;
  }

  const needs_amt = Math.round(income * (n / 100) * 100) / 100;
  const wants_amt = Math.round(income * (w / 100) * 100) / 100;
  const savings_amt = Math.round(income * (s / 100) * 100) / 100;

  return {
    monthly_income: income,
    needs: {
      category: 'Needs',
      percentage: Math.round(n * 10) / 10,
      amount: needs_amt,
      suggestions: [
        'Rent / Mortgage',
        'Groceries & essential food',
        'Utilities (water, electricity, internet)',
        'Insurance & transport',
        'Minimum loan obligations',
      ],
    },
    wants: {
      category: 'Wants',
      percentage: Math.round(w * 10) / 10,
      amount: wants_amt,
      suggestions: [
        'Dining out & cafes',
        'Entertainment & streaming',
        'Hobbies & shopping',
        'Vacations & travel',
        'Personal upgrades',
      ],
    },
    savings: {
      category: 'Savings & Debt Payoff',
      percentage: Math.round(s * 10) / 10,
      amount: savings_amt,
      suggestions: [
        'Emergency fund (3-6 months)',
        'Retirement accounts / Index funds / SIP',
        'Extra debt paydown',
        'Short-term savings targets',
      ],
    },
    chart_data: [
      { name: `Needs (${Math.round(n)}%)`, value: needs_amt, color: '#1E4D3B' },
      { name: `Wants (${Math.round(w)}%)`, value: wants_amt, color: '#D97736' },
      { name: `Savings/Debt (${Math.round(s)}%)`, value: savings_amt, color: '#5B8A74' },
    ],
  };
}

export interface SavingsGoalResult {
  target_amount: number;
  timeline_months: number;
  current_savings: number;
  annual_interest_rate: number;
  required_monthly_saving: number;
  total_contributions: number;
  total_interest_earned: number;
  chart_data: Array<{
    month: string;
    balance: number;
    target: number;
    contributed: number;
  }>;
}

export function calculateSavingsGoalLocal(
  targetAmount: number,
  timelineMonths: number,
  currentSavings: number = 0,
  annualInterestRate: number = 0
): SavingsGoalResult {
  const target = Math.max(0, targetAmount);
  const months = Math.max(1, Math.round(timelineMonths));
  const current = Math.max(0, currentSavings);
  const rate = Math.max(0, annualInterestRate);

  const i = rate / 12.0 / 100.0;
  let monthly_saving = 0;

  if (i === 0) {
    const needed = Math.max(0, target - current);
    monthly_saving = needed / months;
  } else {
    const future_current = current * Math.pow(1 + i, months);
    const rem_target = Math.max(0, target - future_current);
    const factor = (Math.pow(1 + i, months) - 1) / i;
    monthly_saving = factor > 0 ? rem_target / factor : rem_target / months;
  }

  monthly_saving = Math.max(0, monthly_saving);
  const total_contributions = current + monthly_saving * months;
  const interest_earned = Math.max(0, target - total_contributions);

  const step = Math.max(1, Math.floor(months / 12));
  const chart_data: SavingsGoalResult['chart_data'] = [];
  let sim_balance = current;

  for (let m = 1; m <= months; m++) {
    if (i > 0) {
      sim_balance = (sim_balance + monthly_saving) * (1 + i);
    } else {
      sim_balance += monthly_saving;
    }

    if (m % step === 0 || m === months) {
      chart_data.push({
        month: `M${m}`,
        balance: Math.round(sim_balance * 100) / 100,
        target: Math.round(target * 100) / 100,
        contributed: Math.round((current + monthly_saving * m) * 100) / 100,
      });
    }
  }

  return {
    target_amount: Math.round(target * 100) / 100,
    timeline_months: months,
    current_savings: Math.round(current * 100) / 100,
    annual_interest_rate: Math.round(rate * 100) / 100,
    required_monthly_saving: Math.round(monthly_saving * 100) / 100,
    total_contributions: Math.round(total_contributions * 100) / 100,
    total_interest_earned: Math.round(interest_earned * 100) / 100,
    chart_data,
  };
}

export interface DebtItemInput {
  name: string;
  balance: number;
  interest_rate: number;
  min_payment: number;
}

export interface DebtMethodResult {
  method: string;
  total_months: number;
  total_interest_paid: number;
  total_paid: number;
  payoff_order: string[];
  timeline: Array<{
    month: number;
    remaining_balance: number;
    total_paid_so_far: number;
  }>;
}

export interface DebtPayoffResult {
  avalanche: DebtMethodResult;
  snowball: DebtMethodResult;
  interest_difference: number;
  months_difference: number;
  recommendation: string;
  comparison_chart: Array<{
    metric: string;
    Avalanche: number;
    Snowball: number;
  }>;
}

function simulateDebtLocal(debts: DebtItemInput[], extra: number, strategy: 'avalanche' | 'snowball'): DebtMethodResult {
  const currentDebts = debts.map((d) => ({
    name: d.name,
    balance: Number(d.balance),
    rate: Number(d.interest_rate),
    min: Number(d.min_payment),
  }));

  let total_months = 0;
  let total_interest = 0;
  let total_paid = 0;
  const timeline: DebtMethodResult['timeline'] = [];
  const payoff_order: string[] = [];
  const MAX_MONTHS = 360;

  while (currentDebts.some((d) => d.balance > 0.01) && total_months < MAX_MONTHS) {
    total_months++;
    let available_extra = extra;

    for (const d of currentDebts) {
      if (d.balance > 0.01) {
        const monthly_rate = d.rate / 12.0 / 100.0;
        const interest = d.balance * monthly_rate;
        total_interest += interest;
        d.balance += interest;
      }
    }

    for (const d of currentDebts) {
      if (d.balance > 0.01) {
        const payment = Math.min(d.balance, d.min);
        d.balance -= payment;
        total_paid += payment;
        if (d.balance <= 0.01) {
          d.balance = 0;
          if (!payoff_order.includes(d.name)) payoff_order.push(d.name);
        }
      } else {
        available_extra += d.min;
      }
    }

    const active = currentDebts.filter((d) => d.balance > 0.01);
    if (active.length > 0) {
      if (strategy === 'avalanche') {
        active.sort((a, b) => b.rate - a.rate);
      } else {
        active.sort((a, b) => a.balance - b.balance);
      }
      const target = active[0];
      const extra_payment = Math.min(target.balance, available_extra);
      target.balance -= extra_payment;
      total_paid += extra_payment;
      if (target.balance <= 0.01) {
        target.balance = 0;
        if (!payoff_order.includes(target.name)) payoff_order.push(target.name);
      }
    }

    if (total_months % 6 === 0 || !currentDebts.some((d) => d.balance > 0.01)) {
      const remaining = currentDebts.reduce((sum, d) => sum + d.balance, 0);
      timeline.push({
        month: total_months,
        remaining_balance: Math.round(remaining * 100) / 100,
        total_paid_so_far: Math.round(total_paid * 100) / 100,
      });
    }
  }

  return {
    method: strategy.charAt(0).toUpperCase() + strategy.slice(1),
    total_months,
    total_interest_paid: Math.round(total_interest * 100) / 100,
    total_paid: Math.round(total_paid * 100) / 100,
    payoff_order,
    timeline,
  };
}

export function calculateDebtPayoffLocal(debts: DebtItemInput[], extraPayment: number = 0): DebtPayoffResult {
  const avalanche = simulateDebtLocal(debts, extraPayment, 'avalanche');
  const snowball = simulateDebtLocal(debts, extraPayment, 'snowball');

  const interest_difference = Math.round((snowball.total_interest_paid - avalanche.total_interest_paid) * 100) / 100;
  const months_difference = snowball.total_months - avalanche.total_months;

  let recommendation = '';
  if (interest_difference > 0) {
    recommendation = `The **Avalanche method** saves you ${Math.abs(interest_difference).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in interest and finishes ${Math.abs(months_difference)} month(s) faster. Choose Avalanche for maximum financial efficiency, or Snowball if you need quick psychological wins by clearing small balances first!`;
  } else if (interest_difference < 0) {
    recommendation = 'Both methods yield virtually identical results for your current debt distribution.';
  } else {
    recommendation = 'Both methods result in the exact same interest and duration.';
  }

  return {
    avalanche,
    snowball,
    interest_difference,
    months_difference,
    recommendation,
    comparison_chart: [
      { metric: 'Total Interest', Avalanche: avalanche.total_interest_paid, Snowball: snowball.total_interest_paid },
      { metric: 'Total Months', Avalanche: avalanche.total_months, Snowball: snowball.total_months },
      { metric: 'Total Out-of-Pocket', Avalanche: avalanche.total_paid, Snowball: snowball.total_paid },
    ],
  };
}

export interface EmergencyFundResult {
  monthly_essential_expenses: number;
  months_target: number;
  target_fund: number;
  current_savings: number;
  funding_gap: number;
  percent_funded: number;
  months_to_complete: number | null;
  status: string;
  advice: string[];
  chart_data: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
}

export function calculateEmergencyFundLocal(
  monthlyExpenses: number,
  monthsTarget: number = 6,
  currentSavings: number = 0,
  monthlyCapacity: number = 0
): EmergencyFundResult {
  const expenses = Math.max(0, monthlyExpenses);
  const target_months = Math.max(1, Math.round(monthsTarget));
  const current = Math.max(0, currentSavings);
  const capacity = Math.max(0, monthlyCapacity);

  const target_fund = Math.round(expenses * target_months * 100) / 100;
  const gap = Math.round(Math.max(0, target_fund - current) * 100) / 100;
  const percent_funded = target_fund > 0 ? Math.round(Math.min(100, (current / target_fund) * 100) * 10) / 10 : 100;

  const months_to_complete = gap > 0 && capacity > 0 ? Math.round((gap / capacity) * 10) / 10 : null;

  let status = '';
  let advice: string[] = [];

  if (percent_funded >= 100) {
    status = 'Fully Funded 🛡️';
    advice = [
      'Outstanding work! Your safety net is completely in place.',
      'Keep this fund in a high-yield savings account (HYSA) or liquid money market fund.',
      'You are now ready to divert surplus savings toward long-term investing or aggressive debt payoff.',
    ];
  } else if (percent_funded >= 50) {
    status = 'Solid Progress 🌱';
    advice = [
      `You have over half your emergency fund secured (${percent_funded}%).`,
      `Closing the remaining gap of ${gap.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} will give you bulletproof peace of mind.`,
      months_to_complete
        ? `At ${capacity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month, you will reach your target in approximately ${months_to_complete} months.`
        : 'Consider setting aside a regular monthly portion to finish funding your safety buffer.',
    ];
  } else {
    status = 'Building Stage ⚠️';
    advice = [
      `You currently have ${expenses > 0 ? Math.round((current / expenses) * 10) / 10 : 0} months of expenses covered.`,
      'Prioritize accumulating at least 1 full month of essential expenses before making aggressive non-essential investments.',
      'Automate transfers to a dedicated high-yield savings account on payday.',
    ];
  }

  return {
    monthly_essential_expenses: expenses,
    months_target: target_months,
    target_fund,
    current_savings: current,
    funding_gap: gap,
    percent_funded,
    months_to_complete,
    status,
    advice,
    chart_data: [
      { name: 'Current Savings', value: current, fill: '#1E4D3B' },
      { name: 'Remaining Gap', value: gap, fill: '#E2DCD3' },
    ],
  };
}
