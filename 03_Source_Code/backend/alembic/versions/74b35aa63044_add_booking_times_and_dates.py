"""add booking times and dates

Revision ID: 74b35aa63044
Revises: c41a9dbbb001
Create Date: 2026-05-11 17:44:39.395813

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '74b35aa63044'
down_revision: Union[str, Sequence[str], None] = 'c41a9dbbb001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("bookings", sa.Column("date_of_booking", sa.DateTime(timezone=True), nullable=False))
    op.add_column("bookings", sa.Column("start_time", sa.DateTime(timezone=True), nullable=False))
    op.add_column("bookings", sa.Column("end_time", sa.DateTime(timezone=True), nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("bookings", "end_time")
    op.drop_column("bookings", "start_time")
    op.drop_column("bookings", "date_of_booking")
