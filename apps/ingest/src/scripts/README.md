# Ingest Scripts

## upload-to-s3.ts

Uploads selected folders from `packages/source/` to the `ournigeria-documents` S3 bucket, preserving directory structure as S3 key prefixes.

### Prerequisites

1. **S3 bucket** created (e.g., `ournigeria-documents`)
2. **IAM credentials** with `s3:PutObject`, `s3:GetObject`, `s3:ListBucket`, `s3:HeadObject` permissions
3. **Environment variables** in `apps/ingest/.env`:

```env
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=ournigeria-documents
```

### Usage

```bash
# From the repo root:
npx tsx apps/ingest/src/scripts/upload-to-s3.ts --<folder> [--<folder>...] [options]

# Or using the package.json script (from apps/ingest/):
pnpm upload-to-s3 --<folder> [options]
```

### Folder Flags

Pass one or more folder names that correspond to subdirectories of `packages/source/`:

| Flag                     | Contents                         | Files   | Size   |
| ------------------------ | -------------------------------- | ------- | ------ |
| `--budgets`              | 37 state budget documents        | ~959    | 3.8 GB |
| `--corruption`           | Corruption case artifacts        | ~86     | 13 MB  |
| `--corruption_discarded` | Archived corruption files        | ~281    | small  |
| `--govspend`             | Government spending records      | ~891K   | 3.5 GB |

Any new subdirectory added to `packages/source/` is automatically available as a flag.

### Options

| Option              | Default | Description                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| `--concurrency <n>` | 10      | Number of parallel uploads                           |
| `--dry-run`         | off     | Preview files and S3 keys without uploading          |
| `--verify-only`     | off     | Compare S3 object counts/sizes against local files   |

### Examples

```bash
# Show usage and available folders
npx tsx apps/ingest/src/scripts/upload-to-s3.ts

# Dry run - see what would be uploaded
npx tsx apps/ingest/src/scripts/upload-to-s3.ts --budgets --dry-run

# Upload corruption folder (small, good for testing)
npx tsx apps/ingest/src/scripts/upload-to-s3.ts --corruption

# Upload budgets and corruption together
npx tsx apps/ingest/src/scripts/upload-to-s3.ts --budgets --corruption

# Upload govspend with higher concurrency
npx tsx apps/ingest/src/scripts/upload-to-s3.ts --govspend --concurrency 50

# Verify a previous upload matches local files
npx tsx apps/ingest/src/scripts/upload-to-s3.ts --budgets --verify-only
```

### Idempotency / Skip Logic

Before uploading each folder, the script fetches all existing S3 keys under that prefix via `ListObjectsV2` (paginated). A file is **skipped** if:

- The S3 key already exists, AND
- The S3 object size matches the local file size

This makes the script safe to re-run after interruption. Already-uploaded files are not re-uploaded.

### Dry-Run Mode

With `--dry-run`, the script:

- Walks the local directory and builds the file manifest
- Prints the first 20 files with their S3 keys, content types, and metadata
- Shows a file type breakdown
- Does **not** make any S3 API calls

### Verify-Only Mode

With `--verify-only`, the script:

- Lists all S3 objects under each folder prefix
- Compares against local file count and sizes
- Reports missing files and size mismatches
- Does **not** upload anything

### S3 Key Structure

Local paths are mirrored directly, stripping the `packages/source/` prefix:

```
Local:  packages/source/budgets/Lagos/2024/appropriation-bill.pdf
S3 Key: budgets/Lagos/2024/appropriation-bill.pdf
```

### Metadata

Each uploaded object gets `x-amz-meta-*` headers parsed from its path:

- **budgets/**: `pipeline=budget`, `state`, `year`, `source-type`
- **corruption/**: `pipeline=corruption`, `official`, `source-type`
- **govspend/**: `pipeline=govspend`, `year`, `source-type`

### Content Types

MIME types are set per file extension (PDF, XLSX, DOCX, JSON, MD, HTML, PNG, JPG, etc.). Unknown extensions fall back to `application/octet-stream`.

### Error Handling

- Each file upload is wrapped in try/catch - failures don't abort the run
- Failed files are collected and written to `upload-failures-<folder>.json` in the repo root
- The AWS SDK v3 has built-in retry with exponential backoff (3 retries)
- The script exits with code 1 if any files failed

### Recommended Upload Order

1. `--corruption` (86 files, 13 MB) - quick sanity check
2. `--budgets` (959 files, 3.8 GB) - primary dataset
3. `--govspend --concurrency 50` (891K files, 3.5 GB) - large volume, run separately

### Skipped Files

The script automatically skips:

- Hidden files and directories (`.DS_Store`, `.git`, etc.)
- Root-level config files (`package.json`, `project.json`, `tsconfig.json`)
