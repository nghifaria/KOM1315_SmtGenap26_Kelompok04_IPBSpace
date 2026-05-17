"""create_bookings_table

Revision ID: c41a9dbbb001
Revises: 2d4a9b6f1c2e
Create Date: 2026-05-02 22:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c41a9dbbb001"
down_revision: Union[str, Sequence[str], None] = "2d4a9b6f1c2e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("facility_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("purpose", sa.String(), nullable=False),
        sa.Column("number_of_attendees", sa.Integer(), nullable=False),
        sa.Column("document_url", sa.String(), nullable=False),
        sa.Column("fee", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(), server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["facility_id"], ["facilities.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_bookings_id"), "bookings", ["id"], unique=False)
    op.create_index(op.f("ix_bookings_facility_id"), "bookings", ["facility_id"], unique=False)
    op.create_index(op.f("ix_bookings_user_id"), "bookings", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_bookings_user_id"), table_name="bookings")
    op.drop_index(op.f("ix_bookings_facility_id"), table_name="bookings")
    op.drop_index(op.f("ix_bookings_id"), table_name="bookings")
    op.drop_table("bookings")
