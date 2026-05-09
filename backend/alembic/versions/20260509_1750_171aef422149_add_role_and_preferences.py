"""add_role_and_preferences

Revision ID: 171aef422149
Revises: e0cb61c69fc6
Create Date: 2026-05-09 17:50:11.407114+00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '171aef422149'
down_revision: Union[str, None] = 'e0cb61c69fc6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Manual refinement: Only add the new columns to the users table
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('role', sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column('preferences', sa.JSON(), server_default='{}', nullable=False))


def downgrade() -> None:
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('preferences')
        batch_op.drop_column('role')
