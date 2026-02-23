export interface DiscoveredFile {
  filePath: string;
  sourceType: string;
  identity: Record<string, unknown>;
}

export interface PipelineConfig {
  chunkSize: number;
  chunkOverlap: number;
  batchSize: number;
  concurrency: number;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  chunkSize: 512,
  chunkOverlap: 50,
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
