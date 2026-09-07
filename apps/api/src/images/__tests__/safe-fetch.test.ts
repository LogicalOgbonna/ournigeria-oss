import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { assertSafeUrl, isPublicAddress, safeFetchBytes, vetHost } from "../safe-fetch";

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
    ["::1", false],
    ["::", false],
    ["fe80::1", false],
    ["fc00::1", false],
    ["fd12:3456::1", false],
    ["ff02::1", false],
    ["::ffff:127.0.0.1", false],
    ["::ffff:10.0.0.1", false],
    ["::ffff:8.8.8.8", true],
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

describe("safeFetchBytes against a local server", () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      if (req.url === "/big") {
        res.writeHead(200, { "content-type": "image/png" });
        res.end(Buffer.alloc(2048, 1));
        return;
      }
      res.writeHead(200, { "content-type": "image/png" });
      res.end(Buffer.from("PNGDATA"));
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    await new Promise<void>((r) => server.close(() => r()));
  });

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
