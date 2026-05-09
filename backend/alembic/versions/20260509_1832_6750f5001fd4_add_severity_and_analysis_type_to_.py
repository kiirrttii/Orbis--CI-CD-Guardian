"""add severity and analysis_type to predictions

Revision ID: 6750f5001fd4
Revises: 176aacae34c9
Create Date: 2026-05-09 18:32:22.014846+00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6750f5001fd4'
down_revision: Union[str, None] = '176aacae34c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('predictions', sa.Column('severity', sa.String(length=20), nullable=False, server_default='LOW'))
    op.add_column('predictions', sa.Column('analysis_type', sa.String(length=50), nullable=False, server_default='manual'))


def downgrade() -> None:
    op.drop_column('predictions', 'analysis_type')
    op.drop_column('predictions', 'severity')
