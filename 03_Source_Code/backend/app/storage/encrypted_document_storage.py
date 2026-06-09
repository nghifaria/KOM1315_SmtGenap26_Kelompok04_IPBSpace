from __future__ import annotations

import io
import mimetypes
import warnings
import structlog

from fastapi import HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse

from app.core.crypto import DocumentCrypto, get_document_crypto
from app.storage.document_storage import DocumentStorage

logger = structlog.get_logger()



class EncryptedDocumentStorage(DocumentStorage):
    def __init__(
        self,
        inner: DocumentStorage,
        crypto: DocumentCrypto | None = None,
        strict_verification: bool = True,
    ) -> None:
        self._inner = inner
        self._crypto = crypto or get_document_crypto()
        self._strict = strict_verification


    async def upload_booking_document(self, file: UploadFile) -> str:
        """Sign + encrypt the file, then delegate to the inner backend."""
        original_filename = file.filename or "document"
        plaintext = await file.read()

        secured_bytes = self._crypto.sign_and_encrypt(plaintext, original_filename)

        logger.info(
            "cryptographic_signature_generated",
            filename=original_filename,
            algorithm="RSASSA-PSS (SHA-256)",
            status="SIGNED SUCCESS",
        )

        # Replace the UploadFile content with the secured bytes so the inner
        # storage backend can save it transparently.
        secured_file = _BytesUploadFile(
            data=secured_bytes,
            filename=original_filename + ".secured",
            content_type="application/octet-stream",
        )
        return await self._inner.upload_booking_document(secured_file)

    async def delete_booking_document(self, file_url: str) -> bool:
        return await self._inner.delete_booking_document(file_url)


    async def read_booking_document(self, file_url: str) -> StreamingResponse:
        """Read from inner storage, verify signature, decrypt, and stream."""
        raw_response: StreamingResponse = await self._inner.read_booking_document(file_url)

        # Consume the streaming body from the inner backend
        raw_bytes = b"".join([chunk async for chunk in raw_response.body_iterator])  # type: ignore[attr-defined]

        # If the file was stored before encryption was introduced, pass it through.
        if not self._crypto.is_secured_document(raw_bytes):
            warnings.warn(
                f"Document at '{file_url}' is not encrypted. "
                "It may have been uploaded before cryptography was enabled.",
                stacklevel=2,
            )
            original_filename = file_url.split("/")[-1]
            mime_type, _ = mimetypes.guess_type(original_filename)
            return StreamingResponse(
                io.BytesIO(raw_bytes),
                media_type=mime_type or "application/octet-stream",
                headers={"Content-Disposition": f"inline; filename={original_filename}"},
            )

        # Decrypt + verify
        try:
            result = self._crypto.verify_and_decrypt(raw_bytes)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=f"{exc}"
            ) from exc

        if not result.signature_valid:
            msg = (
                f"Document signature verification failed for '{result.header.original_filename}': "
                f"{result.error}"
            )
            logger.warning(
                "cryptographic_signature_verification_failed",
                filename=result.header.original_filename,
                algorithm="RSASSA-PSS (SHA-256)",
                status="INTEGRITY FAILED",
                error=result.error,
            )
            if self._strict:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail=msg,
                )
            warnings.warn(msg, stacklevel=2)

        # Restore original filename and MIME type for the response
        original_filename = result.header.original_filename
        mime_type, _ = mimetypes.guess_type(original_filename)

        logger.info(
            "cryptographic_signature_verified",
            filename=original_filename,
            algorithm="RSASSA-PSS (SHA-256)",
            status="VERIFIED / INTEGRITY VALID",
        )

        return StreamingResponse(
            io.BytesIO(result.plaintext),
            media_type=mime_type or "application/octet-stream",
            headers={
                "Content-Disposition": f"inline; filename={original_filename}",
                # Expose signature metadata as response headers for debugging
                "X-Document-Signature-Valid": str(result.signature_valid).lower(),
                "X-Document-Signed-At": result.header.timestamp,
                "X-Document-Algorithm": result.header.algorithm,
                "X-Document-Key-Fingerprint": result.header.public_key_fingerprint,
            },
        )


    async def upload_facility_image(self, file: UploadFile) -> str:
        return await self._inner.upload_facility_image(file)

    async def delete_facility_image(self, file_url: str) -> bool:
        return await self._inner.delete_facility_image(file_url)



class _BytesUploadFile:
    def __init__(self, data: bytes, filename: str, content_type: str) -> None:
        self._buffer = io.BytesIO(data)
        self.filename = filename
        self.content_type = content_type

    async def read(self, size: int = -1) -> bytes:
        return self._buffer.read(size)

    async def close(self) -> None:
        self._buffer.close()