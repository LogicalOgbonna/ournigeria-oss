import { Module } from "@nestjs/common";
import { TwitterModule } from "./twitter/twitter.module.js";
import { Neo4jService } from "./neo4j.service.js";

@Module({
  imports: [TwitterModule],
  providers: [Neo4jService],
  exports: [TwitterModule, Neo4jService],
})
export class PlatformModule {}
