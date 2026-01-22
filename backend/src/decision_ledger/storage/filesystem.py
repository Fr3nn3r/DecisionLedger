"""File-based storage implementation using JSON fixtures."""

import json
from pathlib import Path
from functools import lru_cache

from decision_ledger.schemas.claim import Claim
from decision_ledger.schemas.catalog import InterpretationSet, AssumptionSet
from decision_ledger.schemas.qa import QAStudyResult, QACohort, QAProposedChange


class FileStorage:
    """File-based storage using JSON fixtures."""

    def __init__(self, fixtures_path: Path | None = None) -> None:
        """Initialize storage with fixtures path.

        Args:
            fixtures_path: Path to fixtures directory. Defaults to backend/fixtures/
        """
        if fixtures_path is None:
            # Default to backend/fixtures/ relative to this file
            self.fixtures_path = Path(__file__).parent.parent.parent.parent / "fixtures"
        else:
            self.fixtures_path = fixtures_path

    def _load_json(self, filename: str) -> list[dict]:
        """Load JSON file from fixtures directory."""
        filepath = self.fixtures_path / filename
        if not filepath.exists():
            return []
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    @lru_cache(maxsize=1)
    def load_claims(self) -> list[Claim]:
        """Load all claims from fixtures."""
        data = self._load_json("claims.json")
        return [Claim.model_validate(item) for item in data]

    def get_claim(self, claim_id: str) -> Claim | None:
        """Get a single claim by ID."""
        for claim in self.load_claims():
            if claim.claim_id == claim_id:
                return claim
        return None

    @lru_cache(maxsize=1)
    def load_interpretation_sets(self) -> list[InterpretationSet]:
        """Load all interpretation sets from fixtures."""
        data = self._load_json("interpretation_sets.json")
        return [InterpretationSet.model_validate(item) for item in data]

    def get_interpretation_set(self, set_id: str) -> InterpretationSet | None:
        """Get a single interpretation set by ID."""
        for iset in self.load_interpretation_sets():
            if iset.interpretation_set_id == set_id:
                return iset
        return None

    @lru_cache(maxsize=1)
    def load_assumption_sets(self) -> list[AssumptionSet]:
        """Load all assumption sets from fixtures."""
        data = self._load_json("assumption_sets.json")
        return [AssumptionSet.model_validate(item) for item in data]

    def get_assumption_set(self, set_id: str) -> AssumptionSet | None:
        """Get a single assumption set by ID."""
        for aset in self.load_assumption_sets():
            if aset.assumption_set_id == set_id:
                return aset
        return None

    @lru_cache(maxsize=1)
    def load_qa_results(self) -> list[QAStudyResult]:
        """Load all QA study results from fixtures."""
        data = self._load_json("qa_results.json")
        return [QAStudyResult.model_validate(item) for item in data]

    @lru_cache(maxsize=1)
    def load_qa_cohorts(self) -> list[QACohort]:
        """Load all QA cohorts from fixtures."""
        data = self._load_json("qa_cohorts.json")
        return [QACohort.model_validate(item) for item in data]

    @lru_cache(maxsize=1)
    def load_qa_proposed_changes(self) -> list[QAProposedChange]:
        """Load all QA proposed changes from fixtures."""
        data = self._load_json("qa_proposed_changes.json")
        return [QAProposedChange.model_validate(item) for item in data]

    def clear_cache(self) -> None:
        """Clear all cached data (for reset functionality)."""
        self.load_claims.cache_clear()
        self.load_interpretation_sets.cache_clear()
        self.load_assumption_sets.cache_clear()
        self.load_qa_results.cache_clear()
        self.load_qa_cohorts.cache_clear()
        self.load_qa_proposed_changes.cache_clear()
