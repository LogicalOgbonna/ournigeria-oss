import { Module, OnModuleInit } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { TelegramModule } from "../telegram/telegram.module";
import { setPermissionDenialLogger } from "../admin/permissions.guard";
import { AuditService } from "./audit.service";
import { AuditCryptoService } from "./audit-crypto.service";
import { AuditAlertService } from "./audit-alert.service";
import { AuditQueryService } from "./audit-query.service";
import { AuditVerifyService } from "./audit-verify.service";
import { AuditAnchorService } from "./audit-anchor.service";
import { AuditBackstopInterceptor } from "./audit-backstop.interceptor";
import { AuditController } from "./audit.controller";

@Module({
  imports: [TelegramModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditCryptoService,
    AuditAlertService,
    AuditQueryService,
    AuditVerifyService,
    AuditAnchorService,
    { provide: APP_INTERCEPTOR, useClass: AuditBackstopInterceptor },
  ],
  exports: [AuditService, AuditCryptoService, AuditAlertService],
})
export class AuditModule implements OnModuleInit {
  constructor(private readonly audit: AuditService) {}

  onModuleInit(): void {
    // PermissionsGuard is instantiated by class reference (only globals
    // injectable) — denial events reach the chain through this hook.
    setPermissionDenialLogger((info) => {
      void this.audit.logBestEffort(
        {
          actorType: "staff",
          actorId: info.adminId,
          ip: info.ip ?? null,
          userAgent: info.userAgent ?? null,
        },
        {
          action: "access.denied",
          targetType: "route",
          targetId: `${info.method} ${info.path}`.slice(0, 200),
          metadata: { needed: info.needed },
        },
      );
    });
  }
}
