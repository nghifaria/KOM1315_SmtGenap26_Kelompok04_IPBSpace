import os

from app.storage.appwrite_document_storage import AppwriteDocumentStorage
from app.storage.document_storage import DocumentStorage
from app.storage.local_document_storage import LocalDocumentStorage


def get_document_storage() -> DocumentStorage:
    """Return document storage based on BOOKING_DOCUMENT_VENDOR."""
    vendor = os.getenv("BOOKING_DOCUMENT_VENDOR", "local").strip().lower()

    if vendor == "appwrite":
        return AppwriteDocumentStorage()
    if vendor == "local":
        return LocalDocumentStorage()

    raise ValueError(
        "Invalid BOOKING_DOCUMENT_VENDOR. Supported values are: local, appwrite"
    )
