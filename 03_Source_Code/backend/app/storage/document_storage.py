from abc import ABC, abstractmethod
from typing import Any
from fastapi import UploadFile


class DocumentStorage(ABC):
    """Abstraction for uploading booking documents and facility images to any storage vendor."""

    @abstractmethod
    async def upload_booking_document(self, file: UploadFile) -> str:
        """Upload a booking document and return its public URL/path."""
        raise NotImplementedError

    @abstractmethod
    async def delete_booking_document(self, file_url: str) -> bool:
        """Delete a booking document from storage."""
        raise NotImplementedError

    @abstractmethod
    async def upload_facility_image(self, file: UploadFile) -> str:
        """Upload a facility image and return its public URL/path."""
        raise NotImplementedError

    @abstractmethod
    async def delete_facility_image(self, file_url: str) -> bool:
        """Delete a facility image from storage."""
        raise NotImplementedError

    @abstractmethod
    async def read_booking_document(self, file_url: str) -> Any:
        """Read a booking document from storage and return it as a response."""
        raise NotImplementedError