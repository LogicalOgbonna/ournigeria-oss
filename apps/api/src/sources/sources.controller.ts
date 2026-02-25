import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { Response } from "express";
import { resolve, normalize, join, dirname, basename } from "path";
import { existsSync } from "fs";

/**
 * Walk up from the current directory until we find `packages/source`.
 * Works whether cwd is the monorepo root or apps/api/.
 */
function findSourcesRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = resolve(dir, "packages/source");
    if (existsSync(candidate)) return candidate;
    dir = resolve(dir, "..");
  }
  // Final fallback — assume monorepo root
  return resolve(process.cwd(), "packages/source");
}

const SOURCES_ROOT = findSourcesRoot();

@Controller("sources")
export class SourcesController {
  @Get("download")
  download(@Query("path") filePath: string, @Res() res: Response) {
    if (!filePath) {
      throw new BadRequestException("Missing path query parameter");
    }

    const normalized = normalize(filePath);
    if (normalized.includes("..")) {
      throw new BadRequestException("Invalid path");
    }

    // Directory parts may have spaces that map to underscores on disk
    // (e.g. "Akwa Ibom" → "Akwa_Ibom"), but filenames keep their original form
    const dir = dirname(normalized)
      .split("/")
      .map((seg) => seg.replaceAll(" ", "_"))
      .join("/");
    const file = basename(normalized);
    const diskPath = join(dir, file);

    const absolute = resolve(SOURCES_ROOT, diskPath);
    if (!absolute.startsWith(SOURCES_ROOT)) {
      throw new BadRequestException("Invalid path");
    }

    if (!existsSync(absolute)) {
      throw new NotFoundException("File not found");
    }

    return res.download(absolute, file);
  }
}
