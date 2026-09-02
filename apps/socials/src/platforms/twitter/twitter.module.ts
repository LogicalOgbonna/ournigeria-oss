import { Module } from "@nestjs/common";
import { TwitterAdapter } from "./twitter.adapter.js";
import { TwitterPublisher } from "./twitter.publisher.js";
import { XTokenRepo } from "./x-token.repo.js";
import { XOauthService } from "./x-oauth.service.js";
import { RoamerModule } from "./roamer/roamer.module.js";
import { InboxModule } from "./inbox/inbox.module.js";
import { AdminAuthGuard } from "./guards/admin-auth.guard.js";
import { PermissionsGuard } from "./guards/permissions.guard.js";
import { RoamerIngestGuard } from "./guards/roamer-ingest.guard.js";
import { AuditWriterService } from "../../audit/audit-writer.service.js";
import { SessionsController } from "./controllers/sessions.controller.js";
import { TopicsController } from "./controllers/topics.controller.js";
import { RoamController } from "./controllers/roam.controller.js";
import { InboxController } from "./controllers/inbox.controller.js";
import { XOauthController } from "./controllers/x-oauth.controller.js";

@Module({
  imports: [RoamerModule, InboxModule],
  providers: [
    XTokenRepo,
    XOauthService,
    TwitterAdapter,
    TwitterPublisher,
    AdminAuthGuard,
    PermissionsGuard,
    RoamerIngestGuard,
    AuditWriterService,
  ],
  controllers: [
    SessionsController,
    TopicsController,
    RoamController,
    InboxController,
    XOauthController,
  ],
  exports: [
    TwitterAdapter,
    TwitterPublisher,
    XTokenRepo,
    RoamerModule,
    AdminAuthGuard,
    PermissionsGuard,
    AuditWriterService,
  ],
})
export class TwitterModule {}
