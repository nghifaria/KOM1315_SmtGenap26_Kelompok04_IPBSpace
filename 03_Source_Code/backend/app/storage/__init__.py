from app.storage.appwrite_document_storage import AppwriteDocumentStorage
from app.storage.document_storage import DocumentStorage
from app.storage.factory import get_document_storage
from app.storage.local_document_storage import LocalDocumentStorage

__all__ = [
	"DocumentStorage",
	"LocalDocumentStorage",
	"AppwriteDocumentStorage",
	"get_document_storage",
]
