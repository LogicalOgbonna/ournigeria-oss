import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

// The inbox poller reuses the roamer's proven cross-process leader-election
// pattern, but on a SEPARATE singleton row (id=2) in the same socials_roam_state
// table. It MUST NOT share the roamer's id=1 row, or the two loops would fight
// for one lock and only one could ever run.
const INBOX_SINGLETON_ID = 2;

@Injectable()
export class InboxStateRepo {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cross-process claim. Inserts the id=2 row if missing or its heartbeat is
   * older than `staleMs`; otherwise leaves the current owner alone. Returns true
   * if this process now owns the inbox loop.
   */
  async claim(pid: number, host: string, staleMs: number): Promise<boolean> {
    const cutoff = new Date(Date.now() - staleMs);
    const now = new Date();

    const result = await this.prisma.$executeRaw`
      INSERT INTO socials_roam_state (id, pid, host, heartbeat_at, alert_no_sessions, alert_no_topics, agent_budget_alert, drafter_backlog_alert)
      VALUES (${INBOX_SINGLETON_ID}, ${pid}, ${host}, ${now}, false, false, false, false)
      ON CONFLICT (id) DO UPDATE
        SET pid = EXCLUDED.pid,
            host = EXCLUDED.host,
            heartbeat_at = EXCLUDED.heartbeat_at
        WHERE socials_roam_state.heartbeat_at IS NULL
           OR socials_roam_state.heartbeat_at < ${cutoff};
    `;

    if (result === 0) return false;

    const row = await this.prisma.socialsRoamState.findUnique({
      where: { id: INBOX_SINGLETON_ID },
    });
    return row?.pid === pid && row?.host === host;
  }

  async heartbeat(pid: number) {
    await this.prisma.$executeRaw`
      UPDATE socials_roam_state SET heartbeat_at = ${new Date()}
      WHERE id = ${INBOX_SINGLETON_ID} AND pid = ${pid};
    `;
  }

  async release(pid: number) {
    await this.prisma.$executeRaw`
      DELETE FROM socials_roam_state WHERE id = ${INBOX_SINGLETON_ID} AND pid = ${pid};
    `;
  }

  get() {
    return this.prisma.socialsRoamState.findUnique({
      where: { id: INBOX_SINGLETON_ID },
    });
  }
}
