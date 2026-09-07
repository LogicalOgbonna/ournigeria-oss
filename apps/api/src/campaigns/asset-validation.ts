import { BadRequestException } from "@nestjs/common";

export const IMAGE_MAX_BYTES = 15 * 1024 * 1024;
export const PDF_MAX_BYTES = 50 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export type ImageType = (typeof IMAGE_TYPES)[number];

/** Magic-byte sniff for the four types we accept. SVG is deliberately not one of them. */
export function sniff(bytes: Buffer): ImageType | "application/pdf" | null {
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  // ISO 32000 readers accept up to 1024 bytes of preamble (BOM, printer junk)
  // before the header; some exporters produce it. Match what Acrobat opens.
  if (bytes.subarray(0, Math.min(bytes.length, 1024 + 5)).indexOf("%PDF-", 0, "latin1") !== -1) return "application/pdf";
  return null;
}

export function assertImageBytes(bytes: Buffer, declaredType: string): ImageType {
  if (bytes.length > IMAGE_MAX_BYTES) throw new BadRequestException(`image exceeds ${IMAGE_MAX_BYTES} bytes`);
  const actual = sniff(bytes);
  if (!actual || actual === "application/pdf") throw new BadRequestException("file is not an accepted image (jpeg, png, webp)");
  if (declaredType !== actual) throw new BadRequestException(`declared type ${declaredType} does not match the file (${actual})`);
  return actual;
}

/**
 * The declared type is checked as well as the bytes: the presigned PUT bakes
 * content-type into the signature, so an object whose stored type is not
 * `application/pdf` was signed for something else and must not be served back
 * from a document row (the row sets `Content-Type: application/pdf` blindly).
 */
export function assertPdfBytes(bytes: Buffer, declaredType: string): void {
  if (bytes.length > PDF_MAX_BYTES) throw new BadRequestException(`document exceeds ${PDF_MAX_BYTES} bytes`);
  if (declaredType !== "application/pdf") throw new BadRequestException(`declared type ${declaredType || "(none)"} is not application/pdf`);
  if (sniff(bytes) !== "application/pdf") throw new BadRequestException("file is not a PDF");
}
