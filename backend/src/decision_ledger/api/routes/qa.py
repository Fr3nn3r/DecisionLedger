"""QA Impact API routes."""

from fastapi import APIRouter

from decision_ledger.schemas.qa import QAStudyResult, QACohort, QAProposedChange
from decision_ledger.api.services.qa_service import QAService

router = APIRouter()
qa_service = QAService()


@router.get("/cohorts", response_model=list[QACohort])
async def list_cohorts() -> list[QACohort]:
    """List available cohorts for QA simulation."""
    return qa_service.list_cohorts()


@router.get("/proposed-changes", response_model=list[QAProposedChange])
async def list_proposed_changes() -> list[QAProposedChange]:
    """List available proposed changes for QA simulation."""
    return qa_service.list_proposed_changes()


@router.get("/results", response_model=list[QAStudyResult])
async def list_results() -> list[QAStudyResult]:
    """List all pre-computed QA study results."""
    return qa_service.list_results()


@router.get("/results/{cohort_id}/{proposal_id}", response_model=QAStudyResult)
async def get_result(cohort_id: str, proposal_id: str) -> QAStudyResult:
    """Get a specific QA study result."""
    return qa_service.get_result(cohort_id, proposal_id)
