# Audit chain: restore / DR runbook

Spec: `.agent/plans/62.rbac-audit-chain-design.md` §11.

The `audit_events` table is an append-only hash chain, and its head is anchored
externally (S3 `audit-anchors/` + Telegram ops messages, `audit_anchors` table).
**Restoring a pg_dump rewinds the chain head, so the DB will no longer match the
published anchors.** That is not a flaw — it's the system correctly detecting
that history diverged. Do NOT try to "fix" hashes; follow the epoch procedure.

## After any restore of the database

1. Finish the normal restore (`./restore.sh ...`).
2. Note the last **published** anchor (Telegram ops channel or
   `s3://$S3_BUCKET/audit-anchors/`): `{epoch, headSeq, headHash}`.
3. Append a restore marker event — this is the ONLY sanctioned use of the
   reserved action, and it **increments the chain epoch**:

   ```ts
   // one-off script with DATABASE_URL set (tsx):
   import { PrismaClient } from "@prisma/client";
   import { appendAuditEvent, CHAIN_RESTORED_ACTION } from "@ournigeria/access";
   const prisma = new PrismaClient();
   await prisma.$transaction((tx) =>
     appendAuditEvent(tx, {
       actorType: "system",
       action: CHAIN_RESTORED_ACTION, // "system.chain.restored"
       metadata: {
         restoredFromBackup: "<backup filename>",
         lastPublishedAnchor: { epoch: 1, headSeq: 123, headHash: "<hash>" },
         reason: "<why the restore happened>",
       },
     }),
   );
   ```

4. Run a full verify and anchor immediately:
   - `GET /api/admin/audit/verify?full=true` (needs `audit.read`), or
   - `npx tsx packages/scripts/security/verify-audit-chain.ts --database-url "$DATABASE_URL"`
   - then let the anchor job publish the new head (or restart the API — it
     anchors on boot when stale).
5. Expect verification to treat epochs as separate chains joined by the restore
   event. A pre-restore anchor whose `headSeq` no longer exists (or whose hash
   mismatches) is EXPECTED after a restore that lost tail events — record the
   discrepancy in the restore metadata (step 3) so the story is auditable.

## Never do

- Never `UPDATE`/`DELETE` on `audit_events` (a trigger blocks it; disabling the
  trigger outside step 3's sanctioned flow defeats the chain of trust).
- Never re-hash old rows to "make verification pass" — that is exactly the
  tampering the system exists to expose.

## Break-glass (trigger disable)

Only as part of a documented incident, and always followed by a
`system.chain.restored` event and a fresh anchor:

```sql
ALTER TABLE audit_events DISABLE TRIGGER trg_audit_events_immutable;
-- ... sanctioned surgery ...
ALTER TABLE audit_events ENABLE TRIGGER trg_audit_events_immutable;
```
