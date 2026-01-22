"""Storage protocol (interface) definitions."""

from typing import Protocol

from decision_ledger.schemas.claim import Claim
from decision_ledger.schemas.catalog import InterpretationSet, AssumptionSet
from decision_ledger.schemas.qa import QAStudyResult, QACohort, QAProposedChange


class StorageProtocol(Protocol):
    """Protocol for storage implementations."""

    def load_claims(self) -> list[Claim]:
        """Load all claims."""
        ...

    def get_claim(self, claim_id: str) -> Claim | None:
        """Get a single claim by ID."""
        ...

    def load_interpretation_sets(self) -> list[InterpretationSet]:
        """Load all interpretation sets."""
        ...

    def get_interpretation_set(self, set_id: str) -> InterpretationSet | None:
        """Get a single interpretation set by ID."""
        ...

    def load_assumption_sets(self) -> list[AssumptionSet]:
        """Load all assumption sets."""
        ...

    def get_assumption_set(self, set_id: str) -> AssumptionSet | None:
        """Get a single assumption set by ID."""
        ...

    def load_qa_results(self) -> list[QAStudyResult]:
        """Load all QA study results."""
        ...

    def load_qa_cohorts(self) -> list[QACohort]:
        """Load all QA cohorts."""
        ...

    def load_qa_proposed_changes(self) -> list[QAProposedChange]:
        """Load all QA proposed changes."""
        ...
