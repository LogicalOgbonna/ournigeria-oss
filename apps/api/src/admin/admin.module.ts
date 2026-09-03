import { Module, OnModuleInit } from "@nestjs/common";
import { AdminAuthController } from "./admin-auth.controller";
import { AdminAuthService } from "./admin-auth.service";
import { AdminConversationsController } from "./admin-conversations.controller";
import { AdminConversationsService } from "./admin-conversations.service";
import { AdminNotificationsController } from "./admin-notifications.controller";
import { AdminNotificationsService } from "./admin-notifications.service";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUsersService } from "./admin-users.service";
import { AdminSystemController } from "./admin-system.controller";
import { AdminSystemService } from "./admin-system.service";
import { AdminFeedbackController } from "./admin-feedback.controller";
import { AdminFeedbackService } from "./admin-feedback.service";
import { AdminS3Controller } from "./admin-s3.controller";
import { AdminS3Service } from "./admin-s3.service";
import { AdminVectorsController } from "./admin-vectors.controller";
import { AdminVectorsService } from "./admin-vectors.service";
import { AdminDocumentsController } from "./admin-documents.controller";
import { AdminDocumentsService } from "./admin-documents.service";
import { AdminEvalController } from "./admin-eval.controller";
import { AdminEvalService } from "./admin-eval.service";
import { AdminSettingsController } from "./admin-settings.controller";
import { AdminSettingsService } from "./admin-settings.service";
import { AdminConnectionsController } from "./admin-connections.controller";
import { AdminConnectionsService } from "./admin-connections.service";
import { AdminBackupController } from "./admin-backup.controller";
import { AdminBackupService } from "./admin-backup.service";
import { AuditModule } from "../audit/audit.module";
import { OfficialsModule } from "../officials/officials.module";
import { AuditRevertService } from "./audit-revert.service";
import { AdminAuditRevertController } from "./admin-audit-revert.controller";
import { AdminRolesController } from "./admin-roles.controller";
import { RolesAdminService } from "./roles-admin.service";

@Module({
  imports: [AuditModule, OfficialsModule],
  controllers: [
    AdminAuthController,
    AdminRolesController,
    AdminAuditRevertController,
    AdminConversationsController,
    AdminNotificationsController,
    AdminUsersController,
    AdminSystemController,
    AdminFeedbackController,
    AdminS3Controller,
    AdminVectorsController,
    AdminDocumentsController,
    AdminEvalController,
    AdminSettingsController,
    AdminConnectionsController,
    AdminBackupController,
  ],
  providers: [
    AdminAuthService,
    RolesAdminService,
    AuditRevertService,
    AdminConversationsService,
    AdminNotificationsService,
    AdminUsersService,
    AdminSystemService,
    AdminFeedbackService,
    AdminS3Service,
    AdminVectorsService,
    AdminDocumentsService,
    AdminEvalService,
    AdminSettingsService,
    AdminConnectionsService,
    AdminBackupService,
  ],
})
export class AdminModule implements OnModuleInit {
  constructor(
    private authService: AdminAuthService,
    private settingsService: AdminSettingsService,
    private connectionsService: AdminConnectionsService,
  ) {}

  async onModuleInit() {
    await this.authService.ensureDefaultAdmin();
    await this.settingsService.seedDefaults();
    await this.connectionsService.seedFromSettings();
  }
}
