import { Module } from "@nestjs/common";
import { ImageGeneratorService } from "./image-generator.js";
import { PlatformModule } from "../platforms/platform.module.js";

@Module({
  imports: [PlatformModule],
  providers: [ImageGeneratorService],
  exports: [ImageGeneratorService],
})
export class ContentModule {}
