"""Catalogs API routes."""

from fastapi import APIRouter, HTTPException

from decision_ledger.schemas.catalog import InterpretationSet, AssumptionSet
from decision_ledger.api.services.catalog_service import CatalogService

router = APIRouter()
catalog_service = CatalogService()


@router.get("/interpretation-sets", response_model=list[InterpretationSet])
async def list_interpretation_sets(
    jurisdiction: str | None = None,
    product_line: str | None = None,
) -> list[InterpretationSet]:
    """List all interpretation sets."""
    return catalog_service.list_interpretation_sets(
        jurisdiction=jurisdiction,
        product_line=product_line,
    )


@router.get("/interpretation-sets/{set_id}", response_model=InterpretationSet)
async def get_interpretation_set(set_id: str) -> InterpretationSet:
    """Get a single interpretation set by ID."""
    iset = catalog_service.get_interpretation_set(set_id)
    if not iset:
        raise HTTPException(status_code=404, detail=f"Interpretation set {set_id} not found")
    return iset


@router.get("/assumption-sets", response_model=list[AssumptionSet])
async def list_assumption_sets(
    jurisdiction: str | None = None,
    product_line: str | None = None,
) -> list[AssumptionSet]:
    """List all assumption sets."""
    return catalog_service.list_assumption_sets(
        jurisdiction=jurisdiction,
        product_line=product_line,
    )


@router.get("/assumption-sets/{set_id}", response_model=AssumptionSet)
async def get_assumption_set(set_id: str) -> AssumptionSet:
    """Get a single assumption set by ID."""
    aset = catalog_service.get_assumption_set(set_id)
    if not aset:
        raise HTTPException(status_code=404, detail=f"Assumption set {set_id} not found")
    return aset
