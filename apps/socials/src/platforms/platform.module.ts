import { Module } from "@nestjs/common";
import { TwitterModule } from "./twitter/twitter.module.js";

@Module({
  imports: [TwitterModule],
  exports: [TwitterModule],
})
export class PlatformModule {}
