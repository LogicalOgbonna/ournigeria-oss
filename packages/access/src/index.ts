// @ournigeria/access — predefined RBAC catalog + audit-chain primitives.
// Spec: .agent/plans/62.rbac-audit-chain-design.md.
// Runtime deps are limited to node:crypto and @nestjs/common — this package is
// consumed by the pruned production API image (no xlsx/pdf-parse allowed).
export {
  PERMISSIONS,
  isPermission,
  type Permission,
} from "./permissions";
export {
  ROLES,
  ROLE_BUNDLES,
  ROLE_DESCRIPTIONS,
  ASSIGNABLE_ROLES,
  isRole,
  resolvePermissions,
  hasPermission,
  type Role,
} from "./roles";
export { canonicalJson } from "./canonical";
export {
  GENESIS_PREV_HASH,
  computeEventHash,
  verifyChainSegment,
  type AuditActorType,
  type ChainVerdict,
  type HashedEventFields,
  type VerifiableEvent,
} from "./chain";
export {
  AUDIT_CHAIN_LOCK_KEY,
  CHAIN_RESTORED_ACTION,
  appendAuditEvent,
  type AppendedAuditEvent,
  type AuditEventInput,
  type AuditTxClient,
} from "./audit-append";
export {
  DIFF_DECRYPT_PERMISSION,
  SENSITIVE_DIFF_FIELDS,
  decryptPermissionFor,
  sensitiveFieldsFor,
} from "./sensitive-fields";
export { redactSecrets } from "./redact";
export { PERMISSION_KEY, RequirePermission } from "./require-permission";
