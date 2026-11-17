import pytest
from schemas import (
    EmiRequest, SipRequest, SavingsGoalRequest,
    BudgetSplitterRequest, DebtPayoffRequest, DebtItem,
    EmergencyFundRequest
)
from services.calculators import (
    calculate_emi, calculate_sip, calculate_savings_goal,
    calculate_budget_50_30_20, calculate_debt_payoff, calculate_emergency_fund
)


def test_emi_standard_calculation():
    req = EmiRequest(principal=100000, annual_rate=8.5, tenure_months=120)
    res = calculate_emi(req)
    assert res.monthly_emi > 0
    assert res.total_interest > 0
    assert res.total_payment == pytest.approx(res.principal + res.total_interest, 0.05)
    assert len(res.amortization_summary) > 0
    assert len(res.chart_data) == 10  # 10 years


def test_emi_zero_interest_rate_edge_case():
    # 0% interest loan (e.g. 0% promotional financing)
    req = EmiRequest(principal=12000, annual_rate=0.0, tenure_months=12)
    res = calculate_emi(req)
    assert res.monthly_emi == 1000.0
    assert res.total_interest == 0.0
    assert res.total_payment == 12000.0


def test_emi_invalid_inputs():
    with pytest.raises(ValueError):
        calculate_emi(EmiRequest(principal=-5000, annual_rate=5.0, tenure_months=12))


def test_sip_standard_growth():
    req = SipRequest(monthly_investment=500, annual_return_rate=12.0, tenure_years=10, initial_lump_sum=1000)
    res = calculate_sip(req)
    assert res.invested_amount == 1000 + (500 * 120)  # 61,000
    assert res.estimated_returns > 0
    assert res.total_value > res.invested_amount
    assert len(res.yearly_breakdown) == 10


def test_sip_zero_returns():
    # Cash in mattress: 0% return
    req = SipRequest(monthly_investment=200, annual_return_rate=0.0, tenure_years=5, initial_lump_sum=0)
    res = calculate_sip(req)
    assert res.invested_amount == 12000.0
    assert res.estimated_returns == 0.0
    assert res.total_value == 12000.0


def test_savings_goal_with_zero_rate():
    req = SavingsGoalRequest(target_amount=12000, timeline_months=12, current_savings=0, annual_interest_rate=0)
    res = calculate_savings_goal(req)
    assert res.required_monthly_saving == 1000.0
    assert res.total_contributions == 12000.0
    assert res.total_interest_earned == 0.0


def test_savings_goal_with_interest():
    req = SavingsGoalRequest(target_amount=50000, timeline_months=36, current_savings=5000, annual_interest_rate=6.0)
    res = calculate_savings_goal(req)
    assert res.required_monthly_saving > 0
    assert res.total_interest_earned > 0
    assert len(res.chart_data) > 0


def test_budget_splitter_50_30_20():
    req = BudgetSplitterRequest(monthly_income=6000, needs_pct=50, wants_pct=30, savings_pct=20)
    res = calculate_budget_50_30_20(req)
    assert res.needs.amount == 3000.0
    assert res.wants.amount == 1800.0
    assert res.savings.amount == 1200.0
    assert len(res.chart_data) == 3


def test_budget_splitter_custom_percentages():
    req = BudgetSplitterRequest(monthly_income=10000, needs_pct=60, wants_pct=20, savings_pct=20)
    res = calculate_budget_50_30_20(req)
    assert res.needs.amount == 6000.0
    assert res.wants.amount == 2000.0
    assert res.savings.amount == 2000.0


def test_debt_payoff_avalanche_vs_snowball():
    debts = [
        DebtItem(name="High Rate Card", balance=3000, interest_rate=24.0, min_payment=90),
        DebtItem(name="Small Loan", balance=1500, interest_rate=12.0, min_payment=50),
        DebtItem(name="Car Loan", balance=8000, interest_rate=5.0, min_payment=180)
    ]
    req = DebtPayoffRequest(debts=debts, extra_monthly_payment=100)
    res = calculate_debt_payoff(req)

    # Avalanche pays high interest first -> lower total interest than snowball
    assert res.avalanche.total_interest_paid <= res.snowball.total_interest_paid
    assert res.avalanche.total_months <= res.snowball.total_months
    assert len(res.comparison_chart) == 3


def test_emergency_fund_calculator():
    req = EmergencyFundRequest(
        monthly_essential_expenses=3000,
        months_target=6,
        current_savings=9000,
        monthly_savings_capacity=500
    )
    res = calculate_emergency_fund(req)
    assert res.target_fund == 18000.0
    assert res.funding_gap == 9000.0
    assert res.percent_funded == 50.0
    assert res.months_to_complete == 18.0
    assert "Solid Progress" in res.status


def test_emergency_fund_fully_funded():
    req = EmergencyFundRequest(
        monthly_essential_expenses=2000,
        months_target=3,
        current_savings=7000,
        monthly_savings_capacity=200
    )
    res = calculate_emergency_fund(req)
    assert res.target_fund == 6000.0
    assert res.funding_gap == 0.0
    assert res.percent_funded == 100.0
    assert "Fully Funded" in res.status


def test_calculator_robustness_nan_negative_huge():
    # Negative inputs
    with pytest.raises(ValueError):
        calculate_emi(EmiRequest(principal=-10000, annual_rate=5.0, tenure_months=12))

    with pytest.raises(ValueError):
        calculate_sip(SipRequest(monthly_investment=-500, annual_return_rate=8.0, tenure_years=5, initial_lump_sum=0))

    with pytest.raises(ValueError):
        calculate_savings_goal(SavingsGoalRequest(target_amount=10000, timeline_months=-6, current_savings=0, annual_interest_rate=0))

    with pytest.raises(ValueError):
        calculate_budget_50_30_20(BudgetSplitterRequest(monthly_income=-2000, needs_pct=50, wants_pct=30, savings_pct=20))

    with pytest.raises(ValueError):
        calculate_emergency_fund(EmergencyFundRequest(monthly_essential_expenses=-1500, months_target=6, current_savings=0, monthly_savings_capacity=100))

    # Huge inputs
    with pytest.raises(ValueError):
        calculate_emi(EmiRequest(principal=1e14, annual_rate=5.0, tenure_months=12))
