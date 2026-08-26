/**
 * esbuild alias target for `@nestjs/common` in the bundled enrichment CLIs.
 *
 * The agent container installs only the tools' package.json deps (pg, xlsx,
 * pdf-parse), so a runtime `require("@nestjs/common")` crashes on boot. The
 * only value the bundled graph pulls from Nest is `BadRequestException`
 * (creatable.registry payload validation); inside the CLIs its HTTP semantics
 * are irrelevant — callers just catch and print the message. The real Nest
 * class still serves the API path (this shim exists only inside the bundles).
 *
 * If a future import drags anything else out of @nestjs/common, esbuild fails
 * the build with a missing-export error — extend the shim deliberately.
 */
export class BadRequestException extends Error {
  constructor(message?: unknown) {
    super(typeof message === "string" ? message : JSON.stringify(message));
    this.name = "BadRequestException";
  }

  getStatus(): number {
    return 400;
  }

  getResponse(): unknown {
    return { statusCode: 400, message: this.message, error: "Bad Request" };
  }
}
