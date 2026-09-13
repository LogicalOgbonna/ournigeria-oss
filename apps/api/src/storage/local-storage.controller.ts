import { BadRequestException, Controller, ForbiddenException, Get, NotFoundException, PayloadTooLargeException, Put, Req, Res } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { Public } from "../auth/decorators/public";
import { isSafeKey } from "./local-object-store";
import { STAGING_PREFIX } from "./object-store";
import { ObjectStorageService } from "./object-storage.service";

/**
 * Dev-only backing for `LocalObjectStore`: serves stored objects and accepts
 * the browser's presigned PUT (signature over key/type/size/expiry). Only
 * registered when a storage domain resolves to `local`, which
 * `resolveStorageConfig` refuses in production.
 */
@ApiExcludeController()
@Controller("storage/local")
export class LocalStorageController {
  constructor(private readonly storage: ObjectStorageService) {}

  private store() {
    const s = this.storage.localStore();
    if (!s) throw new NotFoundException();
    return s;
  }

  @Public()
  @Get("*path")
  async get(@Req() req: Request, @Res() res: Response) {
    const store = this.store();
    const key = keyFromRequest(req);
    // Staged bytes are unvalidated; the commit path reads them from disk, never
    // over HTTP. In S3 they are private objects — keep that property here.
    if (key.startsWith(STAGING_PREFIX)) throw new NotFoundException();
    const meta = await store.readMeta(key);
    if (!meta) throw new NotFoundException();
    // helmet defaults CORP to same-origin, which makes the browser refuse to
    // embed these objects as <img> from the dashboard/web/awanaija origins.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Content-Type", meta.contentType);
    if (meta.cacheControl) res.setHeader("Cache-Control", meta.cacheControl);
    if (meta.contentDisposition) res.setHeader("Content-Disposition", meta.contentDisposition);
    res.send(await store.get(key));
  }

  @Public()
  @Put("*path")
  async put(@Req() req: Request, @Res() res: Response) {
    const store = this.store();
    const key = keyFromRequest(req);
    const q = req.query as Record<string, string | undefined>;
    const params = { exp: q.exp ?? "", size: q.size ?? "", type: q.type ?? "", sig: q.sig ?? "" };
    if (!store.verifyPresign(key, params)) throw new ForbiddenException("upload URL is invalid or expired");
    const declared = Number(params.size);
    const contentType = (req.headers["content-type"] ?? "").split(";")[0].trim();
    if (contentType !== params.type) throw new BadRequestException(`content-type must be ${params.type}`);
    const lengthHeader = req.headers["content-length"];
    if (lengthHeader === undefined || Number(lengthHeader) !== declared) throw new BadRequestException(`content-length must be ${declared}`);
    // A global body parser (json/urlencoded) may already have drained the
    // stream; waiting on "end" would then hang the request forever.
    if (req.readableEnded || req.complete) throw new BadRequestException(`content-type ${contentType} is parsed by the API and cannot be uploaded here`);
    const body = await readBody(req, declared);
    await store.put(key, body, { contentType });
    res.status(200).send();
  }
}

function keyFromRequest(req: Request): string {
  const raw = (req.params as Record<string, string | string[] | undefined>).path;
  const key = Array.isArray(raw) ? raw.join("/") : (raw ?? "");
  if (!isSafeKey(key)) throw new BadRequestException("invalid object key");
  return key;
}

function readBody(req: Request, max: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (c: Buffer) => {
      total += c.length;
      if (total > max) {
        req.destroy();
        reject(new PayloadTooLargeException(`body exceeds declared size ${max}`));
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      if (body.length !== max) reject(new BadRequestException(`body is ${body.length} bytes, declared ${max}`));
      else resolve(body);
    });
    req.on("error", reject);
  });
}
