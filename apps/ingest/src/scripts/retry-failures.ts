#!/usr/bin/env npx tsx

import * as dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import mime from 'mime-types';

const MIME_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.xlsx':
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.json': 'application/json',
  '.md': 'text/markdown',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.txt': 'text/plain',
};

interface UploadFailure {
  s3Key: string;
  localPath: string;
  error: string;
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  return (
    MIME_MAP[ext] ||
    mime.lookup(filename) ||
    'application/octet-stream'
  );
}

function extractMetadata(
  s3Key: string,
): Record<string, string> {
  const parts = s3Key.split('/');
  const folder = parts[0];
  const ext = path.extname(s3Key).slice(1) || 'unknown';
  const metadata: Record<string, string> = {
    'source-type': ext,
  };

  switch (folder) {
    case 'budgets':
      metadata['pipeline'] = 'budget';
      if (parts[1]) metadata['state'] = parts[1];
      if (parts[2]) metadata['year'] = parts[2];
      break;
    case 'corruption':
      metadata['pipeline'] = 'corruption';
      if (parts[1]) metadata['official'] = parts[1];
      break;
    case 'govspend':
      metadata['pipeline'] = 'govspend';
      if (parts[1]) metadata['year'] = parts[1];
      break;
    default:
      metadata['pipeline'] = folder;
      break;
  }

  return metadata;
}

async function main() {
  const failuresFile =
    process.argv[2] ||
    path.resolve(
      process.cwd(),
      'upload-failures-govspend.json',
    );

  if (!fs.existsSync(failuresFile)) {
    console.error(`File not found: ${failuresFile}`);
    process.exit(1);
  }

  const failures: UploadFailure[] = JSON.parse(
    fs.readFileSync(failuresFile, 'utf-8'),
  );

  if (failures.length === 0) {
    console.log('No failures to retry.');
    return;
  }

  console.log(`Retrying ${failures.length} failed uploads...`);

  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION;

  if (!bucket || !region || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('Missing required env vars: S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
    process.exit(1);
  }

  const s3 = new S3Client({
    region,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const stillFailing: UploadFailure[] = [];

  for (const entry of failures) {
    if (!fs.existsSync(entry.localPath)) {
      console.error(`  SKIP (not found): ${entry.localPath}`);
      stillFailing.push({ ...entry, error: 'local file not found' });
      continue;
    }

    try {
      const stat = fs.statSync(entry.localPath);
      const body = fs.createReadStream(entry.localPath);
      const contentType = getContentType(entry.localPath);
      const metadata = extractMetadata(entry.s3Key);

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: entry.s3Key,
          Body: body,
          ContentLength: stat.size,
          ContentType: contentType,
          Metadata: metadata,
        }),
      );

      console.log(`  OK: ${entry.s3Key}`);
    } catch (err: any) {
      const msg = err.message || String(err);
      console.error(`  FAIL: ${entry.s3Key} — ${msg}`);
      stillFailing.push({ ...entry, error: msg });
    }
  }

  console.log(`\nDone: ${failures.length - stillFailing.length}/${failures.length} succeeded`);

  if (stillFailing.length > 0) {
    fs.writeFileSync(failuresFile, JSON.stringify(stillFailing, null, 2));
    console.log(`${stillFailing.length} still failing — updated ${failuresFile}`);
    process.exit(1);
  } else {
    fs.unlinkSync(failuresFile);
    console.log(`All succeeded — removed ${failuresFile}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
