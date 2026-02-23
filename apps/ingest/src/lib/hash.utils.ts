import * as crypto from 'node:crypto';
import * as fs from 'node:fs';

export function fileHash(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}
