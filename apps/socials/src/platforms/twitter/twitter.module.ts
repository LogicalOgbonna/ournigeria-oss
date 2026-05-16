import { Module } from "@nestjs/common";
import { TwitterAdapter } from "./twitter.adapter.js";
import { TwitterPublisher } from "./twitter.publisher.js";
import { XTokenRepo } from "./x-token.repo.js";
import { RoamerModule } from "./roamer/roamer.module.js";
import { AdminAuthGuard } from "./guards/admin-auth.guard.js";
import { RoamerIngestGuard } from "./guards/roamer-ingest.guard.js";
import { SessionsController } from "./controllers/sessions.controller.js";
import { TopicsController } from "./controllers/topics.controller.js";
import { RoamController } from "./controllers/roam.controller.js";

@Module({
  imports: [RoamerModule],
  providers: [
    XTokenRepo,
    TwitterAdapter,
    TwitterPublisher,
    AdminAuthGuard,
    RoamerIngestGuard,
  ],
  controllers: [SessionsController, TopicsController, RoamController],
  exports: [TwitterAdapter, TwitterPublisher, XTokenRepo, RoamerModule, AdminAuthGuard],
})
export class TwitterModule {}
