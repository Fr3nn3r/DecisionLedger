"""QA Impact business logic service."""

from decision_ledger.schemas.qa import QAStudyResult, QACohort, QAProposedChange
from decision_ledger.storage.filesystem import FileStorage


class QAService:
    """Service for QA impact analysis."""

    def __init__(self) -> None:
        self.storage = FileStorage()

    def list_cohorts(self) -> list[QACohort]:
        """List available cohorts for QA simulation."""
        return self.storage.load_qa_cohorts()

    def list_proposed_changes(self) -> list[QAProposedChange]:
        """List available proposed changes for QA simulation."""
        return self.storage.load_qa_proposed_changes()

    def list_results(self) -> list[QAStudyResult]:
        """List all pre-computed QA study results."""
        return self.storage.load_qa_results()

    def get_result(self, cohort_id: str, proposal_id: str) -> QAStudyResult:
        """Get a specific QA study result."""
        results = self.storage.load_qa_results()
        for result in results:
            if result.cohort_id == cohort_id and result.proposal_id == proposal_id:
                return result
        raise ValueError(f"No result found for cohort {cohort_id} and proposal {proposal_id}")
