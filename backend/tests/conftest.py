"""Shared test fixtures for Decision Ledger backend tests."""

import pytest
from pathlib import Path
from datetime import date

from decision_ledger.schemas.claim import Claim, Fact, Evidence, LineItem, FactStatus, ClaimStatus
from decision_ledger.schemas.catalog import (
    InterpretationSet,
    DecisionPoint,
    DecisionOption,
    AssumptionSet,
    Assumption,
    AssumptionAlternative,
    SetStatus,
    RiskTier,
    Role,
)
from decision_ledger.storage.filesystem import FileStorage


@pytest.fixture
def fixtures_path(tmp_path: Path) -> Path:
    """Create a temporary fixtures directory."""
    fixtures = tmp_path / "fixtures"
    fixtures.mkdir()
    return fixtures


@pytest.fixture
def temp_storage(fixtures_path: Path) -> FileStorage:
    """Provide isolated storage for each test."""
    return FileStorage(fixtures_path)


@pytest.fixture
def sample_claim() -> Claim:
    """Create a sample CH Motor claim for testing."""
    return Claim(
        claim_id="CLM-CH-001",
        jurisdiction="CH",
        product_line="Motor/Casco",
        loss_date=date(2025, 11, 15),
        policy_id="POL-CH-12345",
        status=ClaimStatus.READY,
        facts=[
            Fact(
                fact_id="FACT.VEHICLE_TYPE",
                label="Vehicle Type",
                value="Passenger Car",
                status=FactStatus.KNOWN,
                source="Policy Document",
            ),
            Fact(
                fact_id="FACT.ACCESSORY_DECLARED",
                label="Accessory Declared",
                value=None,
                status=FactStatus.UNKNOWN,
                source="Unknown",
            ),
        ],
        evidence=[
            Evidence(
                evidence_id="EVD-001",
                label="Repair Estimate",
                type="PDF",
                url="/evidence/repair_estimate.pdf",
            ),
        ],
        line_items=[
            LineItem(
                item_id="LI-001",
                label="Bumper Repair",
                amount_chf=2500.0,
                category="repair",
            ),
            LineItem(
                item_id="LI-002",
                label="Tow Bar Replacement",
                amount_chf=1200.0,
                category="accessory",
            ),
        ],
    )


@pytest.fixture
def sample_interpretation_set() -> InterpretationSet:
    """Create a sample interpretation set for testing."""
    return InterpretationSet(
        interpretation_set_id="INT-CH-MOTOR-2025.1",
        jurisdiction="CH",
        product_line="Motor/Casco",
        effective_from=date(2025, 1, 1),
        version="2025.1",
        status=SetStatus.APPROVED,
        decision_points=[
            DecisionPoint(
                decision_point_id="DP.ACCESSORY_COVERAGE",
                label="Accessory Coverage",
                description="How to handle aftermarket accessory coverage",
                options=[
                    DecisionOption(
                        option_id="INCLUDED_IF_DECLARED",
                        label="Included if Declared",
                        description="Cover accessories only if declared on policy",
                    ),
                    DecisionOption(
                        option_id="INCLUDED_BY_DEFAULT",
                        label="Included by Default",
                        description="Cover all accessories automatically",
                    ),
                    DecisionOption(
                        option_id="EXCLUDED",
                        label="Excluded",
                        description="Never cover aftermarket accessories",
                    ),
                ],
                default_option="INCLUDED_IF_DECLARED",
                owner="Policy Team",
                status=SetStatus.APPROVED,
            ),
        ],
    )


@pytest.fixture
def sample_assumption_set() -> AssumptionSet:
    """Create a sample assumption set for testing."""
    return AssumptionSet(
        assumption_set_id="ASM-CH-MOTOR-2025.1",
        jurisdiction="CH",
        product_line="Motor/Casco",
        version="2025.1",
        status=SetStatus.APPROVED,
        assumptions=[
            Assumption(
                assumption_id="ASM.ACCESSORY_DECLARED",
                label="Accessory Declaration Status",
                trigger="FACT.ACCESSORY_DECLARED is UNKNOWN",
                trigger_fact_id="FACT.ACCESSORY_DECLARED",
                description="When accessory declaration status is unknown",
                recommended_resolution="NOT_DECLARED",
                alternatives=[
                    AssumptionAlternative(
                        alternative_id="NOT_DECLARED",
                        label="Assume Not Declared",
                        description="Conservative: assume accessory was not declared",
                        allowed_roles=[Role.ADJUSTER, Role.SUPERVISOR, Role.QA_LEAD, Role.POLICY_OWNER],
                    ),
                    AssumptionAlternative(
                        alternative_id="DECLARED",
                        label="Assume Declared",
                        description="If invoice/documentation suggests declaration",
                        allowed_roles=[Role.SUPERVISOR, Role.QA_LEAD, Role.POLICY_OWNER],
                    ),
                ],
                risk_tier=RiskTier.MEDIUM,
            ),
        ],
    )
