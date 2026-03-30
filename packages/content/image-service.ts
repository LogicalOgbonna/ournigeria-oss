/**
 * Image Service — programmatic entry point for rendering content images.
 *
 * Used by apps/socials to generate infographic PNGs from structured data.
 */

import { renderFaacAllocation, type FaacAllocationInput } from "./templates/faac-allocation.js";

export type { FaacAllocationInput } from "./templates/faac-allocation.js";

export async function renderFaacAllocationImage(
  data: Omit<FaacAllocationInput, "type">,
): Promise<Buffer> {
  return renderFaacAllocation({ type: "faac-allocation", ...data });
}
