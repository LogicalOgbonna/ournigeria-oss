-- Persist which scouted-handle rows were mentioned in a draft so the
-- publish-time consent guard validates ids, never text inference (text
-- parsing both corrupted operator-edited drafts and missed edited-in
-- mentions).
ALTER TABLE "social_posts" ADD COLUMN "tagged_handle_ids" UUID[] NOT NULL DEFAULT '{}';
