"""restore operational insights to features

Revision ID: 84a4fd0d6d90
Revises: c742eb2be1c3
Create Date: 2026-05-09 19:11:35.604974+00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '84a4fd0d6d90'
down_revision: Union[str, None] = 'c742eb2be1c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('feature_contributions')]
    
    if 'operational_insight' not in columns:
        op.add_column('feature_contributions', sa.Column('operational_insight', sa.String(length=500), nullable=True))
    if 'signal_type' not in columns:
        op.add_column('feature_contributions', sa.Column('signal_type', sa.String(length=50), nullable=False, server_default='STABLE'))


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('feature_contributions')]
    
    if 'signal_type' in columns:
        op.drop_column('feature_contributions', 'signal_type')
    if 'operational_insight' in columns:
        op.drop_column('feature_contributions', 'operational_insight')
