from fastapi import APIRouter, HTTPException
from schemas import (
    EmiRequest, EmiResponse,
    SipRequest, SipResponse,
    SavingsGoalRequest, SavingsGoalResponse,
    BudgetSplitterRequest, BudgetSplitterResponse,
    DebtPayoffRequest, DebtPayoffResponse,
    EmergencyFundRequest, EmergencyFundResponse
)
from services.calculators import (
    calculate_emi,
    calculate_sip,
    calculate_savings_goal,
    calculate_budget_50_30_20,
    calculate_debt_payoff,
    calculate_emergency_fund
)

router = APIRouter(prefix="/api/calculators", tags=["Calculators"])


@router.post("/emi", response_model=EmiResponse)
def get_emi(req: EmiRequest):
    try:
        return calculate_emi(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/sip", response_model=SipResponse)
def get_sip(req: SipRequest):
    try:
        return calculate_sip(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/savings-goal", response_model=SavingsGoalResponse)
def get_savings_goal(req: SavingsGoalRequest):
    try:
        return calculate_savings_goal(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/budget", response_model=BudgetSplitterResponse)
def get_budget(req: BudgetSplitterRequest):
    try:
        return calculate_budget_50_30_20(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/debt-payoff", response_model=DebtPayoffResponse)
def get_debt_payoff(req: DebtPayoffRequest):
    try:
        return calculate_debt_payoff(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/emergency-fund", response_model=EmergencyFundResponse)
def get_emergency_fund(req: EmergencyFundRequest):
    try:
        return calculate_emergency_fund(req)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
