"""Storage layer for Decision Ledger."""

from decision_ledger.storage.protocol import StorageProtocol
from decision_ledger.storage.filesystem import FileStorage

__all__ = ["StorageProtocol", "FileStorage"]
