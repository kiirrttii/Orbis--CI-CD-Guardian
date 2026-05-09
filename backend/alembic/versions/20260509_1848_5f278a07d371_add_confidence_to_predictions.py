"""add confidence to predictions

Revision ID: 5f278a07d371
Revises: 6750f5001fd4
Create Date: 2026-05-09 18:48:36.260286+00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5f278a07d371'
down_revision: Union[str, None] = '6750f5001fd4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('predictions', sa.Column('confidence', sa.Float(), nullable=False, server_default='0.0'))
    op.add_column('predictions', sa.Column('confidence_level', sa.String(length=20), nullable=False, server_default='LOW'))


def downgrade() -> None:
    op.drop_column('predictions', 'confidence_level')
    op.drop_column('predictions', 'confidence')
