import { BadRequestException } from "@nestjs/common";
import { promises as dns } from "node:dns";
import http from "node:http";
import https from "node:https";
import { BlockList, isIP } from "node:net";

/**
 * Server-side fetch for URLs an admin pasted (image sources). Threat: an
 * attacker-controlled hostname that resolves to the OCI metadata service or a
 * Tailscale-only internal box, or that rebinds between our check and the
 * connect. Policy:
 *   - http(s) only, default ports only, no credentials in the URL
 *   - resolve ONCE, reject private / loopback / link-local / CGNAT / multicast /
 *     reserved / IPv4-mapped / NAT64 / 6to4 / Teredo addresses
 *   - connect to that vetted address by overriding the socket `lookup`, so the
 *     hostname is never resolved a second time (no rebinding window); Host and
 *     SNI keep the hostname
 *   - at most MAX_REDIRECTS hops, each vetted the same way, scheme stays http(s),
 *     https never downgrades to http
 *   - body capped at `maxBytes`; TIMEOUT_MS is a wall-clock deadline for the
 *     whole fetch (all hops + all body bytes), not a per-hop budget
 *
 * Implemented on node:http/https (no undici dependency) so the pruned
 * production API image needs nothing new.
 */

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 15_000;

/** RFC 1918/6598/3927/5737/1122/5771/1112/3068 and friends. */
const V4_BLOCK = new BlockList();
for (const [net, bits] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24], // 6to4 relay anycast
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  V4_BLOCK.addSubnet(net, bits, "ipv4");
}

/**
 * IPv6 policy is evaluated on the PARSED address, never on the textual form:
 * the WHATWG URL parser canonicalises `[::ffff:169.254.169.254]` to
 * `[::ffff:a9fe:a9fe]`, so any dotted-quad string match is trivially bypassed.
 *
 * `::ffff:0:0/96` (IPv4-mapped) is blocked WHOLESALE on purpose — we fail
 * closed rather than try to re-derive the embedded v4 address. Real image hosts
 * come back from `dns.lookup` as A records (plain IPv4), so nothing legitimate
 * is lost; the only things that arrive here in mapped form are hand-written
 * literals, which is exactly the SSRF payload shape.
 */
const V6_BLOCK = new BlockList();
for (const [net, bits] of [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["::", 96], // IPv4-compatible (deprecated, e.g. ::7f00:1)
  ["::ffff:0:0", 96], // IPv4-mapped
  ["64:ff9b::", 96], // NAT64
  ["fe80::", 10], // link-local
  ["fc00::", 7], // unique local
  ["fec0::", 10], // site-local (deprecated)
  ["ff00::", 8], // multicast
  ["2001:db8::", 32], // documentation
  ["2001::", 32], // Teredo
  ["2002::", 16], // 6to4
] as const) {
  V6_BLOCK.addSubnet(net, bits, "ipv6");
}

export function isPublicAddress(ip: string): boolean {
  const family = isIP(ip);
  if (family === 4) return !V4_BLOCK.check(ip, "ipv4");
  if (family === 6) return !V6_BLOCK.check(ip, "ipv6");
  return false;
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
      // Single-address form on purpose: `dns.lookup` returns exactly one address,
      // and that same address is both what we vet and what we pin the socket to.
      // Asking for `all: true` would open a gap between "an address we approved"
      // and "the address the socket picked".
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

/** Pin the connection to the vetted address; Host/SNI stay the hostname. */
function pinnedLookup(address: string): http.RequestOptions["lookup"] {
  return (_host, options, cb) => {
    const family = isIP(address) as 4 | 6;
    // Node calls back with an array when `autoSelectFamily` (or an explicit
    // `all: true`) is in play — same single vetted address either way.
    if (options && typeof options === "object" && "all" in options && options.all) {
      (cb as (err: null, addrs: { address: string; family: number }[]) => void)(null, [{ address, family }]);
    } else {
      (cb as (err: null, address: string, family: number) => void)(null, address, family);
    }
  };
}

export type FetchOnceResult =
  | { kind: "body"; bytes: Buffer }
  | { kind: "redirect"; location: string };

/**
 * One vetted hop: connect to `address`, read at most `maxBytes`, and either
 * return the body or the absolute redirect target. Exported for tests — the
 * host vetting (and therefore the SSRF policy) lives in `safeFetchBytes`, so
 * this must only ever be called with an address that has already been vetted.
 */
export async function fetchOnce(
  url: URL,
  address: string,
  maxBytes: number,
  deadline: number,
): Promise<FetchOnceResult> {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw new BadRequestException("image fetch timed out");

  const mod = url.protocol === "https:" ? https : http;
  const req = mod.request(url, {
    method: "GET",
    headers: { "user-agent": "OurNigeriaBot/1.0 (+https://ournigeria.ng)", accept: "image/*,*/*;q=0.5" },
    timeout: remaining,
    lookup: pinnedLookup(address),
  });

  // Socket `timeout` only fires on inactivity; this wall-clock guard also kills
  // a slow trickle that never goes idle. Covers headers AND body, cleared below.
  let timedOut = false;
  const guard = setTimeout(() => {
    timedOut = true;
    req.destroy(new Error("deadline exceeded"));
  }, Math.max(1, remaining));

  try {
    const res = await new Promise<http.IncomingMessage>((resolve, reject) => {
      req.on("response", resolve);
      req.on("timeout", () => {
        // `timeout` was set to the remaining budget, so idling it out IS the deadline.
        timedOut = true;
        req.destroy(new Error("timeout"));
      });
      req.on("error", reject);
      req.end();
    }).catch((err: unknown) => {
      if (timedOut) throw new BadRequestException("image fetch timed out");
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException("could not fetch image source");
    });

    const status = res.statusCode ?? 0;

    if (status >= 300 && status < 400 && res.headers.location) {
      res.destroy();
      let location: string;
      try {
        location = new URL(res.headers.location, url).toString();
      } catch {
        throw new BadRequestException("could not fetch image source");
      }
      return { kind: "redirect", location };
    }

    if (status !== 200) {
      res.destroy();
      throw new BadRequestException(`could not fetch image (HTTP ${status})`);
    }

    const declared = Number(res.headers["content-length"] ?? 0);
    if (declared > maxBytes) {
      res.destroy();
      throw new BadRequestException(`image exceeds ${maxBytes} bytes`);
    }

    // A lying/absent content-length is the norm; the running total below is the
    // real cap. Any stream failure here maps to a BadRequestException so callers
    // never see a raw socket error.
    try {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of res) {
        if (Date.now() > deadline) {
          res.destroy();
          throw new BadRequestException("image fetch timed out");
        }
        const buf = chunk as Buffer;
        size += buf.length;
        if (size > maxBytes) {
          res.destroy();
          throw new BadRequestException(`image exceeds ${maxBytes} bytes`);
        }
        chunks.push(buf);
      }
      return { kind: "body", bytes: Buffer.concat(chunks) };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      if (timedOut) throw new BadRequestException("image fetch timed out");
      throw new BadRequestException("could not fetch image source");
    }
  } finally {
    clearTimeout(guard);
  }
}

/** Fetch `raw` under the policy above. Returns the body bytes, or throws BadRequestException. */
export async function safeFetchBytes(raw: string, maxBytes: number): Promise<Buffer> {
  // One wall-clock budget for the whole fetch, so N redirects can't multiply it.
  const deadline = Date.now() + TIMEOUT_MS;
  let url = assertSafeUrl(raw);

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const address = await vetHost(url.hostname);
    const out = await fetchOnce(url, address, maxBytes, deadline);
    if (out.kind === "body") return out.bytes;

    const next = assertSafeUrl(out.location);
    if (url.protocol === "https:" && next.protocol === "http:") {
      throw new BadRequestException("redirect downgrades to http");
    }
    url = next;
  }

  throw new BadRequestException("too many redirects");
}
