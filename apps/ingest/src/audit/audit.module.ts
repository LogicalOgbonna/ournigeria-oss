import { Global, Module } from "@nestjs/common";
import { AuditWriterService } from "./audit-writer.service";

/** Global so feature modules (e.g. IngestionModule) can inject the writer. */
@Global()
@Module({
  providers: [AuditWriterService],
  exports: [AuditWriterService],
})
export class AuditModule {}
