"""
PlexIQ v3 Backup System
Handles automatic backups before destructive operations.
Author: Rich Knowles (via Claude-Code)
Safety: Rule #1 - Always backup before deletion.
"""

import json
import shutil
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
import hashlib

from plexiq.config import get_config
from plexiq.logger import get_logger


class BackupManager:
    """
    Manages backups of metadata and operation records.
    Implements retention policies and integrity checking.
    """

    def __init__(self, config=None, logger=None):
        """
        Initialize backup manager.

        Args:
            config: Config instance (uses global if not provided)
            logger: Logger instance (uses global if not provided)
        """
        self.config = config or get_config()
        self.logger = logger or get_logger()
        self.backup_dir = self.config.get('dirs.backup')
        self.backup_dir.mkdir(parents=True, exist_ok=True)

    def create_backup(
        self,
        data: Any,
        backup_type: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Path:
        """
        Create a backup with timestamp and metadata.

        Args:
            data: Data to backup (will be JSON serialized)
            backup_type: Type identifier (e.g., 'deletion_plan', 'metadata')
            metadata: Optional metadata about the backup

        Returns:
            Path to created backup file

        Example:
            >>> backup_manager.create_backup(
            ...     data=items_to_delete,
            ...     backup_type='deletion_plan',
            ...     metadata={'item_count': 10}
            ... )
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f"{backup_type}_{timestamp}.json"
        backup_path = self.backup_dir / backup_filename

        backup_content = {
            'created_at': datetime.now().isoformat(),
            'backup_type': backup_type,
            'metadata': metadata or {},
            'data': data,
        }

        # Add checksum for integrity verification
        data_str = json.dumps(data, sort_keys=True)
        checksum = hashlib.sha256(data_str.encode()).hexdigest()
        backup_content['checksum'] = checksum

        try:
            with open(backup_path, 'w', encoding='utf-8') as f:
                json.dump(backup_content, f, indent=2, default=str)

            self.logger.info(f"Created backup: {backup_filename}")
            self.logger.debug(f"Backup checksum: {checksum[:16]}...")

            return backup_path

        except Exception as e:
            self.logger.error(f"Failed to create backup: {e}")
            raise

    def restore_backup(self, backup_path: Path, verify_checksum: bool = True) -> Dict[str, Any]:
        """
        Restore data from a backup file.

        Args:
            backup_path: Path to backup file
            verify_checksum: Whether to verify data integrity

        Returns:
            Restored backup content

        Raises:
            ValueError: If checksum verification fails
        """
        try:
            with open(backup_path, 'r', encoding='utf-8') as f:
                backup_content = json.load(f)

            if verify_checksum and 'checksum' in backup_content:
                data_str = json.dumps(backup_content['data'], sort_keys=True)
                calculated_checksum = hashlib.sha256(data_str.encode()).hexdigest()

                if calculated_checksum != backup_content['checksum']:
                    raise ValueError(
                        f"Checksum mismatch! Backup may be corrupted. "
                        f"Expected: {backup_content['checksum'][:16]}..., "
                        f"Got: {calculated_checksum[:16]}..."
                    )

                self.logger.debug("Backup integrity verified")

            self.logger.info(f"Restored backup: {backup_path.name}")
            return backup_content

        except Exception as e:
            self.logger.error(f"Failed to restore backup: {e}")
            raise

    def list_backups(
        self,
        backup_type: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        List available backups.

        Args:
            backup_type: Filter by backup type (optional)
            limit: Maximum number of backups to return (most recent first)

        Returns:
            List of backup information dictionaries
        """
        pattern = f"{backup_type}_*.json" if backup_type else "*.json"
        backup_files = sorted(
            self.backup_dir.glob(pattern),
            key=lambda p: p.stat().st_mtime,
            reverse=True
        )

        if limit:
            backup_files = backup_files[:limit]

        backups = []
        for backup_file in backup_files:
            try:
                with open(backup_file, 'r', encoding='utf-8') as f:
                    content = json.load(f)

                backups.append({
                    'path': backup_file,
                    'filename': backup_file.name,
                    'created_at': content.get('created_at'),
                    'backup_type': content.get('backup_type'),
                    'size_bytes': backup_file.stat().st_size,
                    'metadata': content.get('metadata', {}),
                })
            except Exception as e:
                self.logger.warning(f"Could not read backup {backup_file.name}: {e}")

        return backups

    def cleanup_old_backups(self) -> None:
        """
        Remove backups older than retention period.
        Implements Rule #1: Keep audit trail but manage storage.
        """
        retention_days = self.config.get('app.backup_retention_days', 7)
        cutoff_date = datetime.now() - timedelta(days=retention_days)

        deleted_count = 0
        deleted_size = 0

        for backup_file in self.backup_dir.glob('*.json'):
            if backup_file.is_file():
                file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
                if file_time < cutoff_date:
                    try:
                        file_size = backup_file.stat().st_size
                        backup_file.unlink()
                        deleted_count += 1
                        deleted_size += file_size
                        self.logger.debug(f"Deleted old backup: {backup_file.name}")
                    except Exception as e:
                        self.logger.error(f"Failed to delete backup {backup_file.name}: {e}")

        if deleted_count > 0:
            self.logger.info(
                f"Cleaned up {deleted_count} old backup(s), "
                f"freed {deleted_size / 1024:.1f} KB"
            )

    def export_backup(self, backup_path: Path, export_path: Path) -> None:
        """
        Export a backup to a different location.

        Args:
            backup_path: Source backup file
            export_path: Destination path
        """
        try:
            shutil.copy2(backup_path, export_path)
            self.logger.success(f"Exported backup to: {export_path}")
        except Exception as e:
            self.logger.error(f"Failed to export backup: {e}")
            raise

    def create_operation_record(
        self,
        operation: str,
        items: List[Dict[str, Any]],
        dry_run: bool,
        **kwargs
    ) -> Path:
        """
        Create a detailed record of an operation (actual or dry-run).

        Args:
            operation: Operation name (e.g., 'delete', 'archive')
            items: List of items affected
            dry_run: Whether this was a dry-run
            **kwargs: Additional operation metadata

        Returns:
            Path to operation record
        """
        operation_type = f"{operation}_{'dryrun' if dry_run else 'executed'}"

        metadata = {
            'operation': operation,
            'dry_run': dry_run,
            'item_count': len(items),
            **kwargs
        }

        return self.create_backup(
            data=items,
            backup_type=operation_type,
            metadata=metadata
        )
