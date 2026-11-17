from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field
import datetime


class UserProfileSchema(BaseModel):
    currency: str = Field(default="USD", description="Currency code (USD, INR, EUR, GBP)")
    monthly_income: float = Field(default=0.0, ge=0)
    monthly_expenses: float = Field(default=0.0, ge=0)
    risk_tolerance: str = Field(default="moderate", description="conservative, moderate, aggressive")
    primary_goal: str = Field(default="Build wealth & secure emergency fund")


class UserProfileResponse(UserProfileSchema):
    id: int
    updated_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True


# Calculator Schemas
class EmiRequest(BaseModel):
    principal: float = Field(..., gt=0, description="Loan principal amount")
    annual_rate: float = Field(..., ge=0, description="Annual interest rate in percent (e.g. 7.5)")
    tenure_months: int = Field(..., gt=0, description="Loan tenure in months")


class EmiResponse(BaseModel):
    monthly_emi: float
    total_interest: float
    total_payment: float
    principal: float
    tenure_months: int
    annual_rate: float
    amortization_summary: List[Dict[str, Any]]
    chart_data: List[Dict[str, Any]]


class SipRequest(BaseModel):
    monthly_investment: float = Field(..., ge=0, description="Monthly SIP amount")
    annual_return_rate: float = Field(..., ge=0, description="Expected annual return percentage")
    tenure_years: int = Field(..., gt=0, le=50, description="Tenure in years")
    initial_lump_sum: float = Field(default=0.0, ge=0, description="Optional starting lump sum")


class SipResponse(BaseModel):
    invested_amount: float
    estimated_returns: float
    total_value: float
    monthly_investment: float
    annual_return_rate: float
    tenure_years: int
    yearly_breakdown: List[Dict[str, Any]]
    chart_data: List[Dict[str, Any]]


class SavingsGoalRequest(BaseModel):
    target_amount: float = Field(..., gt=0, description="Target savings amount")
    timeline_months: int = Field(..., gt=0, description="Target timeline in months")
    current_savings: float = Field(default=0.0, ge=0, description="Current amount saved")
    annual_interest_rate: float = Field(default=0.0, ge=0, description="Expected annual interest/return")


class SavingsGoalResponse(BaseModel):
    target_amount: float
    timeline_months: int
    current_savings: float
    annual_interest_rate: float
    required_monthly_saving: float
    total_contributions: float
    total_interest_earned: float
    chart_data: List[Dict[str, Any]]


class BudgetSplitterRequest(BaseModel):
    monthly_income: float = Field(..., gt=0, description="Total monthly post-tax income")
    needs_pct: float = Field(default=50.0, ge=0, le=100)
    wants_pct: float = Field(default=30.0, ge=0, le=100)
    savings_pct: float = Field(default=20.0, ge=0, le=100)


class BudgetCategoryBreakdown(BaseModel):
    category: str
    percentage: float
    amount: float
    suggestions: List[str]


class BudgetSplitterResponse(BaseModel):
    monthly_income: float
    needs: BudgetCategoryBreakdown
    wants: BudgetCategoryBreakdown
    savings: BudgetCategoryBreakdown
    chart_data: List[Dict[str, Any]]


class DebtItem(BaseModel):
    name: str = Field(..., description="Debt name, e.g. Credit Card A")
    balance: float = Field(..., gt=0, description="Current balance")
    interest_rate: float = Field(..., ge=0, description="Annual percentage rate (APR)")
    min_payment: float = Field(..., gt=0, description="Minimum monthly payment")


class DebtPayoffRequest(BaseModel):
    debts: List[DebtItem]
    extra_monthly_payment: float = Field(default=0.0, ge=0, description="Additional monthly budget for debt payoff")


class DebtPayoffMethodResult(BaseModel):
    method: str
    total_months: int
    total_interest_paid: float
    total_paid: float
    payoff_order: List[str]
    timeline: List[Dict[str, Any]]


class DebtPayoffResponse(BaseModel):
    avalanche: DebtPayoffMethodResult
    snowball: DebtPayoffMethodResult
    interest_difference: float
    months_difference: int
    recommendation: str
    comparison_chart: List[Dict[str, Any]]


class EmergencyFundRequest(BaseModel):
    monthly_essential_expenses: float = Field(..., gt=0, description="Essential monthly living expenses")
    months_target: int = Field(default=6, ge=1, le=24, description="Months of coverage (e.g. 3, 6, 9, 12)")
    current_savings: float = Field(default=0.0, ge=0, description="Current liquid emergency savings")
    monthly_savings_capacity: float = Field(default=0.0, ge=0, description="How much you can save each month towards this")


class EmergencyFundResponse(BaseModel):
    monthly_essential_expenses: float
    months_target: int
    target_fund: float
    current_savings: float
    funding_gap: float
    percent_funded: float
    months_to_complete: Optional[float]
    status: str
    advice: List[str]
    chart_data: List[Dict[str, Any]]


# Chat Schemas
class ChatMessageSchema(BaseModel):
    id: Optional[int] = None
    session_id: str
    sender: str
    content: str
    intent: Optional[str] = None
    entities: Optional[Dict[str, Any]] = None
    tool_calls: Optional[List[Dict[str, Any]]] = None
    chart_data: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime.datetime] = None


class ChatSessionSchema(BaseModel):
    id: str
    title: str
    created_at: datetime.datetime
    updated_at: datetime.datetime
    messages: List[ChatMessageSchema] = []


class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(..., min_length=1, max_length=4000)
    currency: Optional[str] = "USD"
    user_profile: Optional[UserProfileSchema] = None


class SummarizeRequest(BaseModel):
    session_id: str
