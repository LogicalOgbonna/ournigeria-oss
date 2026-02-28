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

@Module({
  controllers: [
    AdminAuthController,
    AdminConversationsController,
    AdminNotificationsController,
    AdminUsersController,
    AdminSystemController,
    AdminFeedbackController,
  ],
  providers: [
    AdminAuthService,
    AdminConversationsService,
    AdminNotificationsService,
    AdminUsersService,
    AdminSystemService,
    AdminFeedbackService,
  ],
})
export class AdminModule implements OnModuleInit {
  constructor(private authService: AdminAuthService) {}

  async onModuleInit() {
    await this.authService.ensureDefaultAdmin();
  }
}
