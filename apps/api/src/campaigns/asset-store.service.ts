/**
 * Campaign assets live in the `campaign_assets` storage domain (see
 * ../storage). Re-exports only what campaign code still reaches through here.
 */
export { STAGING_PREFIX, type ObjectStore } from "../storage/object-store";
