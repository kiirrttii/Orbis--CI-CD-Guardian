"""add interpretation to feature contributions

Revision ID: 176aacae34c9
Revises: 171aef422149
Create Date: 2026-05-09 18:24:04.727460+00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '176aacae34c9'
down_revision: Union[str, None] = '171aef422149'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('feature_contributions', sa.Column('interpretation', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('feature_contributions', 'interpretation')
