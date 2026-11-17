import math
from typing import List, Dict, Any, Optional
from schemas import (
    EmiRequest, EmiResponse,
    SipRequest, SipResponse,
    SavingsGoalRequest, SavingsGoalResponse,
    BudgetSplitterRequest, BudgetSplitterResponse, BudgetCategoryBreakdown,
    DebtPayoffRequest, DebtPayoffResponse, DebtPayoffMethodResult, DebtItem,
    EmergencyFundRequest, EmergencyFundResponse
)


def _validate_number(val: Any, name: str, allow_zero: bool = False, max_val: float = 1e12) -> float:
    try:
        f = float(val)
    except (TypeError, ValueError):
        raise ValueError(f"{name} must be a valid number.")
    if math.isnan(f) or math.isinf(f):
        raise ValueError(f"{name} cannot be NaN or infinite.")
    if not allow_zero and f <= 0:
        raise ValueError(f"{name} must be greater than zero.")
    if allow_zero and f < 0:
        raise ValueError(f"{name} cannot be negative.")
    if abs(f) > max_val:
        raise ValueError(f"{name} exceeds maximum allowable limit of {max_val:,.0f}.")
    return f


def calculate_emi(req: EmiRequest) -> EmiResponse:
    P = _validate_number(req.principal, "Principal", allow_zero=False, max_val=1e11)
    annual_rate = _validate_number(req.annual_rate, "Annual rate", allow_zero=True, max_val=100.0)
    N = int(_validate_number(req.tenure_months, "Tenure months", allow_zero=False, max_val=600))

    if annual_rate == 0:
        emi = P / N
        total_payment = P
        total_interest = 0.0
    else:
        r = (annual_rate / 12.0) / 100.0
        # Formula: P * r * (1+r)^N / ((1+r)^N - 1)
        compound_factor = math.pow(1 + r, N)
        emi = P * r * compound_factor / (compound_factor - 1)
        total_payment = emi * N
        total_interest = total_payment - P

    # Generate amortization schedule
    balance = P
    amortization_summary: List[Dict[str, Any]] = []
    yearly_tracker: Dict[int, Dict[str, float]] = {}

    r_monthly = (annual_rate / 12.0) / 100.0 if annual_rate > 0 else 0.0

    for m in range(1, N + 1):
        interest_for_month = balance * r_monthly
        principal_for_month = emi - interest_for_month
        if principal_for_month > balance or m == N:
            principal_for_month = balance
            interest_for_month = max(0.0, emi - principal_for_month) if annual_rate > 0 else 0.0
            balance = 0.0
        else:
            balance -= principal_for_month

        year = (m - 1) // 12 + 1
        if year not in yearly_tracker:
            yearly_tracker[year] = {"year": year, "principal_paid": 0.0, "interest_paid": 0.0, "ending_balance": 0.0}

        yearly_tracker[year]["principal_paid"] += principal_for_month
        yearly_tracker[year]["interest_paid"] += interest_for_month
        yearly_tracker[year]["ending_balance"] = round(balance, 2)

        if m % 6 == 0 or m == N or m == 1:
            amortization_summary.append({
                "month": m,
                "emi": round(emi, 2),
                "principal": round(principal_for_month, 2),
                "interest": round(interest_for_month, 2),
                "remaining_balance": round(max(0.0, balance), 2)
            })

    chart_data = [
        {
            "year": f"Yr {v['year']}",
            "principal_paid": round(v["principal_paid"], 2),
            "interest_paid": round(v["interest_paid"], 2),
            "remaining_balance": round(v["ending_balance"], 2),
        }
        for v in yearly_tracker.values()
    ]

    return EmiResponse(
        monthly_emi=round(emi, 2),
        total_interest=round(total_interest, 2),
        total_payment=round(total_payment, 2),
        principal=round(P, 2),
        tenure_months=N,
        annual_rate=round(annual_rate, 2),
        amortization_summary=amortization_summary,
        chart_data=chart_data
    )


def calculate_sip(req: SipRequest) -> SipResponse:
    P = _validate_number(req.monthly_investment, "Monthly investment", allow_zero=False, max_val=1e10)
    r_annual = _validate_number(req.annual_return_rate, "Annual return rate", allow_zero=True, max_val=100.0)
    years = int(_validate_number(req.tenure_years, "Tenure years", allow_zero=False, max_val=100))
    lump_sum = _validate_number(req.initial_lump_sum, "Initial lump sum", allow_zero=True, max_val=1e11)

    total_months = years * 12
    i = (r_annual / 12.0) / 100.0

    yearly_breakdown: List[Dict[str, Any]] = []
    current_value = lump_sum
    total_invested = lump_sum

    for y in range(1, years + 1):
        for _ in range(12):
            if i > 0:
                current_value = (current_value + P) * (1 + i)
            else:
                current_value = current_value + P
            total_invested += P

        gains = max(0.0, current_value - total_invested)
        yearly_breakdown.append({
            "year": f"Year {y}",
            "invested": round(total_invested, 2),
            "returns": round(gains, 2),
            "total_value": round(current_value, 2)
        })

    estimated_returns = max(0.0, current_value - total_invested)

    return SipResponse(
        invested_amount=round(total_invested, 2),
        estimated_returns=round(estimated_returns, 2),
        total_value=round(current_value, 2),
        monthly_investment=round(P, 2),
        annual_return_rate=round(r_annual, 2),
        tenure_years=years,
        yearly_breakdown=yearly_breakdown,
        chart_data=yearly_breakdown
    )


def calculate_savings_goal(req: SavingsGoalRequest) -> SavingsGoalResponse:
    target = _validate_number(req.target_amount, "Target amount", allow_zero=False, max_val=1e11)
    months = int(_validate_number(req.timeline_months, "Timeline months", allow_zero=False, max_val=600))
    current = _validate_number(req.current_savings, "Current savings", allow_zero=True, max_val=1e11)
    rate = _validate_number(req.annual_interest_rate, "Annual interest rate", allow_zero=True, max_val=100.0)

    i = (rate / 12.0) / 100.0

    if i == 0:
        needed_from_savings = max(0.0, target - current)
        monthly_saving = needed_from_savings / months
        future_current = current
    else:
        # Future value of current savings: current * (1+i)^months
        future_current = current * math.pow(1 + i, months)
        rem_target = max(0.0, target - future_current)
        # FV of annuity formula: PMT * [((1+i)^n - 1) / i]
        factor = (math.pow(1 + i, months) - 1) / i
        monthly_saving = rem_target / factor if factor > 0 else rem_target / months

    monthly_saving = max(0.0, monthly_saving)
    total_contributions = current + (monthly_saving * months)
    interest_earned = max(0.0, target - total_contributions)

    # Monthly progress simulation for charts (step every few months)
    step = max(1, months // 12)
    chart_data = []
    sim_balance = current
    for m in range(1, months + 1):
        if i > 0:
            sim_balance = (sim_balance + monthly_saving) * (1 + i)
        else:
            sim_balance += monthly_saving

        if m % step == 0 or m == months:
            chart_data.append({
                "month": f"M{m}",
                "balance": round(sim_balance, 2),
                "target": round(target, 2),
                "contributed": round(current + (monthly_saving * m), 2)
            })

    return SavingsGoalResponse(
        target_amount=round(target, 2),
        timeline_months=months,
        current_savings=round(current, 2),
        annual_interest_rate=round(rate, 2),
        required_monthly_saving=round(monthly_saving, 2),
        total_contributions=round(total_contributions, 2),
        total_interest_earned=round(interest_earned, 2),
        chart_data=chart_data
    )


def calculate_budget_50_30_20(req: BudgetSplitterRequest) -> BudgetSplitterResponse:
    income = _validate_number(req.monthly_income, "Monthly income", allow_zero=False, max_val=1e11)
    n_pct = _validate_number(req.needs_pct, "Needs percentage", allow_zero=True, max_val=100.0)
    w_pct = _validate_number(req.wants_pct, "Wants percentage", allow_zero=True, max_val=100.0)
    s_pct = _validate_number(req.savings_pct, "Savings percentage", allow_zero=True, max_val=100.0)

    total_pct = n_pct + w_pct + s_pct
    if total_pct == 0:
        n_pct, w_pct, s_pct = 50.0, 30.0, 20.0
    else:
        # Normalize to 100%
        n_pct = (n_pct / total_pct) * 100.0
        w_pct = (w_pct / total_pct) * 100.0
        s_pct = (s_pct / total_pct) * 100.0

    needs_amt = round(income * (n_pct / 100.0), 2)
    wants_amt = round(income * (w_pct / 100.0), 2)
    savings_amt = round(income * (s_pct / 100.0), 2)

    needs = BudgetCategoryBreakdown(
        category="Needs",
        percentage=round(n_pct, 1),
        amount=needs_amt,
        suggestions=["Rent / Mortgage", "Groceries & essential food", "Utilities (water, electricity, internet)", "Insurance & transport", "Minimum loan obligations"]
    )

    wants = BudgetCategoryBreakdown(
        category="Wants",
        percentage=round(w_pct, 1),
        amount=wants_amt,
        suggestions=["Dining out & cafes", "Entertainment & streaming", "Hobbies & shopping", "Vacations & travel", "Personal upgrades"]
    )

    savings = BudgetCategoryBreakdown(
        category="Savings & Debt Payoff",
        percentage=round(s_pct, 1),
        amount=savings_amt,
        suggestions=["Emergency fund (3-6 months)", "Retirement accounts / Index funds / SIP", "Extra debt paydown", "Short-term savings targets"]
    )

    chart_data = [
        {"name": "Needs (50%)", "value": needs_amt, "color": "#1E4D3B"},
        {"name": "Wants (30%)", "value": wants_amt, "color": "#D97736"},
        {"name": "Savings/Debt (20%)", "value": savings_amt, "color": "#5B8A74"}
    ]

    return BudgetSplitterResponse(
        monthly_income=round(income, 2),
        needs=needs,
        wants=wants,
        savings=savings,
        chart_data=chart_data
    )


def _simulate_debt_payoff(debts: List[DebtItem], extra: float, strategy: str) -> DebtPayoffMethodResult:
    # strategy is "avalanche" or "snowball"
    # Deep copy debt state
    current_debts = [
        {
            "name": d.name,
            "balance": float(d.balance),
            "rate": float(d.interest_rate),
            "min": float(d.min_payment),
        }
        for d in debts
    ]

    total_months = 0
    total_interest = 0.0
    total_paid = 0.0
    timeline: List[Dict[str, Any]] = []
    payoff_order: List[str] = []

    # Maximum cutoff to prevent infinite loops if min payments are lower than monthly interest
    MAX_MONTHS = 360

    while any(d["balance"] > 0.01 for d in current_debts) and total_months < MAX_MONTHS:
        total_months += 1
        available_extra = extra

        # 1. Accrue monthly interest
        for d in current_debts:
            if d["balance"] > 0.01:
                monthly_rate = (d["rate"] / 12.0) / 100.0
                interest = d["balance"] * monthly_rate
                total_interest += interest
                d["balance"] += interest

        # 2. Make minimum payments
        for d in current_debts:
            if d["balance"] > 0.01:
                payment = min(d["balance"], d["min"])
                d["balance"] -= payment
                total_paid += payment
                if d["balance"] <= 0.01:
                    d["balance"] = 0.0
                    if d["name"] not in payoff_order:
                        payoff_order.append(d["name"])
            else:
                # Add eliminated debt's min payment to available rollover snow-ball/avalanche
                available_extra += d["min"]

        # 3. Apply rollover extra budget to prioritized active debt
        active_debts = [d for d in current_debts if d["balance"] > 0.01]
        if active_debts:
            if strategy == "avalanche":
                # Highest interest rate first
                active_debts.sort(key=lambda x: x["rate"], reverse=True)
            else:
                # Lowest balance first (Snowball)
                active_debts.sort(key=lambda x: x["balance"])

            target = active_debts[0]
            extra_payment = min(target["balance"], available_extra)
            target["balance"] -= extra_payment
            total_paid += extra_payment
            if target["balance"] <= 0.01:
                target["balance"] = 0.0
                if target["name"] not in payoff_order:
                    payoff_order.append(target["name"])

        # Record timeline checkpoint
        if total_months % 6 == 0 or not any(d["balance"] > 0.01 for d in current_debts):
            remaining = sum(d["balance"] for d in current_debts)
            timeline.append({
                "month": total_months,
                "remaining_balance": round(remaining, 2),
                "total_paid_so_far": round(total_paid, 2)
            })

    return DebtPayoffMethodResult(
        method=strategy.capitalize(),
        total_months=total_months,
        total_interest_paid=round(total_interest, 2),
        total_paid=round(total_paid, 2),
        payoff_order=payoff_order,
        timeline=timeline
    )


def calculate_debt_payoff(req: DebtPayoffRequest) -> DebtPayoffResponse:
    if not req.debts:
        raise ValueError("Must provide at least one debt item.")

    avalanche = _simulate_debt_payoff(req.debts, req.extra_monthly_payment, "avalanche")
    snowball = _simulate_debt_payoff(req.debts, req.extra_monthly_payment, "snowball")

    interest_diff = round(snowball.total_interest_paid - avalanche.total_interest_paid, 2)
    months_diff = snowball.total_months - avalanche.total_months

    if interest_diff > 0:
        recommendation = (
            f"The **Avalanche method** saves you {abs(interest_diff):,.2f} in interest "
            f"and finishes {abs(months_diff)} month(s) faster. Choose Avalanche for maximum financial efficiency, "
            f"or Snowball if you need quick psychological wins by clearing small balances first!"
        )
    elif interest_diff < 0:
        recommendation = "Both methods yield virtually identical results for your current debt distribution."
    else:
        recommendation = "Both methods result in the exact same interest and duration."

    comparison_chart = [
        {"metric": "Total Interest", "Avalanche": avalanche.total_interest_paid, "Snowball": snowball.total_interest_paid},
        {"metric": "Total Months", "Avalanche": float(avalanche.total_months), "Snowball": float(snowball.total_months)},
        {"metric": "Total Out-of-Pocket", "Avalanche": avalanche.total_paid, "Snowball": snowball.total_paid}
    ]

    return DebtPayoffResponse(
        avalanche=avalanche,
        snowball=snowball,
        interest_difference=interest_diff,
        months_difference=months_diff,
        recommendation=recommendation,
        comparison_chart=comparison_chart
    )


def calculate_emergency_fund(req: EmergencyFundRequest) -> EmergencyFundResponse:
    expenses = _validate_number(req.monthly_essential_expenses, "Monthly essential expenses", allow_zero=False, max_val=1e10)
    target_months = int(_validate_number(req.months_target, "Target months", allow_zero=False, max_val=120))
    current = _validate_number(req.current_savings, "Current savings", allow_zero=True, max_val=1e11)
    capacity = _validate_number(req.monthly_savings_capacity, "Monthly savings capacity", allow_zero=True, max_val=1e10)

    target_fund = round(expenses * target_months, 2)
    gap = round(max(0.0, target_fund - current), 2)
    percent_funded = round(min(100.0, (current / target_fund) * 100.0 if target_fund > 0 else 100.0), 1)

    months_to_complete = None
    if gap > 0 and capacity > 0:
        months_to_complete = round(gap / capacity, 1)

    if percent_funded >= 100.0:
        status = "Fully Funded 🛡️"
        advice = [
            "Outstanding work! Your safety net is completely in place.",
            "Keep this fund in a high-yield savings account (HYSA) or liquid money market fund.",
            "You are now ready to divert surplus savings toward long-term investing or aggressive debt payoff."
        ]
    elif percent_funded >= 50.0:
        status = "Solid Progress 🌱"
        advice = [
            f"You have over half your emergency fund secured ({percent_funded}%).",
            f"Closing the remaining gap of {gap:,.2f} will give you bulletproof peace of mind.",
            f"At {capacity:,.2f}/month, you will reach your target in approximately {months_to_complete} months." if months_to_complete else "Consider setting aside a regular monthly portion to finish funding your safety buffer."
        ]
    else:
        status = "Building Stage ⚠️"
        advice = [
            f"You currently have {round(current / expenses, 1) if expenses else 0} months of expenses covered.",
            "Prioritize accumulating at least 1 full month of essential expenses before making aggressive non-essential investments.",
            "Automate transfers to a dedicated high-yield savings account on payday."
        ]

    chart_data = [
        {"name": "Current Savings", "value": current, "fill": "#1E4D3B"},
        {"name": "Remaining Gap", "value": gap, "fill": "#E2DCD3"}
    ]

    return EmergencyFundResponse(
        monthly_essential_expenses=expenses,
        months_target=target_months,
        target_fund=target_fund,
        current_savings=current,
        funding_gap=gap,
        percent_funded=percent_funded,
        months_to_complete=months_to_complete,
        status=status,
        advice=advice,
        chart_data=chart_data
    )
