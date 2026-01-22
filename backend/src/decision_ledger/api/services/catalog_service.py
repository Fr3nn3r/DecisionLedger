"""Catalog business logic service."""

from decision_ledger.schemas.catalog import InterpretationSet, AssumptionSet
from decision_ledger.storage.filesystem import FileStorage


class CatalogService:
    """Service for managing interpretation and assumption catalogs."""

    def __init__(self) -> None:
        self.storage = FileStorage()

    def list_interpretation_sets(
        self,
        jurisdiction: str | None = None,
        product_line: str | None = None,
    ) -> list[InterpretationSet]:
        """List all interpretation sets with optional filters."""
        sets = self.storage.load_interpretation_sets()

        if jurisdiction:
            sets = [s for s in sets if s.jurisdiction == jurisdiction]
        if product_line:
            sets = [s for s in sets if s.product_line == product_line]

        return sets

    def get_interpretation_set(self, set_id: str) -> InterpretationSet | None:
        """Get a single interpretation set by ID."""
        return self.storage.get_interpretation_set(set_id)

    def list_assumption_sets(
        self,
        jurisdiction: str | None = None,
        product_line: str | None = None,
    ) -> list[AssumptionSet]:
        """List all assumption sets with optional filters."""
        sets = self.storage.load_assumption_sets()

        if jurisdiction:
            sets = [s for s in sets if s.jurisdiction == jurisdiction]
        if product_line:
            sets = [s for s in sets if s.product_line == product_line]

        return sets

    def get_assumption_set(self, set_id: str) -> AssumptionSet | None:
        """Get a single assumption set by ID."""
        return self.storage.get_assumption_set(set_id)
