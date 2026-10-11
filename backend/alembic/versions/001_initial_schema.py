"""Initial schema for users, files, and file_shares

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-11 20:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. Files table
    op.create_table(
        'files',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('owner_id', sa.String(length=36), nullable=False),
        sa.Column('original_filename', sa.String(length=255), nullable=False),
        sa.Column('storage_key', sa.String(length=255), nullable=False),
        sa.Column('content_type', sa.String(length=120), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('checksum', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_files_id'), 'files', ['id'], unique=False)
    op.create_index(op.f('ix_files_owner_id'), 'files', ['owner_id'], unique=False)
    op.create_index(op.f('ix_files_storage_key'), 'files', ['storage_key'], unique=True)

    # 3. File Shares table
    op.create_table(
        'file_shares',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('file_id', sa.String(length=36), nullable=False),
        sa.Column('owner_id', sa.String(length=36), nullable=False),
        sa.Column('recipient_id', sa.String(length=36), nullable=False),
        sa.Column('permission', sa.String(length=20), nullable=False, server_default='read'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['file_id'], ['files.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['owner_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('file_id', 'recipient_id', name='uq_file_recipient')
    )
    op.create_index(op.f('ix_file_shares_id'), 'file_shares', ['id'], unique=False)
    op.create_index(op.f('ix_file_shares_file_id'), 'file_shares', ['file_id'], unique=False)
    op.create_index(op.f('ix_file_shares_owner_id'), 'file_shares', ['owner_id'], unique=False)
    op.create_index(op.f('ix_file_shares_recipient_id'), 'file_shares', ['recipient_id'], unique=False)
    op.create_index(op.f('ix_file_shares_revoked_at'), 'file_shares', ['revoked_at'], unique=False)


def downgrade() -> None:
    op.drop_table('file_shares')
    op.drop_table('files')
    op.drop_table('users')
