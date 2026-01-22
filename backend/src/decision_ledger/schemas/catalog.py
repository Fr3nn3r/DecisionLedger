"""Catalog-related Pydantic models (Interpretations & Assumptions)."""

from datetime import date
from enum import Enum
from pydantic import BaseModel


class SetStatus(str, Enum):
    """Status of an interpretation or assumption set."""

    DRAFT = "Draft"
    APPROVED = "Approved"
    DEPRECATED = "Deprecated"


class RiskTier(str, Enum):
    """Risk tier for assumptions."""

    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class Role(str, Enum):
    """User roles in the system."""

    ADJUSTER = "Adjuster"
    SUPERVISOR = "Supervisor"
    QA_LEAD = "QA Lead"
    POLICY_OWNER = "Policy Owner"


class DecisionOption(BaseModel):
    """An option for a decision point."""

    option_id: str
    label: str
    description: str


class DecisionPoint(BaseModel):
    """A decision point in an interpretation set."""

    decision_point_id: str
    label: str
    description: str
    options: list[DecisionOption]
    default_option: str
    owner: str
    status: SetStatus


class InterpretationSet(BaseModel):
    """A versioned set of interpretation decision points."""

    interpretation_set_id: str
    jurisdiction: str
    product_line: str
    effective_from: date
    version: str
    status: SetStatus
    decision_points: list[DecisionPoint]


class AssumptionAlternative(BaseModel):
    """An alternative resolution for an assumption."""

    alternative_id: str
    label: str
    description: str
    allowed_roles: list[Role]


class Assumption(BaseModel):
    """An assumption definition."""

    assumption_id: str
    label: str
    trigger: str
    trigger_fact_id: str
    description: str
    recommended_resolution: str
    alternatives: list[AssumptionAlternative]
    risk_tier: RiskTier


class AssumptionSet(BaseModel):
    """A versioned set of assumptions."""

    assumption_set_id: str
    jurisdiction: str
    product_line: str
    version: str
    status: SetStatus
    assumptions: list[Assumption]
