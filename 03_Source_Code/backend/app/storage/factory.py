import os

from app.storage.appwrite_document_storage import AppwriteDocumentStorage
from app.storage.document_storage import DocumentStorage
from app.storage.encrypted_document_storage import EncryptedDocumentStorage
from app.storage.local_document_storage import LocalDocumentStorage


def get_document_storage() -> DocumentStorage:
    vendor = os.getenv("BOOKING_DOCUMENT_VENDOR", "local").strip().lower()

    if vendor == "appwrite":
        inner: DocumentStorage = AppwriteDocumentStorage()
    elif vendor == "local":
        inner = LocalDocumentStorage()
    else:
        raise ValueError(
            "Invalid BOOKING_DOCUMENT_VENDOR. Supported values are: local, appwrite"
        )

    crypto_enabled = os.getenv("DOCUMENT_CRYPTO_ENABLED", "true").strip().lower()
    if crypto_enabled == "true":
        strict = os.getenv("DOCUMENT_CRYPTO_STRICT", "true").strip().lower() == "true"
        return EncryptedDocumentStorage(inner, strict_verification=strict)

    return inner