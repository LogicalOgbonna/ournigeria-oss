export interface DiscoveredFile {
  filePath: string;
  sourceType: string;
  identity: Record<string, unknown>;
  s3Key?: string;
  s3Etag?: string;
}

export interface PipelineConfig {
  chunkSize: number;
  chunkOverlap: number;
  batchSize: number;
  concurrency: number;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  chunkSize: 1024,
  chunkOverlap: 100,
  batchSize: 50,
  concurrency: 5,
};

export interface PipelineResult {
  pipeline: string;
  totalFiles: number;
  processedFiles: number;
  skippedFiles: number;
  errorFiles: number;
  totalChunks: number;
  durationMs: number;
}
