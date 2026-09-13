import { BadRequestException } from "@nestjs/common";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { assertSafeUrl, fetchOnce, isPublicAddress, safeFetchBytes, vetHost } from "../safe-fetch";

describe("safe-fetch address policy", () => {
  it.each([
    ["127.0.0.1", false],
    ["10.1.2.3", false],
    ["172.16.0.1", false],
    ["172.31.255.255", false],
    ["172.32.0.1", true],
    ["192.168.1.1", false],
    ["169.254.169.254", false],
    ["100.64.0.1", false],
    ["100.127.255.255", false],
    ["100.128.0.1", true],
    ["0.0.0.0", false],
    ["224.0.0.1", false],
    ["255.255.255.255", false],
    ["198.18.0.1", false],
    ["192.88.99.1", false],
    ["::1", false],
    ["::", false],
    ["fe80::1", false],
    ["fc00::1", false],
    ["fd12:3456::1", false],
    ["fec0::1", false],
    ["ff02::1", false],
    ["::ffff:127.0.0.1", false],
    ["::ffff:10.0.0.1", false],
    // ALL of ::ffff:0:0/96 is blocked, deliberately fail-closed: real image
    // hosts resolve to A records (plain IPv4), so only hand-written SSRF
    // literals ever arrive IPv4-mapped.
    ["::ffff:8.8.8.8", false],
    ["::7f00:1", false], // ::/96 IPv4-compatible loopback
    ["2002:a9fe:a9fe::1", false], // 6to4-wrapped link-local
    ["2001:0:a9fe:a9fe::1", false], // Teredo
    ["2001:db8::1", false],
    ["64:ff9b::808:808", false],
    ["8.8.8.8", true],
    ["2606:4700::1111", true],
    ["not-an-ip", false],
  ])("%s public=%s", (ip, expected) => {
    expect(isPublicAddress(ip)).toBe(expected);
  });

  it("rejects non-http schemes, non-default ports and credentials", () => {
    expect(() => assertSafeUrl("file:///etc/passwd")).toThrow(/http/);
    expect(() => assertSafeUrl("ftp://example.com/x.png")).toThrow(/http/);
    expect(() => assertSafeUrl("http://example.com:8080/x.png")).toThrow(/port/);
    expect(() => assertSafeUrl("https://user:pw@example.com/x.png")).toThrow(/credentials/);
    expect(() => assertSafeUrl("not a url")).toThrow(/invalid/);
    expect(() => assertSafeUrl("https://example.com/x.png")).not.toThrow();
    expect(() => assertSafeUrl("https://example.com:443/x.png")).not.toThrow();
  });

  it("vets literal addresses without a DNS round trip", async () => {
    await expect(vetHost("169.254.169.254")).rejects.toThrow(/private/);
    await expect(vetHost("[::1]")).rejects.toThrow(/private/);
    await expect(vetHost("8.8.8.8")).resolves.toBe("8.8.8.8");
  });
});

/**
 * Regression: the URL parser canonicalises IPv6 literals, so a policy written
 * against textual prefixes (e.g. matching a dotted quad inside `::ffff:`) never
 * sees production input — `[::ffff:169.254.169.254]` arrives as
 * `[::ffff:a9fe:a9fe]`. These drive the real entry points.
 */
describe("IPv6 literal SSRF payloads (canonicalised by the URL parser)", () => {
  const payloads = [
    "http://[::ffff:a9fe:a9fe]/x", // IPv4-mapped metadata service
    "http://[::ffff:127.0.0.1]/x", // IPv4-mapped loopback
    "http://[::ffff:0a00:0001]/x", // IPv4-mapped 10.0.0.1, written in hex
    "http://[2002:a9fe:a9fe::1]/x", // 6to4-wrapped 169.254.169.254
    "http://[fec0::1]/x", // site-local
    "http://[::7f00:1]/x", // IPv4-compatible loopback
    "http://[2001:0:a9fe:a9fe::1]/x", // Teredo
  ];

  it.each(payloads)("assertSafeUrl(%s).hostname is rejected by vetHost", async (raw) => {
    // The literal survives assertSafeUrl (scheme/port/credentials are fine) —
    // it must die at the address policy.
    await expect(vetHost(assertSafeUrl(raw).hostname)).rejects.toThrow(/private/);
  });

  it.each(payloads)("safeFetchBytes(%s) never connects", async (raw) => {
    await expect(safeFetchBytes(raw, 1e6)).rejects.toThrow(/private/);
  });

  it("still allows a real public IPv6 literal", async () => {
    expect(assertSafeUrl("http://[2606:4700::1111]/x").hostname).toBe("[2606:4700::1111]");
    await expect(vetHost("[2606:4700::1111]")).resolves.toBe("2606:4700::1111");
  });
});

describe("local-server transport suite", () => {
  let server: http.Server;
  let port: number;
  const timers = new Set<NodeJS.Timeout>();

  const url = (path: string) => new URL(`http://127.0.0.1:${port}${path}`);
  const soon = () => Date.now() + 5_000;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === "/big") {
        // Chunked, no content-length: the declared-size check can't help here,
        // the running byte total has to.
        res.writeHead(200, { "content-type": "image/png" });
        for (let i = 0; i < 4; i++) res.write(Buffer.alloc(512, 1));
        res.end();
        return;
      }
      if (req.url === "/redirect") {
        res.writeHead(302, { location: "/ok" });
        res.end();
        return;
      }
      if (req.url === "/bad-redirect") {
        res.writeHead(302, { location: "///" });
        res.end();
        return;
      }
      if (req.url === "/boom") {
        res.writeHead(500);
        res.end("nope");
        return;
      }
      if (req.url === "/slow") {
        // One byte every 100 ms, never ends: the socket never goes idle, so only
        // a wall-clock deadline can stop it.
        const t = setInterval(() => res.write(Buffer.alloc(1, 1)), 100);
        timers.add(t);
        res.on("close", () => {
          clearInterval(t);
          timers.delete(t);
        });
        res.writeHead(200, { "content-type": "image/png" });
        return;
      }
      res.writeHead(200, { "content-type": "image/png" });
      res.end(Buffer.from("PNGDATA"));
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    for (const t of timers) clearInterval(t);
    timers.clear();
    server.closeAllConnections();
    await new Promise<void>((r) => server.close(() => r()));
  });

  describe("safeFetchBytes", () => {
    it("never connects to a loopback host, even before the port check would matter", async () => {
      // Loopback + non-default port: the address policy rejects it first.
      await expect(safeFetchBytes(`http://127.0.0.1:${port}/ok`, 1e6)).rejects.toThrow(/port|private/);
      // Default port, loopback literal — rejected by the address policy, nothing is fetched.
      await expect(safeFetchBytes("http://127.0.0.1/ok", 1e6)).rejects.toThrow(/private/);
      // localhost resolves to loopback — rejected after the single DNS lookup.
      await expect(safeFetchBytes("http://localhost/ok", 1e6)).rejects.toThrow(/private/);
    });

    it("rejects the cloud metadata address", async () => {
      await expect(safeFetchBytes("http://169.254.169.254/latest/meta-data/", 1e6)).rejects.toThrow(/private/);
    });
  });

  /**
   * `fetchOnce` is the post-vetting half: it assumes `address` was already
   * vetted, which is what lets these exercise the transport against loopback.
   */
  describe("fetchOnce", () => {
    it("returns the body on 200", async () => {
      const out = await fetchOnce(url("/ok"), "127.0.0.1", 1e6, soon());
      expect(out).toEqual({ kind: "body", bytes: Buffer.from("PNGDATA") });
    });

    it("caps the body when content-length is absent/lying", async () => {
      await expect(fetchOnce(url("/big"), "127.0.0.1", 1024, soon())).rejects.toThrow(/exceeds/);
    });

    it("resolves a relative redirect Location to an absolute URL", async () => {
      const out = await fetchOnce(url("/redirect"), "127.0.0.1", 1e6, soon());
      expect(out).toEqual({ kind: "redirect", location: `http://127.0.0.1:${port}/ok` });
    });

    it("maps a non-200 to a BadRequestException naming the status", async () => {
      await expect(fetchOnce(url("/boom"), "127.0.0.1", 1e6, soon())).rejects.toThrow(/HTTP 500/);
    });

    it("maps an unparsable redirect Location to a BadRequestException", async () => {
      // `new URL("///", base)` throws; the caller must never see the raw TypeError.
      await expect(fetchOnce(url("/bad-redirect"), "127.0.0.1", 1e6, soon())).rejects.toThrow(BadRequestException);
      await expect(fetchOnce(url("/bad-redirect"), "127.0.0.1", 1e6, soon())).rejects.toThrow(/could not fetch/);
    });

    it("maps a transport failure to a BadRequestException", async () => {
      // Port 1 on loopback: connection refused, not a raw ECONNREFUSED escape.
      await expect(fetchOnce(new URL("http://127.0.0.1:1/x"), "127.0.0.1", 1e6, soon())).rejects.toThrow(
        /could not fetch image source/,
      );
    });

    it("enforces the wall-clock deadline on a slow trickle body", async () => {
      await expect(fetchOnce(url("/slow"), "127.0.0.1", 1e6, Date.now() + 300)).rejects.toThrow(/timed out/);
    });

    it("refuses to start a hop once the deadline has passed", async () => {
      await expect(fetchOnce(url("/ok"), "127.0.0.1", 1e6, Date.now() - 1)).rejects.toThrow(/timed out/);
    });
  });
});

describe("ImageStorageService.isStoredUrl compares origins", () => {
  it("accepts CDN, virtual-hosted and path-style bucket URLs; rejects look-alikes", async () => {
    const { ImageStorageService } = await import("../image-storage.service");
    const { ObjectStorageService } = await import("../../storage/object-storage.service");
    const { resolveStorageConfig } = await import("../../storage/storage.config");
    const registry = new ObjectStorageService(
      resolveStorageConfig({ S3_BUCKET: "ournigeria-documents", AWS_REGION: "eu-west-1", AWS_ACCESS_KEY_ID: "x", AWS_SECRET_ACCESS_KEY: "y", CDN_BASE_URL: "https://cdn.ournigeria.ng" }),
    );
    const svc = new ImageStorageService(registry.for("images"), registry);
    expect(svc.isStoredUrl("https://cdn.ournigeria.ng/officials/a/b-600.webp")).toBe(true);
    expect(svc.isStoredUrl("https://ournigeria-documents.s3.eu-west-1.amazonaws.com/officials/x.webp")).toBe(true);
    expect(svc.isStoredUrl("https://s3.eu-west-1.amazonaws.com/ournigeria-documents/officials/x.webp")).toBe(true);
    expect(svc.isStoredUrl("https://cdn.ournigeria.ng.evil.com/x.webp")).toBe(false);
    expect(svc.isStoredUrl("https://evil.com/ournigeria-documents/x.webp")).toBe(false);
    expect(svc.isStoredUrl("https://evil.com/?u=https://cdn.ournigeria.ng/x")).toBe(false);
    expect(svc.isStoredUrl("javascript:alert(1)")).toBe(false);
    expect(svc.isStoredUrl("not a url")).toBe(false);
  });
});
