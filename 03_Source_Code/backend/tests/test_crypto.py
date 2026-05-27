"""
Tests for app.core.crypto and app.storage.encrypted_document_storage.

Run with:
    pytest tests/test_crypto.py -v
"""

from __future__ import annotations

import asyncio
import io
import struct

import pytest

from app.core.crypto import MAGIC, DocumentCrypto, VerificationResult
from app.storage.encrypted_document_storage import EncryptedDocumentStorage
from app.storage.local_document_storage import LocalDocumentStorage


# ─── fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def crypto() -> DocumentCrypto:
    """Fresh DocumentCrypto with ephemeral keys (no env vars needed)."""
    return DocumentCrypto()


@pytest.fixture(scope="module")
def plaintext() -> bytes:
    return b"%PDF-1.4 fake pdf content for testing purposes 1234567890"


# ─── DocumentCrypto unit tests ────────────────────────────────────────────────

class TestDocumentCrypto:
    def test_sign_and_encrypt_returns_bytes(self, crypto: DocumentCrypto, plaintext: bytes):
        result = crypto.sign_and_encrypt(plaintext, "test.pdf")
        assert isinstance(result, bytes)
        assert len(result) > len(plaintext)

    def test_magic_marker_present(self, crypto: DocumentCrypto, plaintext: bytes):
        result = crypto.sign_and_encrypt(plaintext, "test.pdf")
        assert result[:4] == MAGIC

    def test_round_trip(self, crypto: DocumentCrypto, plaintext: bytes):
        secured = crypto.sign_and_encrypt(plaintext, "doc.pdf")
        result = crypto.verify_and_decrypt(secured)

        assert result.plaintext == plaintext
        assert result.signature_valid is True
        assert result.error is None

    def test_header_metadata(self, crypto: DocumentCrypto, plaintext: bytes):
        secured = crypto.sign_and_encrypt(plaintext, "invoice.pdf")
        result = crypto.verify_and_decrypt(secured)

        assert result.header.original_filename == "invoice.pdf"
        assert result.header.original_size == len(plaintext)
        assert result.header.algorithm == "RSA-PSS-SHA256+AES-256-GCM"
        assert result.header.version == 1

    def test_tampered_ciphertext_raises(self, crypto: DocumentCrypto, plaintext: bytes):
        secured = bytearray(crypto.sign_and_encrypt(plaintext, "doc.pdf"))
        # Flip a byte near the end (ciphertext region)
        secured[-5] ^= 0xFF
        with pytest.raises(ValueError, match="Decryption failed"):
            crypto.verify_and_decrypt(bytes(secured))

    def test_tampered_signature_field_fails_verification(self, crypto: DocumentCrypto, plaintext: bytes):
        """Corrupt the base64 signature value in the header → signature_valid=False."""
        import json as _json

        secured = crypto.sign_and_encrypt(plaintext, "doc.pdf")

        header_len = struct.unpack(">I", secured[4:8])[0]
        header_end = 8 + header_len
        header_dict = _json.loads(secured[8:header_end].decode())

        # Corrupt the signature: replace first char of the base64 string
        bad_sig = header_dict["signature"]
        header_dict["signature"] = ("A" if bad_sig[0] != "A" else "B") + bad_sig[1:]
        new_header = _json.dumps(header_dict, separators=(",", ":")).encode()
        new_header_len = struct.pack(">I", len(new_header))

        tampered = MAGIC + new_header_len + new_header + secured[header_end:]
        result = crypto.verify_and_decrypt(tampered)

        # Decryption still succeeds (AES-GCM is unaffected), but RSA-PSS fails
        assert result.plaintext == plaintext
        assert result.signature_valid is False
        assert result.error is not None

    def test_wrong_magic_raises(self, crypto: DocumentCrypto):
        with pytest.raises(ValueError, match="magic marker"):
            crypto.verify_and_decrypt(b"notasecureddoc")

    def test_is_secured_document(self, crypto: DocumentCrypto, plaintext: bytes):
        secured = crypto.sign_and_encrypt(plaintext, "x.pdf")
        assert crypto.is_secured_document(secured) is True
        assert crypto.is_secured_document(plaintext) is False

    def test_different_key_cannot_decrypt(self, plaintext: bytes):
        crypto_a = DocumentCrypto(encryption_key_hex="00" * 32)
        crypto_b = DocumentCrypto(encryption_key_hex="11" * 32)
        secured = crypto_a.sign_and_encrypt(plaintext, "doc.pdf")
        with pytest.raises(ValueError, match="Decryption failed"):
            crypto_b.verify_and_decrypt(secured)

    def test_each_encryption_is_unique(self, crypto: DocumentCrypto, plaintext: bytes):
        """AES-GCM uses a fresh random nonce each time → ciphertexts differ."""
        a = crypto.sign_and_encrypt(plaintext, "doc.pdf")
        b = crypto.sign_and_encrypt(plaintext, "doc.pdf")
        assert a != b

    def test_public_key_pem_exported(self, crypto: DocumentCrypto):
        pem = crypto.public_key_pem
        assert pem.startswith("-----BEGIN PUBLIC KEY-----")


# ─── EncryptedDocumentStorage integration tests ───────────────────────────────

def _run(coro):
    return asyncio.run(coro)


class _FakeUploadFile:
    def __init__(self, data: bytes, filename: str, content_type: str = "application/pdf"):
        self._data = data
        self.filename = filename
        self.content_type = content_type

    async def read(self, size=-1):
        return self._data

    async def close(self):
        pass


class TestEncryptedDocumentStorage:
    @pytest.fixture(autouse=True)
    def setup(self, tmp_path):
        crypto = DocumentCrypto()
        inner = LocalDocumentStorage(
            base_dir=str(tmp_path / "booking-documents"),
            base_url="/uploads/booking-documents",
        )
        self.storage = EncryptedDocumentStorage(inner, crypto=crypto, strict_verification=True)
        self.crypto = crypto

    def test_upload_and_read_round_trip(self):
        original = b"%PDF-1.4 hello world document content"
        upload = _FakeUploadFile(original, "test.pdf")

        url = _run(self.storage.upload_booking_document(upload))
        assert url.endswith(".secured")

        response = _run(self.storage.read_booking_document(url))
        body = b"".join(_run(self._collect(response.body_iterator)))

        assert body == original
        assert response.headers["X-Document-Signature-Valid"] == "true"

    def test_unencrypted_legacy_file_passes_through(self, tmp_path):
        """Files uploaded before crypto was enabled should still be readable."""
        crypto = DocumentCrypto()
        inner = LocalDocumentStorage(
            base_dir=str(tmp_path / "legacy"),
            base_url="/uploads/legacy",
        )
        # Write raw (unencrypted) bytes directly via inner storage
        raw_upload = _FakeUploadFile(b"raw legacy pdf", "legacy.pdf")
        url = _run(inner.upload_booking_document(raw_upload))

        storage = EncryptedDocumentStorage(inner, crypto=crypto)
        response = _run(storage.read_booking_document(url))
        body = b"".join(_run(self._collect(response.body_iterator)))
        assert body == b"raw legacy pdf"

    @staticmethod
    async def _collect(iterator):
        chunks = []
        async for chunk in iterator:
            chunks.append(chunk)
        return chunks