import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { redactSecrets } from "@ournigeria/access";
import { AuditService } from "./audit.service";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Safety net (spec §8.2): any admin-authenticated mutation that did NOT log
 * explicitly (via auditActorFromRequest marking req.__audited) gets a generic
 * event. Records the ATTEMPT (route + redacted body), not the outcome — a net
 * for missed instrumentation, not a substitute for explicit service-layer
 * logging. Registered as APP_INTERCEPTOR; non-admin requests pass untouched.
 */
@Injectable()
export class AuditBackstopInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();
    const req = context.switchToHttp().getRequest();
    if (!MUTATING.has(req.method)) return next.handle();

    const emit = (outcome: "ok" | "error") => {
      // adminId appears only after AdminGuard ran; re-read at response time.
      if (!req.adminId || req.__audited) return;
      const path: string = req.route?.path ?? req.originalUrl ?? req.url ?? "";
      void this.audit.logBestEffort(
        {
          actorType: "staff",
          actorId: req.adminId,
          ip: (req.ip ?? null)?.slice(0, 64) ?? null,
          userAgent:
            typeof req.headers?.["user-agent"] === "string"
              ? req.headers["user-agent"].slice(0, 400)
              : null,
        },
        {
          action: `admin.${req.method.toLowerCase()}`.slice(0, 60),
          targetType: "route",
          targetId: path.slice(0, 200),
          metadata: {
            backstop: true,
            outcome,
            body: redactSecrets(req.body ?? null),
          },
        },
      );
    };

    return next.handle().pipe(
      tap({
        next: () => emit("ok"),
        error: () => emit("error"),
      }),
    );
  }
}
