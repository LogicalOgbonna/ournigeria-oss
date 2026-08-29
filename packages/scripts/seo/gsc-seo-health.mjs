#!/usr/bin/env node
// SEO health check for ournigeria.ng — run daily in CI (.github/workflows/seo-health.yml)
// and locally via: infisical run --env dev --path /analytics -- node packages/scripts/seo/gsc-seo-health.mjs
//
// Born out of the July 2026 incident where a WAF change 403'd real Googlebot for
// 5 weeks and de-indexed ~8-9k pages before anyone noticed. Four checks:
//   1. Live sitemap hasn't silently shrunk (sitemap.ts falls back to ~8 static
//      routes if the API is down during revalidation).
//   2. Sitemap gets resubmitted to Google when it drifts or goes stale.
//   3. Googlebot isn't being blocked (URL Inspection sample — real crawl verdicts,
//      NOT a curl UA test, which always 403s regardless of what Googlebot sees).
//   4. Cloudflare custom WAF rules on public paths keep the verified-bot exemption.
//   5. Sitemap URLs actually resolve (404 sample against the Vercel origin —
//      catches the next "dedup deleted officials without slug aliases" event,
//      which orphaned 795 URLs in Aug 2026, within a day instead of months).
//   6. Canonical tags render on representative pages (regression guard for the
//      /proposals/new duplicate-canonical fix).
//
// Env: GOOGLE_SA_JSON (required, service-account JSON string)
//      CLOUDFLARE_API_TOKEN (optional, zone-read — enables check 4)
//      MIN_SITEMAP_URLS (default 12000), INSPECT_SAMPLE (default 25)
//      HEAD_SAMPLE (default 25)

import { createSign } from 'node:crypto';

const SITE = 'sc-domain:ournigeria.ng';
const SITEMAP_URL = 'https://ournigeria.ng/sitemap.xml';
// Vercel prod origin: bypasses the Cloudflare bot challenge (which 403s every
// non-browser client regardless of what real Googlebot sees) and the edge cache.
const ORIGIN = 'https://ournigeria-awanaija-logical-ogbonnas-projects.vercel.app';
const HEAD_SAMPLE = Number(process.env.HEAD_SAMPLE || 25);
const DEAD_URL_LIMIT = 3; // 404s in the sample before we fail
const CF_ZONE_ID = process.env.CF_ZONE_ID || 'CLOUDFLARE_ZONE_ID';
const MIN_SITEMAP_URLS = Number(process.env.MIN_SITEMAP_URLS || 12000);
const INSPECT_SAMPLE = Number(process.env.INSPECT_SAMPLE || 25);
const BLOCKED_VERDICT_LIMIT = 3; // recent-crawl 403s in the sample before we fail
const RECENT_CRAWL_DAYS = 14;
const RESUBMIT_MAX_AGE_DAYS = 7;
const RESUBMIT_DRIFT_PCT = 2;

const failures = [];
const info = (msg) => console.log(msg);
const fail = (msg) => { failures.push(msg); console.error(`FAIL: ${msg}`); };

async function getAccessToken(scope) {
  const sa = JSON.parse(process.env.GOOGLE_SA_JSON);
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: sa.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64url');
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function gsc(token, path, opts = {}) {
  const res = await fetch(`https://searchconsole.googleapis.com${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
  });
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GSC ${path}: ${res.status} ${JSON.stringify(body).slice(0, 200)}`);
  return body;
}

// --- 1. Live sitemap silent-shrink guard ---------------------------------
async function checkLiveSitemap() {
  const res = await fetch(SITEMAP_URL, { headers: { 'User-Agent': 'ournigeria-seo-health' } });
  if (!res.ok) {
    fail(`sitemap.xml fetch returned ${res.status} — sitemap unreachable`);
    return [];
  }
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (urls.length < MIN_SITEMAP_URLS) {
    fail(`sitemap has ${urls.length} URLs, expected >= ${MIN_SITEMAP_URLS} — likely fell back to static routes (API down during revalidation?)`);
  } else {
    info(`ok: live sitemap has ${urls.length} URLs (floor ${MIN_SITEMAP_URLS})`);
  }
  return urls;
}

// --- 2. Freshness: resubmit to GSC on drift or staleness ------------------
async function checkResubmit(token, liveCount) {
  const site = encodeURIComponent(SITE);
  const feed = encodeURIComponent(SITEMAP_URL);
  const list = await gsc(token, `/webmasters/v3/sites/${site}/sitemaps`);
  const entry = (list?.sitemap || []).find((s) => s.path === SITEMAP_URL);
  if (!entry) {
    info('sitemap not registered in GSC — submitting');
    await gsc(token, `/webmasters/v3/sites/${site}/sitemaps/${feed}`, { method: 'PUT' });
    return;
  }
  const submitted = Number((entry.contents || []).find((c) => c.type === 'web')?.submitted || 0);
  const ageDays = (Date.now() - Date.parse(entry.lastSubmitted)) / 86400000;
  const driftPct = submitted ? Math.abs(liveCount - submitted) / submitted * 100 : 100;
  info(`GSC sitemap: submitted=${submitted} lastSubmitted=${entry.lastSubmitted.slice(0, 10)} (${ageDays.toFixed(1)}d ago), live=${liveCount} (drift ${driftPct.toFixed(1)}%)`);
  if (liveCount >= MIN_SITEMAP_URLS && (ageDays > RESUBMIT_MAX_AGE_DAYS || driftPct > RESUBMIT_DRIFT_PCT)) {
    await gsc(token, `/webmasters/v3/sites/${site}/sitemaps/${feed}`, { method: 'PUT' });
    info('resubmitted sitemap to GSC');
  }
}

// --- 3. Googlebot-block detector (URL Inspection sample) ------------------
async function checkGooglebotBlocked(token, sitemapUrls) {
  if (!sitemapUrls.length) return;
  const sample = [...sitemapUrls].sort(() => Math.random() - 0.5).slice(0, INSPECT_SAMPLE);
  const cutoff = Date.now() - RECENT_CRAWL_DAYS * 86400000;
  let recentBlocked = 0, staleBlocked = 0, indexed = 0, errors = 0;
  const blockedUrls = [];
  for (const url of sample) {
    try {
      const r = await gsc(token, '/v1/urlInspection/index:inspect', {
        method: 'POST',
        body: JSON.stringify({ inspectionUrl: url, siteUrl: SITE }),
      });
      const st = r?.inspectionResult?.indexStatusResult || {};
      const state = st.coverageState || '';
      if (state === 'Submitted and indexed') indexed++;
      if (state.startsWith('Blocked due to access forbidden')) {
        const crawledAt = Date.parse(st.lastCrawlTime || 0);
        if (crawledAt > cutoff) { recentBlocked++; blockedUrls.push(url); }
        else staleBlocked++;
      }
    } catch (e) {
      errors++;
      if (errors <= 2) console.warn(`inspect error for ${url}: ${String(e).slice(0, 120)}`);
    }
  }
  info(`inspection sample (n=${sample.length}): indexed=${indexed}, blocked-recent=${recentBlocked}, blocked-stale=${staleBlocked}, errors=${errors}`);
  if (recentBlocked >= BLOCKED_VERDICT_LIMIT) {
    fail(`Googlebot got 403 on ${recentBlocked}/${sample.length} sampled pages within ${RECENT_CRAWL_DAYS}d — a WAF/bot rule is blocking verified crawlers again. Check Cloudflare custom rules (need "not cf.client.bot") and Vercel bot protection. e.g. ${blockedUrls.slice(0, 3).join(' ')}`);
  }
}

// --- 4. Cloudflare WAF verified-bot exemption guard -----------------------
async function checkWafExemption() {
  const cfToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!cfToken) { info('skip: CLOUDFLARE_API_TOKEN not set — WAF exemption guard disabled'); return; }
  const headers = { Authorization: `Bearer ${cfToken}` };
  const rulesets = await (await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/rulesets`, { headers })).json();
  const custom = (rulesets.result || []).filter((r) => r.phase === 'http_request_firewall_custom');
  const seoPaths = ['/states', '/officials', '/constituencies'];
  for (const rs of custom) {
    const detail = await (await fetch(`https://api.cloudflare.com/client/v4/zones/${CF_ZONE_ID}/rulesets/${rs.id}`, { headers })).json();
    for (const rule of detail.result?.rules || []) {
      if (!rule.enabled) continue;
      if (!['block', 'challenge', 'managed_challenge', 'js_challenge'].includes(rule.action)) continue;
      const touchesSeoPath = seoPaths.some((p) => rule.expression.includes(`"${p}`));
      if (touchesSeoPath && !rule.expression.includes('cf.client.bot')) {
        fail(`Cloudflare rule "${rule.description || rule.id}" ${rule.action}s an SEO path without the verified-bot exemption (not cf.client.bot) — this is how the July 2026 de-indexing happened`);
      }
    }
  }
  info('ok: Cloudflare custom rules on SEO paths keep the verified-bot exemption');
}

// --- 5. Sitemap URLs resolve (dead-URL / missing-alias detector) ----------
async function checkDeadUrls(sitemapUrls) {
  if (!sitemapUrls.length) return;
  const sample = [...sitemapUrls].sort(() => Math.random() - 0.5).slice(0, HEAD_SAMPLE);
  const dead = [];
  await Promise.all(sample.map(async (url) => {
    const path = new URL(url).pathname;
    try {
      const res = await fetch(`${ORIGIN}${path}`, { method: 'HEAD', redirect: 'follow' });
      if (res.status === 404 || res.status === 410) dead.push(path);
    } catch { /* network blip — don't count as dead */ }
  }));
  info(`dead-URL sample (n=${sample.length}): ${dead.length} 404s`);
  if (dead.length >= DEAD_URL_LIMIT) {
    fail(`${dead.length}/${sample.length} sampled sitemap URLs 404 — likely officials deleted/renamed without official_slug_aliases rows (Aug 2026 orphaned 795 URLs this way). e.g. ${dead.slice(0, 3).join(' ')}`);
  }
}

// --- 6. Canonical tags render (duplicate-canonical regression guard) ------
async function checkCanonicals() {
  const expectations = [
    ['/proposals/new?mode=identify&role=councilor&stateCode=kogi', 'https://ournigeria.ng/proposals/new'],
    ['/states/kano', 'https://ournigeria.ng/states/kano'],
    ['/activity', 'https://ournigeria.ng/activity'],
  ];
  for (const [path, expected] of expectations) {
    try {
      const html = await (await fetch(`${ORIGIN}${path}`)).text();
      const m = html.match(/<link rel="canonical" href="([^"]+)"/);
      if (!m) fail(`${path} renders no canonical tag (expected ${expected})`);
      else if (m[1] !== expected) fail(`${path} canonical is ${m[1]}, expected ${expected}`);
    } catch (e) {
      fail(`canonical check fetch failed for ${path}: ${String(e).slice(0, 100)}`);
    }
  }
  info('ok: canonical tags render on representative pages');
}

// --------------------------------------------------------------------------
try {
  if (!process.env.GOOGLE_SA_JSON) throw new Error('GOOGLE_SA_JSON env var is required');
  const liveUrls = await checkLiveSitemap();
  const token = await getAccessToken('https://www.googleapis.com/auth/webmasters');
  await checkResubmit(token, liveUrls.length);
  await checkGooglebotBlocked(token, liveUrls);
  await checkWafExemption();
  await checkDeadUrls(liveUrls);
  await checkCanonicals();
} catch (e) {
  fail(`unhandled: ${e.message || e}`);
}

if (failures.length) {
  console.error(`\n${failures.length} SEO health failure(s):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('\nSEO health: all checks passed');
