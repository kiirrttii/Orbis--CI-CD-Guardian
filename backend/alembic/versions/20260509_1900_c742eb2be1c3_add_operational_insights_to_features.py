"""add operational insights to features

Revision ID: c742eb2be1c3
Revises: 5f278a07d371
Create Date: 2026-05-09 19:00:30.693901+00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c742eb2be1c3'
down_revision: Union[str, None] = '5f278a07d371'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('feature_contributions', sa.Column('operational_insight', sa.String(length=500), nullable=True))
    # sa.String doesn't need length for some dialects but let's be safe
    op.add_column('feature_contributions', sa.Column('signal_type', sa.String(length=50), nullable=False, server_default='STABLE'))


def downgrade() -> None:
    op.drop_column('feature_contributions', 'signal_type')
    # op.drop_column('feature_contributions', 'operational_insight')
    op.drop_column('feature_contributions', 'operational_insight')
