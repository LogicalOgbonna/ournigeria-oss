# Campaign assets: takedown (purge) runbook

Campaign uploads are content-addressed and **never deleted by normal editing**. Replacing a poster or
deleting a media row only re-points (or drops) the DB row; the old object stays in the bucket so an audit
revert can put it back. Deleting the bytes for real is a separate, reviewer-only act: `POST /api/admin/campaigns/:id/purge`.

Purge when the bytes themselves must go: a copyright/legal takedown, a wrong person's photo, a leaked or
defamatory document, or a candidate withdrawal where the party asks for the material to be removed. For a
routine "this poster is out of date", just replace the media row — no purge.

## Prerequisites

- An admin session (`on_admin_session` cookie) for a user holding **`campaigns.review`** (`review_manager`
  or `super_admin`). `campaigns.write` alone gets 403.
- To read superseded URLs out of audit diffs you also need **`audit.read`**.
- CDN purge needs `/api:CLOUDFLARE_ZONE_ID` and `/api:CLOUDFLARE_API_TOKEN` in Infisical (token scope:
  **Zone -> Cache Purge** on the `ournigeria.ng` zone). Unset = the API skips the Cloudflare call and
  reports `cdn.purged:false, reason:"cdn purge not configured"`. The delete still happens.

## Step 1 - drop the reference first

Purge refuses any key a row still points at. Concretely it 409s when the key (or the sibling variant of a
council portrait) is referenced by `campaign_media.url`, `campaign_document.file_url` / `cover_url`, or
`campaign_council_member.image_url` **on any ticket**. So first:

- media: `DELETE /api/admin/campaigns/:id/media/:mediaId` (body `{"reason":"..."}`), or replace the slot;
- document: `DELETE /api/admin/campaigns/:id/documents/:kind/:subject`;
- council portrait: re-upload a replacement photo, or delete the member.

## Step 2 - collect the keys

A key is the public URL minus the CDN base, e.g.
`https://cdn.ournigeria.ng/election/2027/presidential/some-slug/poster_candidate-1a2b3c4d5e6f7a8b.webp`
-> `election/2027/presidential/some-slug/poster_candidate-1a2b3c4d5e6f7a8b.webp`.
Every key must sit under this ticket's prefix `election/<year>/<electionType>/<slug>/`; anything else is a 400.

- **Still referenced (before step 1):** `GET /api/admin/campaigns/:id` -> `media[].url`,
  `documents[].fileUrl` / `.coverUrl`, `council[].imageUrl`. The ticket's Review tab shows the same rows plus
  the last 20 audit events (`audit[]`: action, actor, metadata) so you can see who changed what and when.
- **Already replaced or deleted:** the old URL lives in the audit **diff**, which `GET /:id` does not include.
  Read it from the audit API instead:

  ```bash
  curl -sS -b "on_admin_session=$ONS" \
    "https://api.ournigeria.ng/api/admin/audit?targetType=campaign_media&targetId=$MEDIA_ID&limit=50" \
    | jq '.data[] | {seq, action, before: .diff.before.url, after: .diff.after.url}'
  ```

  Use `targetType=campaign_document` (`diff.before.fileUrl` / `.coverUrl`) or
  `targetType=campaign_council_member` (`diff.before.imageUrl`) for the other two. `action=campaign.` filters
  by prefix.
- **Council portraits are two objects per photo:** `<hash>-600.webp` and `<hash>-128.webp` (the row stores
  only the `-600` URL; the frontend derives `-128` by suffix swap). Pass **both** keys in the same call.
  Purging one alone is refused with `(its variant ... is still referenced)` while the row lives, and
  purging only the `-600` after the row is gone leaves the thumbnail on the CDN forever.

## Step 3 - purge

```bash
curl -sS -X POST "https://api.ournigeria.ng/api/admin/campaigns/$TICKET_ID/purge" \
  -H 'content-type: application/json' \
  -b "on_admin_session=$ONS" \
  -d '{
        "keys": [
          "election/2027/presidential/some-slug/poster_candidate-1a2b3c4d5e6f7a8b.webp",
          "election/2027/presidential/some-slug/council/6f0c.../9a8b7c6d5e4f3a2b-600.webp",
          "election/2027/presidential/some-slug/council/6f0c.../9a8b7c6d5e4f3a2b-128.webp"
        ],
        "reason": "legal takedown - request ref XYZ, photographer copyright claim"
      }'
```

`reason` is required (3-500 chars) and lands in the audit trail. Up to 100 keys per call.

Response:

```json
{ "deleted": ["election/..."], "cdn": { "purged": true, "count": 3 } }
```

- `cdn.purged: true` - Cloudflare accepted the purge; the URLs 404 within seconds.
- `cdn.purged: false` with a `reason` (`cdn purge not configured`, `cloudflare responded 403`, ...) - **the
  objects are already deleted**, only the edge cache was not flushed. Purge the exact URLs by hand in the
  Cloudflare dashboard (Caching -> Configuration -> Purge Custom URLs), or fix the secrets and re-run the
  purge with the same keys (deleting a missing key is a no-op).

Verify: `curl -sI https://cdn.ournigeria.ng/<key>` should be 403/404.

## What is cached, and for how long

- **Images** are written with `public, max-age=31536000, immutable` under a content-hash key. A *replacement*
  never needs a purge (new bytes = new key = new URL). A *takedown* does, hence this runbook.
- **PDFs** are written with `public, max-age=86400` (24 h). Even with no Cloudflare credentials configured,
  a purged document falls out of the edge cache within 24 h - but do not treat that as the takedown; a browser
  that already fetched it keeps its copy until the same TTL expires.

## Staging uploads

The browser PUTs raw bytes to `staging/<campaignId>/<uuid>` via a 10-minute presigned URL. The commit call
validates them, re-encodes (PDFs are copied verbatim) and deletes the staging object. Abandoned staging
objects expire after 1 day via the `expire-staging-uploads` lifecycle rule, so they never need a purge.
Bucket CORS + that lifecycle rule are applied by `packages/scripts/setup/s3-campaign-assets.sh`
(idempotent, merges into existing rules; run once per environment with the AWS credentials from Infisical `/api`).

## Audit

Purge writes two events on the ticket, both readable at
`GET /api/admin/audit?targetType=campaign&targetId=$TICKET_ID`:

1. `campaign.assets.purge_requested` - written **before** anything is deleted (`metadata.keys`,
   `metadata.reason`), so an interrupted takedown still records who asked for what.
2. `campaign.assets.purged` - the outcome, with `metadata.cdn` = the purge result above. Best-effort: if this
   write fails the delete still stands, so treat a lone `purge_requested` as "check the bucket".

Neither event is revertible - purged bytes are gone. An audit revert that would re-point a row at a purged
object fails with 409 "Cannot revert: the previous object was purged".
