import { Injectable } from "@nestjs/common";
import { PrismaService } from "@ournigeria/database";

const SINGLETON_ID = 1;

@Injectable()
export class RoamStateRepo {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cross-process claim. Inserts the singleton row if missing or its heartbeat
   * is older than `staleMs`; otherwise leaves the existing row alone.
   * Returns true if this process now owns the loop.
   */
  async claim(pid: number, host: string, staleMs: number): Promise<boolean> {
    const cutoff = new Date(Date.now() - staleMs);
    const now = new Date();

    const result = await this.prisma.$executeRaw`
      INSERT INTO socials_roam_state (id, pid, host, heartbeat_at, alert_no_sessions, alert_no_topics, agent_budget_alert, drafter_backlog_alert)
      VALUES (${SINGLETON_ID}, ${pid}, ${host}, ${now}, false, false, false, false)
      ON CONFLICT (id) DO UPDATE
        SET pid = EXCLUDED.pid,
            host = EXCLUDED.host,
            heartbeat_at = EXCLUDED.heartbeat_at
        WHERE socials_roam_state.heartbeat_at IS NULL
           OR socials_roam_state.heartbeat_at < ${cutoff};
    `;

    if (result === 0) return false;

    const row = await this.prisma.socialsRoamState.findUnique({
      where: { id: SINGLETON_ID },
    });
    return row?.pid === pid && row?.host === host;
  }

  async heartbeat(pid: number) {
    await this.prisma.$executeRaw`
      UPDATE socials_roam_state SET heartbeat_at = ${new Date()}
      WHERE id = ${SINGLETON_ID} AND pid = ${pid};
    `;
  }

  async release(pid: number) {
    await this.prisma.$executeRaw`
      DELETE FROM socials_roam_state WHERE id = ${SINGLETON_ID} AND pid = ${pid};
    `;
  }

  get() {
    return this.prisma.socialsRoamState.findUnique({
      where: { id: SINGLETON_ID },
    });
  }

  async setAlertNoSessions(value: boolean) {
    await this.upsertSingleton({ alertNoSessions: value });
  }
  async setAlertNoTopics(value: boolean) {
    await this.upsertSingleton({ alertNoTopics: value });
  }
  async setAgentBudgetAlert(value: boolean) {
    await this.upsertSingleton({ agentBudgetAlert: value });
  }
  async setDrafterBacklogAlert(value: boolean) {
    await this.upsertSingleton({ drafterBacklogAlert: value });
  }

  private async upsertSingleton(data: {
    alertNoSessions?: boolean;
    alertNoTopics?: boolean;
    agentBudgetAlert?: boolean;
    drafterBacklogAlert?: boolean;
  }) {
    await this.prisma.socialsRoamState.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...data },
      update: data,
    });
  }
}
