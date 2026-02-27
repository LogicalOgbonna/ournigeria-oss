import { MDocument } from '@mastra/rag';

const MAX_CHUNK_INPUT_SIZE = 150_000;

/**
 * Strip characters that PostgreSQL cannot store in JSON/text columns.
 * Specifically, \u0000 (null byte) causes: "unsupported Unicode escape sequence".
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/\0/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F]/g, '')
    .replace(/[\u200B\u200C\u200D\uFEFF]/g, '');
}

/**
 * Chunk text safely, splitting into segments first if the text is too large
 * for the recursive chunker (which can blow the call stack on 100MB+ inputs).
 */
export async function safeChunk(
  text: string,
  maxSize: number,
  overlap: number,
): Promise<string[]> {
  if (text.length <= MAX_CHUNK_INPUT_SIZE) {
    const doc = MDocument.fromText(text);
    const chunks = await doc.chunk({
      strategy: 'recursive',
      maxSize,
      overlap,
    });
    return chunks.map((c) => (typeof c === 'string' ? c : c.text));
  }

  // Pre-split into segments at newline boundaries to keep each under the limit
  const segments: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = start + MAX_CHUNK_INPUT_SIZE;
    if (end < text.length) {
      const newlinePos = text.lastIndexOf('\n', end);
      if (newlinePos > start) {
        end = newlinePos + 1;
      }
    } else {
      end = text.length;
    }
    segments.push(text.slice(start, end));
    start = end;
  }

  console.log(
    `    Text too large (${text.length} chars), split into ${segments.length} segments for chunking`,
  );

  const allChunks: string[] = [];
  for (const segment of segments) {
    const doc = MDocument.fromText(segment);
    const chunks = await doc.chunk({
      strategy: 'recursive',
      maxSize,
      overlap,
    });
    allChunks.push(
      ...chunks.map((c) => (typeof c === 'string' ? c : c.text)),
    );
  }
  return allChunks;
}
