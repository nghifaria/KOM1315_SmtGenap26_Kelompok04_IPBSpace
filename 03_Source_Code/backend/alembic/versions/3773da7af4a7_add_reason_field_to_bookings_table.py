"""add reason field to bookings table

Revision ID: 3773da7af4a7
Revises: d7a872011525
Create Date: 2026-05-18 19:02:58.441161

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3773da7af4a7'
down_revision: Union[str, Sequence[str], None] = 'd7a872011525'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('bookings', sa.Column('reason', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('bookings', 'reason')
