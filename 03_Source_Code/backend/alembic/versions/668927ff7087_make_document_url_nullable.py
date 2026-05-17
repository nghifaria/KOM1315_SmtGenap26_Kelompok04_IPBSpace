"""make_document_url_nullable

Revision ID: 668927ff7087
Revises: 74b35aa63044
Create Date: 2026-05-12 03:08:58.011379

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '668927ff7087'
down_revision: Union[str, Sequence[str], None] = '74b35aa63044'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column('bookings', 'document_url',
               existing_type=sa.VARCHAR(),
               nullable=True)


def downgrade() -> None:
    op.alter_column('bookings', 'document_url',
               existing_type=sa.VARCHAR(),
               nullable=False)
