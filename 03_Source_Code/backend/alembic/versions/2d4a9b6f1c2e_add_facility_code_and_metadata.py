"""add facility code and metadata

Revision ID: 2d4a9b6f1c2e
Revises: 0c6bd514b90e
Create Date: 2026-05-02 12:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "2d4a9b6f1c2e"
down_revision: Union[str, Sequence[str], None] = "0c6bd514b90e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None



def upgrade() -> None:
    op.add_column("facilities", sa.Column("code", sa.String(), nullable=True))
    op.add_column("facilities", sa.Column("threshold", sa.Integer(), server_default=sa.text("0"), nullable=False))
    op.add_column("facilities", sa.Column("condition", sa.String(), nullable=True))
    op.add_column("facilities", sa.Column("contact_person", sa.String(), nullable=True))

    op.execute(
        sa.text(
            """
            UPDATE facilities
            SET code = upper(regexp_replace(name, '[^A-Za-z0-9]+', '-', 'g')) || '-' || id
            WHERE code IS NULL OR code = ''
            """
        )
    )

    op.alter_column("facilities", "code", nullable=False)
    op.create_unique_constraint("uq_facilities_code", "facilities", ["code"])


def downgrade() -> None:
    op.drop_constraint("uq_facilities_code", "facilities", type_="unique")
    op.drop_column("facilities", "contact_person")
    op.drop_column("facilities", "condition")
    op.drop_column("facilities", "threshold")
    op.drop_column("facilities", "code")
