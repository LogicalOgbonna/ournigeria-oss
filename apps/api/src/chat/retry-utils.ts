/** Errors that are worth retrying (transient LLM capacity issues). */
export function isRetryableLLMError(err: any): boolean {
  const status = err?.statusCode ?? err?.cause?.statusCode;
  const msg = typeof err?.message === "string" ? err.message : "";
  return (
    status === 402 ||
    status === 429 ||
    (status >= 500 && status < 600) ||
    msg.includes("more credits") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNRESET")
  );
}
