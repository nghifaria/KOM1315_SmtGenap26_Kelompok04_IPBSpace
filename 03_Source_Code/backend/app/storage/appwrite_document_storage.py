import asyncio
import io
import mimetypes
import os
import re
from uuid import uuid4

from appwrite.client import Client
from appwrite.id import ID
from appwrite.input_file import InputFile
from appwrite.services.storage import Storage
from fastapi import HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from app.storage.document_storage import DocumentStorage


class AppwriteDocumentStorage(DocumentStorage):
    """Store booking documents and facility images in Appwrite Storage."""

    def __init__(
        self,
        endpoint: str | None = None,
        project_id: str | None = None,
        api_key: str | None = None,
        booking_bucket_id: str | None = None,
        facility_bucket_id: str | None = None,
    ):
        self.endpoint = (endpoint or os.getenv("APPWRITE_ENDPOINT", "")).rstrip("/")
        self.project_id = project_id or os.getenv("APPWRITE_PROJECT_ID")
        self.api_key = api_key or os.getenv("APPWRITE_API_KEY")
        self.booking_bucket_id = booking_bucket_id or os.getenv("APPWRITE_BUCKET_ID")
        # Reuse booking bucket if facility bucket not provided
        self.facility_bucket_id = facility_bucket_id or os.getenv("APPWRITE_FACILITY_BUCKET_ID") or self.booking_bucket_id

        missing = [
            name
            for name, value in {
                "APPWRITE_ENDPOINT": self.endpoint,
                "APPWRITE_PROJECT_ID": self.project_id,
                "APPWRITE_API_KEY": self.api_key,
                "APPWRITE_BUCKET_ID": self.booking_bucket_id,
            }.items()
            if not value
        ]
        if missing:
            raise ValueError(f"Missing Appwrite config: {', '.join(missing)}")

        client = Client()
        client.set_endpoint(self.endpoint)
        client.set_project(self.project_id)
        client.set_key(self.api_key)
        self.storage = Storage(client)

    async def _upload(self, file: UploadFile, bucket_id: str) -> str:
        file_bytes = await file.read()
        filename = file.filename or f"file-{uuid4().hex}"

        appwrite_file = InputFile.from_bytes(file_bytes, filename=filename)
        file_id = ID.unique()

        try:
            created = await asyncio.to_thread(
                self.storage.create_file,
                bucket_id=bucket_id,
                file_id=file_id,
                file=appwrite_file,
            )
        except Exception as exc:
            await file.close()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to upload to Appwrite: {exc}",
            ) from exc

        await file.close()

        created_id = created.get("$id") if isinstance(created, dict) else file_id
        custom_template = os.getenv("APPWRITE_FILE_URL_TEMPLATE")
        if custom_template:
            return custom_template.format(
                endpoint=self.endpoint,
                project_id=self.project_id,
                bucket_id=bucket_id,
                file_id=created_id,
            )

        return (
            f"{self.endpoint}/storage/buckets/{bucket_id}/files/{created_id}"
            f"/view?project={self.project_id}"
        )

    async def _delete(self, file_url: str, bucket_id: str) -> bool:
        match = re.search(r"/files/([^/?#]+)", file_url)
        if not match:
            return False

        file_id = match.group(1)
        try:
            await asyncio.to_thread(
                self.storage.delete_file,
                bucket_id=bucket_id,
                file_id=file_id,
            )
            return True
        except Exception:
            return False

    async def upload_booking_document(self, file: UploadFile) -> str:
        if not self.booking_bucket_id:
            raise HTTPException(status_code=500, detail="Booking bucket not configured")
        return await self._upload(file, self.booking_bucket_id)

    async def delete_booking_document(self, file_url: str) -> bool:
        if not self.booking_bucket_id:
            return False
        return await self._delete(file_url, self.booking_bucket_id)

    async def upload_facility_image(self, file: UploadFile) -> str:
        if not self.facility_bucket_id:
            raise HTTPException(status_code=500, detail="Facility bucket not configured")
        return await self._upload(file, self.facility_bucket_id)

    async def delete_facility_image(self, file_url: str) -> bool:
        if not self.facility_bucket_id:
            return False
        return await self._delete(file_url, self.facility_bucket_id)

    async def read_booking_document(self, file_url: str) -> StreamingResponse:
        if not self.booking_bucket_id:
            raise HTTPException(status_code=500, detail="Booking bucket not configured")

        match = re.search(r"/files/([^/?#]+)", file_url)
        if not match:
            raise HTTPException(status_code=400, detail="Invalid document URL")

        file_id = match.group(1)
        try:
            # Fetch file metadata to get the original filename
            file_meta = await asyncio.to_thread(
                self.storage.get_file,
                bucket_id=self.booking_bucket_id,
                file_id=file_id,
            )
            # Appwrite SDK returns an object, not a dict
            filename = getattr(file_meta, "name", f"document_{file_id}")
            mime_type, _ = mimetypes.guess_type(filename)
            media_type = mime_type or "application/octet-stream"

            file_bytes = await asyncio.to_thread(
                self.storage.get_file_download,
                bucket_id=self.booking_bucket_id,
                file_id=file_id,
            )
            return StreamingResponse(
                io.BytesIO(file_bytes),
                media_type=media_type,
                headers={"Content-Disposition": f"inline; filename={filename}"},
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to retrieve document from Appwrite: {exc}",
            ) from exc