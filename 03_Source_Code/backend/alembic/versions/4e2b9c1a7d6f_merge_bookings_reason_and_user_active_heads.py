"""merge bookings reason and user active heads

Revision ID: 4e2b9c1a7d6f
Revises: 3773da7af4a7, b8f1f7b6a9c4
Create Date: 2026-05-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '4e2b9c1a7d6f'
down_revision: Union[str, Sequence[str], None] = ('3773da7af4a7', 'b8f1f7b6a9c4')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Merge branch heads without schema changes."""
    pass


def downgrade() -> None:
    """Split the merge revision back into both branch heads."""
    pass
