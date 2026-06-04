"""
Security Tests — Authorization, Cryptography, JWT (pure unit tests).

Tidak butuh koneksi DB — semua diuji di level unit dengan objek langsung.
Fokus: "apakah security boundary diterapkan dengan benar?"
  • Authorization: role-based access control via ensure_is_admin
  • Cryptography: sign+encrypt / verify+decrypt, deteksi tampering
  • JWT: token type enforcement, rejection token palsu
"""

from __future__ import annotations

import json
import struct

import pytest

from app.api.dependencies import ensure_is_admin
from app.core.crypto import MAGIC, DocumentCrypto
from app.core.security import Security
from app.enums.user_enums import UserRoles
from app.schemas.user import UserResponse

# ===============================================================================
# SECURITY TESTING
# ===============================================================================

_security = Security()


class TestSecurity:

    # -- Authorization ---------------------------------------------------------

    def _user_response(self, role: UserRoles) -> UserResponse:
        return UserResponse(
            id=1, email="u@test.com", fullname="User",
            idnum="0", role=role, is_active=True,
        )

    def test_civitas_cannot_access_admin_endpoint(self):
        """CIVITAS → ensure_is_admin → HTTP 403."""
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            ensure_is_admin(current_user=self._user_response(UserRoles.CIVITAS))
        assert exc.value.status_code == 403

    def test_facility_manager_cannot_access_admin_endpoint(self):
        """FACILITY_MANAGER → ensure_is_admin → HTTP 403."""
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            ensure_is_admin(current_user=self._user_response(UserRoles.FACILITY_MANAGER))
        assert exc.value.status_code == 403

    def test_admin_can_access_admin_endpoint(self):
        """ADMIN → ensure_is_admin → diizinkan (return True)."""
        result = ensure_is_admin(current_user=self._user_response(UserRoles.ADMIN))
        assert result is True

    # -- Cryptography ----------------------------------------------------------

    def test_encrypt_decrypt_round_trip(self):
        """Plaintext → sign_and_encrypt → verify_and_decrypt → kembali ke plaintext."""
        crypto = DocumentCrypto()
        plaintext = b"%PDF-1.4 test dokumen asli"

        secured = crypto.sign_and_encrypt(plaintext, "test.pdf")
        result = crypto.verify_and_decrypt(secured)

        assert result.plaintext == plaintext
        assert result.signature_valid is True
        assert result.error is None

    def test_signature_verification_valid(self):
        """Dokumen yang tidak dimodifikasi → signature_valid True."""
        crypto = DocumentCrypto()
        secured = crypto.sign_and_encrypt(b"isi dokumen", "doc.pdf")
        result = crypto.verify_and_decrypt(secured)

        assert result.signature_valid is True

    def test_tampered_document_fails_verification(self):
        """Dokumen yang dimodifikasi → ValueError (ciphertext rusak)."""
        crypto = DocumentCrypto()
        secured = bytearray(crypto.sign_and_encrypt(b"dokumen asli", "doc.pdf"))
        secured[-10] ^= 0xFF   # korupsi byte di area ciphertext

        with pytest.raises(ValueError):
            crypto.verify_and_decrypt(bytes(secured))

    def test_tampered_signature_detected(self):
        """Signature dirusak tapi ciphertext utuh → signature_valid False."""
        crypto = DocumentCrypto()
        secured = crypto.sign_and_encrypt(b"dokumen asli", "doc.pdf")

        header_len = struct.unpack(">I", secured[4:8])[0]
        header_end = 8 + header_len
        header_dict = json.loads(secured[8:header_end])

        bad_sig = header_dict["signature"]
        header_dict["signature"] = ("B" if bad_sig[0] != "B" else "A") + bad_sig[1:]
        new_header = json.dumps(header_dict, separators=(",", ":")).encode()
        tampered = MAGIC + struct.pack(">I", len(new_header)) + new_header + secured[header_end:]

        result = crypto.verify_and_decrypt(tampered)
        assert result.signature_valid is False

    # -- JWT Security ----------------------------------------------------------

    def test_access_token_cannot_be_used_as_refresh_token(self):
        """Access token punya type='access' → ditolak saat verify_token_type('refresh')."""
        from fastapi import HTTPException
        sec = Security()
        access = sec.create_access_token({"sub": "1", "role": "civitas"})
        payload = sec.decode_token(access)

        with pytest.raises(HTTPException) as exc:
            sec.verify_token_type(payload["type"], "refresh")
        assert exc.value.status_code == 401

    def test_fake_token_rejected(self):
        """Token dengan signature palsu → HTTPException 401."""
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            _security.decode_token("ini.bukan.token")
        assert exc.value.status_code == 401
