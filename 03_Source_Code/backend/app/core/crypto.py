from __future__ import annotations

import base64
import json
import os
import secrets
import struct
import warnings
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPrivateKey, RSAPublicKey
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


MAGIC = b"\x53\x49\x47\x4E"   # "SIGN"
NONCE_SIZE = 12                # bytes — standard for AES-GCM
ALGORITHM = "RSA-PSS-SHA256+AES-256-GCM"
FORMAT_VERSION = 1


@dataclass
class SecuredDocumentHeader:
    """Metadata stored in plaintext inside every secured file."""

    version: int
    algorithm: str
    timestamp: str                # ISO-8601 UTC
    original_filename: str
    original_size: int            # bytes, before encryption
    signature: str                # base64-encoded RSA-PSS signature of plaintext
    public_key_fingerprint: str   # SHA-256 of DER-encoded public key (hex)

    def to_dict(self) -> dict[str, Any]:
        return {
            "version": self.version,
            "algorithm": self.algorithm,
            "timestamp": self.timestamp,
            "original_filename": self.original_filename,
            "original_size": self.original_size,
            "signature": self.signature,
            "public_key_fingerprint": self.public_key_fingerprint,
        }

    @classmethod
    def from_dict(cls, d: dict[str, Any]) -> "SecuredDocumentHeader":
        return cls(
            version=d["version"],
            algorithm=d["algorithm"],
            timestamp=d["timestamp"],
            original_filename=d["original_filename"],
            original_size=d["original_size"],
            signature=d["signature"],
            public_key_fingerprint=d["public_key_fingerprint"],
        )


@dataclass
class VerificationResult:
    plaintext: bytes
    header: SecuredDocumentHeader
    signature_valid: bool
    error: str | None = None      # set when signature_valid is False



class DocumentCrypto:
    def __init__(
        self,
        private_key_pem: str | None = None,
        encryption_key_hex: str | None = None,
    ) -> None:
        self._private_key: RSAPrivateKey = self._load_or_generate_private_key(
            private_key_pem or os.getenv("DOCUMENT_SIGNING_PRIVATE_KEY")
        )
        self._public_key: RSAPublicKey = self._private_key.public_key()
        self._aes_key: bytes = self._load_or_generate_aes_key(
            encryption_key_hex or os.getenv("DOCUMENT_ENCRYPTION_KEY")
        )
        self._public_key_fingerprint: str = self._compute_fingerprint(self._public_key)


    def sign_and_encrypt(self, plaintext: bytes, original_filename: str) -> bytes:
        """
        Sign then encrypt *plaintext*.

        Returns the secured binary blob (magic + header + ciphertext).
        The signature covers the original plaintext so authenticity can be
        verified after decryption.
        """
        # 1. Sign the plaintext
        signature_bytes = self._sign(plaintext)
        signature_b64 = base64.b64encode(signature_bytes).decode()

        # 2. Encrypt
        nonce = secrets.token_bytes(NONCE_SIZE)
        aesgcm = AESGCM(self._aes_key)
        ciphertext = aesgcm.encrypt(nonce, plaintext, None)   # nonce + ciphertext + tag
        encrypted_blob = nonce + ciphertext

        # 3. Build header
        header = SecuredDocumentHeader(
            version=FORMAT_VERSION,
            algorithm=ALGORITHM,
            timestamp=datetime.now(timezone.utc).isoformat(),
            original_filename=original_filename,
            original_size=len(plaintext),
            signature=signature_b64,
            public_key_fingerprint=self._public_key_fingerprint,
        )
        header_bytes = json.dumps(header.to_dict(), separators=(",", ":")).encode()

        # 4. Assemble: magic | header_len | header | encrypted_blob
        header_len = struct.pack(">I", len(header_bytes))
        return MAGIC + header_len + header_bytes + encrypted_blob

    def verify_and_decrypt(self, data: bytes) -> VerificationResult:
        """
        Decrypt *data* and verify its digital signature.

        Always returns a :class:`VerificationResult`.  Check
        ``result.signature_valid`` — if False, treat the file as tampered.

        :raises ValueError: if the binary format is unrecognised (not our file).
        """
        header, encrypted_blob = self._parse(data)

        # 1. Decrypt
        nonce = encrypted_blob[:NONCE_SIZE]
        ciphertext = encrypted_blob[NONCE_SIZE:]
        aesgcm = AESGCM(self._aes_key)
        try:
            plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        # except Exception as exc:
        #     raise ValueError(f"Decryption failed (key mismatch or tampered ciphertext): {exc}") from exc
        except Exception as exc:
          raise ValueError(
              "Dokumen tidak dapat diverifikasi dan didekripsi. "
              "File mungkin telah berubah, rusak, atau tidak cocok dengan kunci enkripsi yang digunakan sistem."
          ) from exc

        # 2. Verify signature
        signature_bytes = base64.b64decode(header.signature)
        try:
            self._verify(plaintext, signature_bytes)
            valid = True
            error = None
        except Exception as exc:
            valid = False
            error = str(exc)
            warnings.warn(
                f"Document signature verification FAILED for '{header.original_filename}': {error}",
                stacklevel=2,
            )

        return VerificationResult(
            plaintext=plaintext,
            header=header,
            signature_valid=valid,
            error=error,
        )

    def is_secured_document(self, data: bytes) -> bool:
        """Return True if *data* starts with our magic marker."""
        return data[:4] == MAGIC

    @property
    def public_key_pem(self) -> str:
        """PEM-encoded public key — safe to share / store in config."""
        return self._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()

    @property
    def private_key_pem(self) -> str:
        """PEM-encoded private key — keep this secret!"""
        return self._private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode()


    def _sign(self, data: bytes) -> bytes:
        return self._private_key.sign(
            data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256(),
        )

    def _verify(self, data: bytes, signature: bytes) -> None:
        """Raises InvalidSignature if verification fails."""
        self._public_key.verify(
            signature,
            data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256(),
        )

    @staticmethod
    def _parse(data: bytes) -> tuple[SecuredDocumentHeader, bytes]:
        if data[:4] != MAGIC:
            raise ValueError(
                "Not a secured document (missing magic marker). "
                "Was this file encrypted by DocumentCrypto?"
            )
        header_len = struct.unpack(">I", data[4:8])[0]
        header_end = 8 + header_len
        header_dict = json.loads(data[8:header_end].decode())
        header = SecuredDocumentHeader.from_dict(header_dict)
        encrypted_blob = data[header_end:]
        return header, encrypted_blob

    @staticmethod
    def _load_or_generate_private_key(pem_str: str | None) -> RSAPrivateKey:
        if pem_str:
            # Allow literal \n in env var value
            pem_bytes = pem_str.replace("\\n", "\n").encode()
            return serialization.load_pem_private_key(pem_bytes, password=None)  # type: ignore[return-value]

        warnings.warn(
            "DOCUMENT_SIGNING_PRIVATE_KEY not set — generating ephemeral RSA key. "
            "Run scripts/generate_keys.py and add the keys to your .env for production.",
            stacklevel=3,
        )
        return rsa.generate_private_key(public_exponent=65537, key_size=2048)

    @staticmethod
    def _load_or_generate_aes_key(hex_str: str | None) -> bytes:
        if hex_str:
            key = bytes.fromhex(hex_str.strip())
            if len(key) != 32:
                raise ValueError(
                    f"DOCUMENT_ENCRYPTION_KEY must be 32 bytes (64 hex chars), got {len(key)} bytes."
                )
            return key

        warnings.warn(
            "DOCUMENT_ENCRYPTION_KEY not set — generating ephemeral AES key. "
            "Run scripts/generate_keys.py and add the keys to your .env for production.",
            stacklevel=3,
        )
        return secrets.token_bytes(32)

    @staticmethod
    def _compute_fingerprint(public_key: RSAPublicKey) -> str:
        der = public_key.public_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        digest = hashes.Hash(hashes.SHA256())
        digest.update(der)
        return digest.finalize().hex()


# singleton 
_instance: DocumentCrypto | None = None

def get_document_crypto() -> DocumentCrypto:
    """Return the process-level singleton (lazy-initialised)."""
    global _instance
    if _instance is None:
        _instance = DocumentCrypto()
    return _instance