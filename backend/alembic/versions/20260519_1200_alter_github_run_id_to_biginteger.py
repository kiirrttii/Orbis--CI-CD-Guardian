"""Alter github_run_id to BigInteger

Revision ID: a6f8b9d3b123
Revises: 65e010b2d904
Create Date: 2026-05-19 12:00:00.000000+00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a6f8b9d3b123'
down_revision: Union[str, None] = '65e010b2d904'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table('workflow_runs', schema=None) as batch_op:
        batch_op.alter_column('github_run_id',
               type_=sa.BigInteger(),
               existing_type=sa.Integer(),
               nullable=False)


def downgrade() -> None:
    with op.batch_alter_table('workflow_runs', schema=None) as batch_op:
        batch_op.alter_column('github_run_id',
               type_=sa.Integer(),
               existing_type=sa.BigInteger(),
               nullable=False)
