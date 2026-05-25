import io
import mimetypes
import os
from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile
from fastapi.responses import StreamingResponse

from app.storage.document_storage import DocumentStorage


class LocalDocumentStorage(DocumentStorage):
    """Store files in local disk. Useful for development and vendor-agnostic service wiring."""

    def __init__(self, base_dir: str | None = None, base_url: str | None = None):
        # Booking documents
        configured_booking_dir = base_dir or os.getenv("BOOKING_DOCUMENT_DIR", "uploads/booking-documents")
        self.booking_dir = Path(configured_booking_dir)
        self.booking_url = base_url or os.getenv("BOOKING_DOCUMENT_BASE_URL", "/uploads/booking-documents")
        self.booking_dir.mkdir(parents=True, exist_ok=True)

        # Facility images
        configured_facility_dir = os.getenv("FACILITY_IMAGE_DIR", "uploads/facility-images")
        self.facility_dir = Path(configured_facility_dir)
        self.facility_url = os.getenv("FACILITY_IMAGE_BASE_URL", "/uploads/facility-images")
        self.facility_dir.mkdir(parents=True, exist_ok=True)

    async def _upload(self, file: UploadFile, directory: Path, base_url: str) -> str:
        filename = file.filename or "file"
        extension = Path(filename).suffix.lower()
        safe_name = f"{uuid4().hex}{extension}"
        destination = directory / safe_name

        content = await file.read()
        destination.write_bytes(content)
        await file.close()

        return f"{base_url.rstrip('/')}/{safe_name}"

    async def _delete(self, file_url: str, directory: Path) -> bool:
        filename = file_url.split("/")[-1]
        file_path = directory / filename
        if file_path.exists():
            file_path.unlink()
            return True
        return False

    async def upload_booking_document(self, file: UploadFile) -> str:
        return await self._upload(file, self.booking_dir, self.booking_url)

    async def delete_booking_document(self, file_url: str) -> bool:
        return await self._delete(file_url, self.booking_dir)

    async def upload_facility_image(self, file: UploadFile) -> str:
        return await self._upload(file, self.facility_dir, self.facility_url)

    async def delete_facility_image(self, file_url: str) -> bool:
        return await self._delete(file_url, self.facility_dir)

    async def read_booking_document(self, file_url: str) -> StreamingResponse:
        filename = file_url.split("/")[-1]
        file_path = self.booking_dir / filename
        if file_path.exists():
            file_bytes = file_path.read_bytes()
            mime_type, _ = mimetypes.guess_type(filename)
            media_type = mime_type or "application/octet-stream"

            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type=media_type,
                headers={"Content-Disposition": f"inline; filename={filename}"},
            )
        raise FileNotFoundError(f"Booking document not found: {file_url}")