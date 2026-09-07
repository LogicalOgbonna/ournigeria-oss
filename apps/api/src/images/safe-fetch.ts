import { BadRequestException } from "@nestjs/common";
import { promises as dns } from "node:dns";
import http from "node:http";
import https from "node:https";
import { isIP } from "node:net";

/**
 * Server-side fetch for URLs an admin pasted (image sources). Threat: an
 * attacker-controlled hostname that resolves to the OCI metadata service or a
 * Tailscale-only internal box, or that rebinds between our check and the
 * connect. Policy:
 *   - http(s) only, default ports only, no credentials in the URL
 *   - resolve ONCE, reject private / loopback / link-local / CGNAT / multicast /
 *     reserved / IPv4-mapped / NAT64 addresses
 *   - connect to that vetted address by overriding the socket `lookup`, so the
 *     hostname is never resolved a second time (no rebinding window); Host and
 *     SNI keep the hostname
 *   - at most MAX_REDIRECTS hops, each vetted the same way, scheme stays http(s)
 *   - body capped at `maxBytes`, TIMEOUT_MS per hop
 *
 * Implemented on node:http/https (no undici dependency) so the pruned
 * production API image needs nothing new.
 */

export const MAX_REDIRECTS = 3;
export const TIMEOUT_MS = 15_000;

function v4ToInt(ip: string): number {
  return ip.split(".").reduce((acc, o) => ((acc << 8) + Number(o)) >>> 0, 0) >>> 0;
}

function inCidr(ip: string, cidr: string): boolean {
  const [base, bits] = cidr.split("/");
  const n = Number(bits);
  const mask = n === 0 ? 0 : (0xffffffff << (32 - n)) >>> 0;
  return ((v4ToInt(ip) & mask) >>> 0) === ((v4ToInt(base) & mask) >>> 0);
}

/** RFC 1918/6598/3927/5737/1122/5771/1112 and friends. */
const PRIVATE_V4 = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.0.2.0/24",
  "192.168.0.0/16",
  "198.18.0.0/15",
  "198.51.100.0/24",
  "203.0.113.0/24",
  "224.0.0.0/4",
  "240.0.0.0/4",
];

export function isPublicAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return !PRIVATE_V4.some((c) => inCidr(ip, c));
  if (family !== 6) return false;
  const lower = ip.toLowerCase();
  const mapped = lower.match(/^(?:0*:)*ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPublicAddress(mapped[1]);
  if (lower === "::" || lower === "::1") return false;
  if (/^fe[89ab][0-9a-f]:/.test(lower)) return false; // link-local fe80::/10
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return false; // unique local fc00::/7
  if (lower.startsWith("ff")) return false; // multicast
  if (lower.startsWith("64:ff9b:")) return false; // NAT64
  if (lower.startsWith("2001:db8:")) return false; // documentation
  return true;
}

export function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new BadRequestException("invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BadRequestException("only http(s) URLs are allowed");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new BadRequestException("non-default ports are not allowed");
  }
  if (url.username || url.password) {
    throw new BadRequestException("credentials in URLs are not allowed");
  }
  return url;
}

/** Resolve once and vet. Returns the address to connect to. */
export async function vetHost(hostname: string): Promise<string> {
  const bare = hostname.replace(/^\[|\]$/g, "");
  let address: string;
  if (isIP(bare)) {
    address = bare;
  } else {
    try {
      address = (await dns.lookup(bare)).address;
    } catch {
      throw new BadRequestException("could not resolve image host");
    }
  }
  if (!isPublicAddress(address)) {
    throw new BadRequestException("URL resolves to a private address");
  }
  return address;
}

function requestOnce(url: URL, address: string): Promise<http.IncomingMessage> {
  const mod = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = mod.request(
      url,
      {
        method: "GET",
        headers: { "user-agent": "OurNigeriaBot/1.0 (+https://ournigeria.ng)", accept: "image/*,*/*;q=0.5" },
        timeout: TIMEOUT_MS,
        // Pin the connection to the vetted address; Host/SNI stay the hostname.
        lookup: (_host, options, cb) => {
          const family = isIP(address) as 4 | 6;
          if (options && typeof options === "object" && "all" in options && options.all) {
            (cb as (err: null, addrs: { address: string; family: number }[]) => void)(null, [{ address, family }]);
          } else {
            (cb as (err: null, address: string, family: number) => void)(null, address, family);
          }
        },
      },
      resolve,
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    req.end();
  });
}

/** Fetch `raw` under the policy above. Returns the body bytes, or throws BadRequestException. */
export async function safeFetchBytes(raw: string, maxBytes: number): Promise<Buffer> {
  let url = assertSafeUrl(raw);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const address = await vetHost(url.hostname);
    let res: http.IncomingMessage;
    try {
      res = await requestOnce(url, address);
    } catch {
      throw new BadRequestException("could not fetch image source");
    }
    const status = res.statusCode ?? 0;
    if (status >= 300 && status < 400 && res.headers.location) {
      res.resume();
      url = assertSafeUrl(new URL(res.headers.location, url).toString());
      continue;
    }
    if (status !== 200) {
      res.resume();
      throw new BadRequestException(`could not fetch image (HTTP ${status})`);
    }
    const declared = Number(res.headers["content-length"] ?? 0);
    if (declared > maxBytes) {
      res.destroy();
      throw new BadRequestException(`image exceeds ${maxBytes} bytes`);
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of res) {
      const buf = chunk as Buffer;
      size += buf.length;
      if (size > maxBytes) {
        res.destroy();
        throw new BadRequestException(`image exceeds ${maxBytes} bytes`);
      }
      chunks.push(buf);
    }
    return Buffer.concat(chunks);
  }
  throw new BadRequestException("too many redirects");
}
