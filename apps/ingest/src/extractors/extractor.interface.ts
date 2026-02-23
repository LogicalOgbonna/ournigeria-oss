export interface ExtractContext {
  /** Additional metadata passed to extractors that need it (e.g. JSON flattener) */
  [key: string]: unknown;
}

export interface ITextExtractor {
  readonly supportedTypes: string[];
  extract(filePath: string, context?: ExtractContext): Promise<string>;
}
