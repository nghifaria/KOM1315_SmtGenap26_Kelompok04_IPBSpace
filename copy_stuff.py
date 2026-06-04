from pathlib import Path
import shutil

# =========================================================
# OPTIONAL CONFIG
# =========================================================
#
# Leave empty ("") to input manually in terminal.
# Fill directly if you want auto-run without prompts.
#
# Example:
# SOURCE_ROOT = r"C:\project\backend"
# TARGET_ROOT = r"C:\target\03_Source_Code"
#
# =========================================================

SOURCE_ROOT = ""
TARGET_ROOT = ""

# =========================================================
# ASK PATH IF EMPTY
# =========================================================

if not SOURCE_ROOT:
    SOURCE_ROOT = input(
        "Input SOURCE backend folder path:\n> "
    ).strip().strip('"')

if not TARGET_ROOT:
    TARGET_ROOT = input(
        "\nInput TARGET 03_Source_Code folder path:\n> "
    ).strip().strip('"')

SOURCE_ROOT = Path(SOURCE_ROOT)
TARGET_ROOT = Path(TARGET_ROOT)

# =========================================================
# VALIDATION
# =========================================================

if not SOURCE_ROOT.exists():
    raise FileNotFoundError(
        f"\nSOURCE ROOT NOT FOUND:\n{SOURCE_ROOT}"
    )

# =========================================================
# RESET TARGET ROOT
# (keep README.md)
# =========================================================
TARGET_ROOT.mkdir(parents=True, exist_ok=True)

for item in TARGET_ROOT.iterdir():

    # keep README.md
    if item.name.lower() == "readme.md":
        continue

    if item.is_dir():
        shutil.rmtree(item)

    else:
        item.unlink()


# =========================================================
# MAPPING
# =========================================================
#
# backend/
# -> cryptography implementation
#
# database/
# -> db schema + hashing/salting
#
# digital_signature/
# -> authentication + non-repudiation
#
# =========================================================

MAPPINGS = {

    # =====================================================
    # BACKEND
    # =====================================================

    "backend": [

        "app/core/crypto.py",

        "app/storage/encrypted_document_storage.py",
        "app/storage/document_storage.py",
        "app/storage/local_document_storage.py",
        "app/storage/factory.py",

        "tests/test_crypto.py",
    ],

    # =====================================================
    # DATABASE
    # =====================================================

    "database": [

        "app/core/database.py",

        # hashing/salting
        "app/core/security.py",

        "app/models",
        "app/schemas",
    ],

    # =====================================================
    # DIGITAL SIGNATURE
    # =====================================================

    "digital_signature": [

        "app/routers/auth_router.py",
        "app/services/auth_service.py",

        "app/schemas/auth.py",
        "app/schemas/token.py",

        "app/api/dependencies.py",

        "scripts/generate_keys.py",
    ]
}

# =========================================================
# IGNORE RULES
# =========================================================

IGNORE_PATTERNS = shutil.ignore_patterns(
    "__pycache__",
    "*.pyc",
    ".pytest_cache",
    ".env",
    "uploads"
)

# =========================================================
# COPY FUNCTION
# =========================================================

def copy_item(src: Path, dst: Path):

    if src.is_dir():

        shutil.copytree(
            src,
            dst,
            dirs_exist_ok=True,
            ignore=IGNORE_PATTERNS
        )

    else:

        dst.parent.mkdir(
            parents=True,
            exist_ok=True
        )

        shutil.copy2(src, dst)

# =========================================================
# EXECUTE COPY
# =========================================================

for category, items in MAPPINGS.items():

    category_root = TARGET_ROOT / category

    print(f"\n=== {category.upper()} ===")

    for item in items:

        src = SOURCE_ROOT / item

        if not src.exists():
            print(f"[NOT FOUND] {item}")
            continue

        dst = category_root / item

        copy_item(src, dst)

        print(f"[COPIED] {item}")

print("\nDONE yea")