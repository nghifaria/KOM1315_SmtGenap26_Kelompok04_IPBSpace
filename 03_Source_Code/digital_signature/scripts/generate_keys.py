"""
Generate a fresh RSA-2048 signing key pair and a 256-bit AES encryption key
for the DocumentCrypto service.
 
Usage
─────
    python scripts/generate_keys.py
 
Output
──────
Prints the three .env lines you need to add:
 
    DOCUMENT_SIGNING_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\\n...
    DOCUMENT_SIGNING_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\\n...
    DOCUMENT_ENCRYPTION_KEY=<64 hex chars>
 
The public key is for reference / verification only — it is not read by
the application (it is re-derived from the private key at startup).
 
Security notes
──────────────
• Keep DOCUMENT_SIGNING_PRIVATE_KEY and DOCUMENT_ENCRYPTION_KEY secret.
• Back them up securely — losing them means you cannot decrypt existing docs.
• Rotate keys with care: after rotation old files need re-encryption.
  See EncryptedDocumentStorage.strict_verification for migration support.
"""


import secrets

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def pem_to_env(pem: str) -> str:
    return pem.strip().replace("\n", "\\n")


private_key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)

public_key = private_key.public_key()

private_pem = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.TraditionalOpenSSL,
    encryption_algorithm=serialization.NoEncryption(),
).decode()

public_pem = public_key.public_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PublicFormat.SubjectPublicKeyInfo,
).decode()

aes_key = secrets.token_bytes(32).hex()

print(f"DOCUMENT_SIGNING_PRIVATE_KEY={pem_to_env(private_pem)}")
print(f"DOCUMENT_SIGNING_PUBLIC_KEY={pem_to_env(public_pem)}")
print(f"DOCUMENT_ENCRYPTION_KEY={aes_key}")
print("DOCUMENT_CRYPTO_ENABLED=true")
print("DOCUMENT_CRYPTO_STRICT=true")