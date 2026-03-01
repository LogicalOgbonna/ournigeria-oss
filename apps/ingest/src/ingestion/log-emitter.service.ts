import { Injectable } from "@nestjs/common";
import { EventEmitter } from "node:events";

export interface LogEntry {
  timestamp: string;
  level: "log" | "warn" | "error";
  message: string;
  runId: string;
  pipeline: string;
}

@Injectable()
export class LogEmitterService {
  private readonly emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  emit(entry: LogEntry) {
    this.emitter.emit(`run:${entry.runId}`, entry);
  }

  subscribe(runId: string, listener: (entry: LogEntry) => void) {
    this.emitter.on(`run:${runId}`, listener);
  }

  unsubscribe(runId: string, listener: (entry: LogEntry) => void) {
    this.emitter.off(`run:${runId}`, listener);
  }
}
