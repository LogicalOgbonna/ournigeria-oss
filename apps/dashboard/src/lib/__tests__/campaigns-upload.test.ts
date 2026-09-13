import { beforeEach, describe, expect, it, vi } from "vitest";
import { uploadAsset, type XhrLike } from "../campaigns";

type FireKind = "load" | "error" | "abort";

/**
 * Minimal XHR double: records what was sent, lets the test drive
 * progress/completion. `auto: false` sends nothing on its own so a test can
 * interleave an abort or an error with the in-flight PUT and then `fire()` it.
 */
function fakeXhr({ status = 200, auto = true }: { status?: number; auto?: boolean } = {}) {
  const listeners: Record<string, ((e: unknown) => void)[]> = {};
  const uploadListeners: Record<string, ((e: unknown) => void)[]> = {};
  const fire = (kind: FireKind) => listeners[kind]?.forEach((fn) => fn({}));
  const xhr = {
    opened: null as null | { method: string; url: string },
    headers: {} as Record<string, string>,
    body: null as unknown,
    status,
    fire,
    /** Real XHR dispatches an `abort` event when aborted; so does this. */
    abort: vi.fn(() => fire("abort")),
    upload: {
      addEventListener: (k: string, fn: (e: unknown) => void) =>
        (uploadListeners[k] ??= []).push(fn),
    },
    addEventListener: (k: string, fn: (e: unknown) => void) =>
      (listeners[k] ??= []).push(fn),
    open(method: string, url: string) {
      this.opened = { method, url };
    },
    setRequestHeader(k: string, v: string) {
      this.headers[k] = v;
    },
    send(body: unknown) {
      this.body = body;
      if (!auto) return;
      uploadListeners.progress?.forEach((fn) =>
        fn({ lengthComputable: true, loaded: 5, total: 10 }),
      );
      fire("load");
    },
  };
  return xhr as unknown as XhrLike & typeof xhr;
}

describe("uploadAsset", () => {
  const file = new File([new Uint8Array(10)], "poster.png", {
    type: "image/png",
  });
  const presign = vi.fn(async () => ({
    uploadUrl: "https://bucket.test/staging/c/u?sig=1",
    stagingKey: "staging/c/u",
    expiresAt: "2030-01-01T00:00:00Z",
    maxBytes: 15_000_000,
  }));

  beforeEach(() => {
    presign.mockClear();
  });

  it("presigns, PUTs with the signed headers, reports progress, then commits with the staging key", async () => {
    const xhr = fakeXhr();
    const commit = vi.fn(async (stagingKey: string) => ({
      id: "m1",
      stagingKey,
    }));
    const progress: number[] = [];
    const out = await uploadAsset({
      file,
      kind: "image",
      presign,
      commit,
      onProgress: (p) => progress.push(p),
      xhr: () => xhr,
    });
    expect(presign).toHaveBeenCalledWith({
      kind: "image",
      contentType: "image/png",
      size: 10,
    });
    expect(xhr.opened).toEqual({
      method: "PUT",
      url: "https://bucket.test/staging/c/u?sig=1",
    });
    expect(xhr.headers["Content-Type"]).toBe("image/png");
    expect(xhr.body).toBe(file);
    expect(progress).toEqual([0, 0.5, 1]);
    expect(commit).toHaveBeenCalledWith("staging/c/u");
    expect(out).toEqual({ id: "m1", stagingKey: "staging/c/u" });
  });

  it("rejects before presigning when the file type or size is not acceptable", async () => {
    const svg = new File(["<svg/>"], "x.svg", { type: "image/svg+xml" });
    await expect(
      uploadAsset({
        file: svg,
        kind: "image",
        presign,
        commit: vi.fn(),
        xhr: () => fakeXhr(),
      }),
    ).rejects.toThrow(/jpeg, png, webp/);
    const big = new File([new Uint8Array(16 * 1024 * 1024)], "big.png", {
      type: "image/png",
    });
    await expect(
      uploadAsset({
        file: big,
        kind: "image",
        presign,
        commit: vi.fn(),
        xhr: () => fakeXhr(),
      }),
    ).rejects.toThrow(/15 MB/);
    expect(presign).toHaveBeenCalledTimes(0);
  });

  it("rejects a PDF over the 50 MB document limit before presigning", async () => {
    const big = new File([new Uint8Array(51 * 1024 * 1024)], "manifesto.pdf", {
      type: "application/pdf",
    });
    await expect(
      uploadAsset({
        file: big,
        kind: "pdf",
        presign,
        commit: vi.fn(),
        xhr: () => fakeXhr(),
      }),
    ).rejects.toThrow(/50 MB/);
    expect(presign).toHaveBeenCalledTimes(0);
  });

  it("surfaces a failed PUT as an error naming the status and never commits", async () => {
    const xhr = fakeXhr({ status: 403 });
    const commit = vi.fn();
    await expect(
      uploadAsset({ file, kind: "image", presign, commit, xhr: () => xhr }),
    ).rejects.toThrow(/403/);
    expect(commit).not.toHaveBeenCalled();
  });

  it("surfaces a network failure as an error and never commits", async () => {
    const xhr = fakeXhr({ auto: false });
    const commit = vi.fn();
    const p = uploadAsset({ file, kind: "image", presign, commit, xhr: () => xhr });
    await vi.waitFor(() => expect(xhr.opened).not.toBeNull());
    xhr.fire("error");
    await expect(p).rejects.toThrow(/network/);
    expect(commit).not.toHaveBeenCalled();
  });

  it("does not presign or open an XHR when the signal is already aborted", async () => {
    const xhr = fakeXhr();
    const commit = vi.fn();
    await expect(
      uploadAsset({
        file,
        kind: "image",
        presign,
        commit,
        xhr: () => xhr,
        signal: AbortSignal.abort(),
      }),
    ).rejects.toThrow(/cancelled/i);
    expect(presign).toHaveBeenCalledTimes(0);
    expect(xhr.opened).toBeNull();
    expect(commit).not.toHaveBeenCalled();
  });

  it("aborts the in-flight PUT when the signal fires mid-upload", async () => {
    const xhr = fakeXhr({ auto: false });
    const commit = vi.fn();
    const controller = new AbortController();
    const p = uploadAsset({
      file,
      kind: "image",
      presign,
      commit,
      xhr: () => xhr,
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(xhr.opened).not.toBeNull());
    controller.abort();
    await expect(p).rejects.toThrow(/cancelled/i);
    expect(xhr.abort).toHaveBeenCalledTimes(1);
    expect(commit).not.toHaveBeenCalled();
  });
});
