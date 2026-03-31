import { Module } from "@nestjs/common";
import { TwitterAdapter } from "./twitter.adapter.js";
import { TwitterListener } from "./twitter.listener.js";
import { TwitterPublisher } from "./twitter.publisher.js";

@Module({
  providers: [TwitterAdapter, TwitterListener, TwitterPublisher],
  exports: [TwitterAdapter, TwitterListener, TwitterPublisher],
})
export class TwitterModule {}
