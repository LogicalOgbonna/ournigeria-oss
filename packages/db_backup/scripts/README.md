# DB Backup Scripts

## Download backup from S3

Downloads a database backup from the `db_backup/` prefix in S3.

### Prerequisites

- AWS CLI installed (`brew install awscli`)
- Infisical CLI installed (`brew install infisical`)
- Logged in to Infisical (`infisical login`)

### Usage

From the `packages/db_backup` directory:

```bash
# List available backups and choose one interactively
infisical run --env=prod -- ./scripts/download-backup-from-s3.sh

# Download a specific backup directly
infisical run --env=prod -- ./scripts/download-backup-from-s3.sh 2026-03-04_234951_post-data-recovery.sql.gz
```

The file will be saved to `packages/db_backup/backups/`.

### Restore after download

```bash
./restore.sh 2026-03-04_234951_post-data-recovery.sql.gz
```
