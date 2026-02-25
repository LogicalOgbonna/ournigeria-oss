#!/usr/bin/env node

/**
 * Populate Corruption Cases
 *
 * Builds structured corruption case documentation for Nigerian officials by
 * combining comprehensive hardcoded metadata with articles fetched from
 * WordPress REST API endpoints on Nigerian news sites.
 *
 * Usage:
 *   node populate-corruption-cases.mjs [--official Name] [--dry-run] [--verbose]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OFFICIALS } from './officials-data.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Configuration ───────────────────────────────────────────────────────────

const OUTPUT_DIR = path.resolve(__dirname, '../../source/corruption');
const PROGRESS_FILE = path.join(__dirname, '.corruption-cases-progress.json');
const INDEX_FILE = path.join(OUTPUT_DIR, 'INDEX.md');

const WP_SITES = [
  { name: 'PremiumTimes', domain: 'premiumtimesng.com', api: 'https://www.premiumtimesng.com/wp-json/wp/v2/posts' },
  { name: 'DailyPost', domain: 'dailypost.ng', api: 'https://dailypost.ng/wp-json/wp/v2/posts' },
  { name: 'ChannelsTV', domain: 'channelstv.com', api: 'https://channelstv.com/wp-json/wp/v2/posts' },
];

const RATE_LIMIT_MS = 2000;
const MAX_ARTICLES_PER_SEARCH = 10;
const MAX_ARTIFACTS_PER_OFFICIAL = 20;
const ARTIFACT_TIMEOUT_MS = 30000;

// ─── CLI Argument Parsing ────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VERBOSE = args.includes('--verbose');
const officialIdx = args.indexOf('--official');
const SINGLE_OFFICIAL = officialIdx !== -1 && args[officialIdx + 1] ? args[officialIdx + 1] : null;

function log(...msg) { console.log(`[${new Date().toISOString()}]`, ...msg); }
function verbose(...msg) { if (VERBOSE) console.log(`  [verbose]`, ...msg); }

// ─── Progress Tracking ──────────────────────────────────────────────────────

function loadProgress() {
  try {
    if (!fs.existsSync(PROGRESS_FILE)) return {};
    const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    if (typeof data !== 'object' || data === null) return {};
    return data;
  } catch (err) {
    console.warn(`Warning: Corrupted progress file, starting fresh: ${err.message}`);
    try { fs.renameSync(PROGRESS_FILE, PROGRESS_FILE + '.corrupted'); } catch { /* ignore */ }
    return {};
  }
}

function saveProgress(progress) {
  if (DRY_RUN) return;
  const tmpFile = PROGRESS_FILE + '.tmp';
  try {
    fs.writeFileSync(tmpFile, JSON.stringify(progress, null, 2));
    fs.renameSync(tmpFile, PROGRESS_FILE);
  } catch (err) {
    console.error(`CRITICAL: Failed to save progress: ${err.message}`);
  }
}

// ─── HTML / Text Utilities ───────────────────────────────────────────────────

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractParagraphs(html) {
  const paragraphs = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(html)) !== null) {
    const text = stripHtml(match[1]).trim();
    if (text.length > 40) paragraphs.push(text);
  }
  if (paragraphs.length === 0) {
    const plainText = stripHtml(html);
    const sentences = plainText.split(/(?<=[.!?])\s+/).filter(s => s.length > 40);
    for (let i = 0; i < sentences.length; i += 3) {
      paragraphs.push(sentences.slice(i, i + 3).join(' '));
    }
  }
  return paragraphs;
}

function extractLinks(html) {
  const links = [];
  const aRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = aRegex.exec(html)) !== null) links.push(match[1]);
  return links;
}

function extractImages(html) {
  const images = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    const skip = ['logo', 'icon', 'avatar', 'ad', 'banner', 'widget', 'pixel', 'tracking', 'gravatar', 'emoji', 'smilie'];
    if (!skip.some(p => src.toLowerCase().includes(p))) images.push(src);
  }
  return images;
}

function formatDate(dateStr) {
  try { return new Date(dateStr).toISOString().split('T')[0]; }
  catch { return 'unknown-date'; }
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 60);
}

// ─── WP REST API Fetching ────────────────────────────────────────────────────

async function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchWpArticles(site, searchTerm, retries = 0) {
  const url = `${site.api}?search=${encodeURIComponent(searchTerm)}&per_page=${MAX_ARTICLES_PER_SEARCH}&_fields=id,title,content,date,link`;
  verbose(`Fetching: ${url}`);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'OurNigeria-Research/1.0' },
    });
    clearTimeout(timeout);
    if (res.status === 429 && retries < 3) {
      const retryAfter = parseInt(res.headers.get('retry-after') || String(Math.pow(2, retries + 1) * 1000));
      verbose(`  Rate limited by ${site.name}, retrying after ${retryAfter}ms`);
      await sleep(retryAfter);
      return fetchWpArticles(site, searchTerm, retries + 1);
    }
    if (!res.ok) { verbose(`  HTTP ${res.status} from ${site.name}`); return []; }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('json')) { verbose(`  Non-JSON from ${site.name}`); return []; }
    const data = await res.json();
    return data
      .filter(a => a.content?.rendered?.trim())
      .map(a => ({
        id: a.id,
        title: a.title?.rendered ? stripHtml(a.title.rendered) : 'Untitled',
        content: a.content.rendered,
        date: a.date || '',
        url: a.link || '',
        publisher: site.name,
        domain: site.domain,
      }));
  } catch (err) {
    verbose(`  Error: ${err.message}`);
    return [];
  }
}

async function fetchAllArticles(official) {
  const allArticles = new Map();
  const queries = [...new Set([
    `${official.name} EFCC`,
    `${official.name} corruption`,
    ...official.searchTerms,
  ])];
  for (const site of WP_SITES) {
    for (const query of queries) {
      const articles = await fetchWpArticles(site, query);
      for (const a of articles) {
        const key = `${a.publisher}-${a.id}`;
        if (!allArticles.has(key)) allArticles.set(key, a);
      }
      await sleep(RATE_LIMIT_MS);
    }
  }
  return [...allArticles.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ─── Artifact Downloading ────────────────────────────────────────────────────

async function downloadArtifact(url, destPath) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ARTIFACT_TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'OurNigeria-Research/1.0' } });
    clearTimeout(timeout);
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch { return false; }
}

async function downloadArticleHtml(article, artifactsDir) {
  const slug = slugify(article.title);
  const filename = `${article.publisher}_${formatDate(article.date)}_${slug}.html`;
  const destPath = path.join(artifactsDir, 'screenshots', filename);
  if (fs.existsSync(destPath)) return filename;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ARTIFACT_TIMEOUT_MS);
    const res = await fetch(article.url, { signal: controller.signal, headers: { 'User-Agent': 'OurNigeria-Research/1.0' } });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, html);
    return filename;
  } catch { return null; }
}

async function downloadArtifacts(articles, artifactsDir) {
  if (DRY_RUN) return {};
  const downloaded = {};
  let count = 0;
  for (const article of articles) {
    if (count >= MAX_ARTIFACTS_PER_OFFICIAL) break;
    const htmlFile = await downloadArticleHtml(article, artifactsDir);
    if (htmlFile) { downloaded[article.url] = { screenshot: `./artifacts/screenshots/${htmlFile}` }; count++; }
    await sleep(500);
    const links = extractLinks(article.content);
    for (const link of links) {
      if (count >= MAX_ARTIFACTS_PER_OFFICIAL) break;
      if (link.toLowerCase().endsWith('.pdf')) {
        const fn = `${article.publisher}_${formatDate(article.date)}_${slugify(article.title)}.pdf`;
        const dest = path.join(artifactsDir, 'documents', fn);
        if (!fs.existsSync(dest) && await downloadArtifact(link, dest)) {
          if (!downloaded[article.url]) downloaded[article.url] = {};
          downloaded[article.url].documents = downloaded[article.url].documents || [];
          downloaded[article.url].documents.push(`./artifacts/documents/${fn}`);
          count++;
        }
        await sleep(500);
      }
    }
    const images = extractImages(article.content);
    for (const imgSrc of images.slice(0, 2)) {
      if (count >= MAX_ARTIFACTS_PER_OFFICIAL) break;
      try {
        const imgUrl = new URL(imgSrc, article.url);
        if (!imgUrl.hostname.endsWith(article.domain)) continue;
        const ext = path.extname(imgUrl.pathname) || '.jpg';
        const fn = `${article.publisher}_${formatDate(article.date)}_${slugify(article.title)}${ext}`;
        const dest = path.join(artifactsDir, 'images', fn);
        if (!fs.existsSync(dest) && await downloadArtifact(imgUrl.href, dest)) {
          if (!downloaded[article.url]) downloaded[article.url] = {};
          downloaded[article.url].images = downloaded[article.url].images || [];
          downloaded[article.url].images.push(`./artifacts/images/${fn}`);
          count++;
        }
        await sleep(300);
      } catch { /* skip */ }
    }
  }
  verbose(`  Downloaded ${count} artifacts`);
  return downloaded;
}

// ─── Markdown File Builders (Clean Narrative — No Inline Sources) ────────────

function buildOverview(official) {
  const o = official.overview || {};
  const lines = [];
  lines.push(`# ${official.name} - Case Overview\n`);

  if (official.fullName || official.birthDeath) {
    lines.push(`## Full Name and Title`);
    if (official.fullName) lines.push(`**${official.fullName}**`);
    if (official.birthDeath) lines.push(`${official.birthDeath}`);
    lines.push('');
  }

  lines.push(`## Position`);
  lines.push(official.position);
  if (official.party) lines.push(`**Political Party:** ${official.party}`);
  lines.push('');

  if (o.summary) {
    lines.push(`## Summary of the Case\n`);
    lines.push(o.summary);
    lines.push('');
  }

  if (o.significance && o.significance.length > 0) {
    lines.push(`## Why This Case Is Significant\n`);
    for (const s of o.significance) lines.push(`- ${s}`);
    lines.push('');
  }

  if (o.currentStatus) {
    lines.push(`## Current Status\n`);
    lines.push(o.currentStatus);
    lines.push('');
  }

  lines.push('');
  return lines.join('\n');
}

function buildCharges(official) {
  const c = official.charges || {};
  const lines = [];
  lines.push(`# ${official.name} - Detailed Charges\n`);
  lines.push(`## Position\n${official.position}\n`);

  if (c.summary) {
    lines.push(`## Summary\n`);
    lines.push(c.summary);
    lines.push('');
  }

  if (c.details && c.details.length > 0) {
    lines.push(`## Formal Charges\n`);
    for (const d of c.details) {
      lines.push(`### ${d.description}`);
      if (d.year) lines.push(`- **Year:** ${d.year}`);
      if (d.law) lines.push(`- **Relevant Law:** ${d.law}`);
      if (d.arraignment) lines.push(`- **Arraignment:** ${d.arraignment}`);
      if (d.plea) lines.push(`- **Plea:** ${d.plea}`);
      if (d.outcome) lines.push(`- **Outcome:** ${d.outcome}`);
      lines.push('');
    }
  }

  lines.push('');
  return lines.join('\n');
}

function buildFinancialDetails(official) {
  const f = official.financial || {};
  const lines = [];
  lines.push(`# ${official.name} - Financial Details\n`);
  lines.push(`## Position\n${official.position}\n`);

  if (f.totalAlleged) {
    lines.push(`## Total Amount Alleged\n`);
    lines.push(`**${f.totalAlleged}**\n`);
  }

  if (f.amounts && f.amounts.length > 0) {
    lines.push(`## Specific Amounts\n`);
    lines.push(`| Amount | Description | Year |`);
    lines.push(`|--------|-------------|------|`);
    for (const a of f.amounts) {
      lines.push(`| ${a.amount} | ${a.description} | ${a.year || ''} |`);
    }
    lines.push('');
  }

  if (f.properties && f.properties.length > 0) {
    lines.push(`## Properties\n`);
    for (const p of f.properties) lines.push(`- ${p}`);
    lines.push('');
  }

  if (f.shellCompanies && f.shellCompanies.length > 0) {
    lines.push(`## Shell Companies / Entities Used\n`);
    for (const s of f.shellCompanies) lines.push(`- **${s}**`);
    lines.push('');
  }

  if (f.sourceOfFunds) {
    lines.push(`## Source of Funds\n`);
    lines.push(f.sourceOfFunds);
    lines.push('');
  }

  if (f.bail) {
    lines.push(`## Bail Terms\n`);
    lines.push(f.bail);
    lines.push('');
  }

  lines.push('');
  return lines.join('\n');
}

function buildCourtProceedings(official) {
  const cp = official.courtProceedings || {};
  const lines = [];
  lines.push(`# ${official.name} - Court Proceedings\n`);
  lines.push(`## Position\n${official.position}\n`);

  if (cp.summary) {
    lines.push(`## Summary\n`);
    lines.push(cp.summary);
    lines.push('');
  }

  if (cp.courts && cp.courts.length > 0) {
    lines.push(`## Courts and Cases\n`);
    for (const c of cp.courts) {
      lines.push(`### ${c.court}`);
      lines.push(`- **Role:** ${c.role}`);
      if (c.judge) lines.push(`- **Judge:** ${c.judge}`);
      lines.push(`- **Status:** ${c.status}`);
      lines.push('');
    }
  }

  if (cp.keyRulings && cp.keyRulings.length > 0) {
    lines.push(`## Key Rulings\n`);
    for (const r of cp.keyRulings) lines.push(`- ${r}`);
    lines.push('');
  }

  lines.push('');
  return lines.join('\n');
}

function buildArrestInvestigation(official) {
  const ai = official.arrestInvestigation || {};
  const lines = [];
  lines.push(`# ${official.name} - Arrest and Investigation\n`);
  lines.push(`## Position\n${official.position}\n`);

  if (ai.summary) {
    lines.push(`## How the Investigation and Arrest Unfolded\n`);
    lines.push(ai.summary);
    lines.push('');
  }

  lines.push('');
  return lines.join('\n');
}

function buildCaseOutcome(official) {
  const co = official.caseOutcome || {};
  const lines = [];
  lines.push(`# ${official.name} - Case Outcome\n`);
  lines.push(`## Position\n${official.position}\n`);

  if (co.status) {
    lines.push(`## Status: ${co.status}\n`);
  }

  if (co.summary) {
    lines.push(`## Outcome Summary\n`);
    lines.push(co.summary);
    lines.push('');
  }

  lines.push('');
  return lines.join('\n');
}

function buildTimeline(official) {
  const tl = official.timeline || [];
  const lines = [];
  lines.push(`# ${official.name} - Chronological Timeline\n`);
  lines.push(`## Position\n${official.position}\n`);

  if (tl.length > 0) {
    // Group timeline events by phase
    const phases = groupTimelineByPhase(tl);
    for (const [phase, events] of Object.entries(phases)) {
      lines.push(`## ${phase}\n`);
      lines.push(`| Date | Event |`);
      lines.push(`|------|-------|`);
      for (const e of events) {
        lines.push(`| ${e.date} | ${e.event} |`);
      }
      lines.push('');
    }
  }

  lines.push('');
  return lines.join('\n');
}

function buildKeyPlayers(official) {
  const kp = official.keyPlayers || {};
  const lines = [];
  lines.push(`# ${official.name} - Key Players\n`);
  lines.push(`## Position\n${official.position}\n`);

  if (kp.accused && kp.accused.length > 0) {
    lines.push(`## The Accused\n`);
    for (const p of kp.accused) {
      lines.push(`### ${p.name}`);
      lines.push(`- **Role:** ${p.role}`);
      if (p.status) lines.push(`- **Status:** ${p.status}`);
      if (p.note) lines.push(`- **Note:** ${p.note}`);
      lines.push('');
    }
  }

  if (kp.prosecution && kp.prosecution.length > 0) {
    lines.push(`## Prosecution Team\n`);
    for (const p of kp.prosecution) {
      lines.push(`### ${p.name}`);
      lines.push(`- **Role:** ${p.role}`);
      if (p.note) lines.push(`- **Note:** ${p.note}`);
      lines.push('');
    }
  }

  if (kp.defense && kp.defense.length > 0) {
    lines.push(`## Defense Team\n`);
    for (const p of kp.defense) {
      lines.push(`### ${p.name}`);
      lines.push(`- **Role:** ${p.role}`);
      if (p.note) lines.push(`- **Note:** ${p.note}`);
      lines.push('');
    }
  }

  if (kp.judges && kp.judges.length > 0) {
    lines.push(`## Judges\n`);
    for (const j of kp.judges) {
      lines.push(`### ${j.name}`);
      lines.push(`- **Court/Role:** ${j.role}`);
      if (j.rulings) lines.push(`- **Key Rulings:** ${j.rulings}`);
      lines.push('');
    }
  }

  if (kp.efccOfficials && kp.efccOfficials.length > 0) {
    lines.push(`## EFCC Officials\n`);
    for (const e of kp.efccOfficials) {
      lines.push(`### ${e.name}`);
      lines.push(`- **Role:** ${e.role}`);
      if (e.note) lines.push(`- **Note:** ${e.note}`);
      lines.push('');
    }
  }

  if (kp.witnesses && kp.witnesses.length > 0) {
    lines.push(`## Prosecution Witnesses\n`);
    for (const w of kp.witnesses) {
      lines.push(`### ${w.name}`);
      lines.push(`- **Role:** ${w.role}`);
      if (w.testimony) lines.push(`- **Testimony:** ${w.testimony}`);
      lines.push('');
    }
  }

  if (kp.associates && kp.associates.length > 0) {
    lines.push(`## Associates / Co-Conspirators\n`);
    for (const a of kp.associates) {
      lines.push(`### ${a.name}`);
      lines.push(`- **Role:** ${a.role}`);
      if (a.note) lines.push(`- **Note:** ${a.note}`);
      lines.push('');
    }
  }

  if (kp.investigators && kp.investigators.length > 0) {
    lines.push(`## Investigators\n`);
    for (const i of kp.investigators) {
      lines.push(`### ${i.name}`);
      lines.push(`- **Role:** ${i.role}`);
      if (i.note) lines.push(`- **Note:** ${i.note}`);
      lines.push('');
    }
  }

  if (kp.politicalFigures && kp.politicalFigures.length > 0) {
    lines.push(`## Political Figures Involved\n`);
    for (const p of kp.politicalFigures) {
      lines.push(`### ${p.name}`);
      lines.push(`- **Role:** ${p.role}`);
      if (p.note) lines.push(`- **Note:** ${p.note}`);
      lines.push('');
    }
  }

  lines.push('');
  return lines.join('\n');
}

// ─── Helper Functions ────────────────────────────────────────────────────────

function groupTimelineByPhase(timeline) {
  const phases = {};
  for (const entry of timeline) {
    let phase = 'Events';
    const yearMatch = entry.date.match(/\d{4}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      const eventLower = entry.event.toLowerCase();
      if (eventLower.includes('governor') || eventLower.includes('president') || eventLower.includes('minister') || eventLower.includes('inaugurated') || eventLower.includes('tenure') || eventLower.includes('serves as') || eventLower.includes('office')) {
        phase = 'Pre-Investigation / In Office';
      } else if (eventLower.includes('charge') || eventLower.includes('filed') || eventLower.includes('investigate') || eventLower.includes('arrested') || eventLower.includes('wanted') || eventLower.includes('surrender') || eventLower.includes('siege') || eventLower.includes('declared wanted')) {
        phase = 'Investigation and Charges';
      } else if (eventLower.includes('arraign') || eventLower.includes('trial') || eventLower.includes('bail') || eventLower.includes('convict') || eventLower.includes('sentence') || eventLower.includes('acquit') || eventLower.includes('pardon') || eventLower.includes('plea')) {
        phase = 'Trial and Outcome';
      } else if (eventLower.includes('ongoing') || eventLower.includes('continues') || year >= 2025) {
        phase = 'Recent Developments';
      }
    }
    if (!phases[phase]) phases[phase] = [];
    phases[phase].push(entry);
  }
  return phases;
}

// ─── References Builder ─────────────────────────────────────────────────────

function buildReferences(official, articles, downloadedArtifacts) {
  const lines = [];
  lines.push(`# ${official.name} - References and Sources\n`);
  lines.push(`## Position\n${official.position}\n`);
  lines.push(`This document contains all sources and references used to compile the corruption case files for ${official.name}.\n`);

  if (articles.length === 0) {
    lines.push('*No articles were found from the queried news sources.*\n');
    return lines.join('\n');
  }

  // Group articles by publisher
  const byPublisher = {};
  for (const a of articles) {
    if (!byPublisher[a.publisher]) byPublisher[a.publisher] = [];
    byPublisher[a.publisher].push(a);
  }

  lines.push(`## Summary\n`);
  lines.push(`- **Total Sources:** ${articles.length}`);
  for (const [pub, arts] of Object.entries(byPublisher)) {
    lines.push(`- **${pub}:** ${arts.length} articles`);
  }
  lines.push('');

  // List all references grouped by publisher
  for (const [publisher, pubArticles] of Object.entries(byPublisher)) {
    const sorted = [...pubArticles].sort((a, b) => new Date(b.date) - new Date(a.date));
    lines.push(`---\n`);
    lines.push(`## ${publisher}\n`);

    for (const a of sorted) {
      const date = formatDate(a.date);
      lines.push(`### ${a.title}`);
      lines.push(`- **Date:** ${date}`);
      lines.push(`- **URL:** [${a.url}](${a.url})`);

      // Add artifact links if available
      const artifacts = downloadedArtifacts[a.url];
      if (artifacts) {
        if (artifacts.screenshot) {
          lines.push(`- **Saved Page:** [View Screenshot](${artifacts.screenshot})`);
        }
        if (artifacts.documents && artifacts.documents.length > 0) {
          for (const doc of artifacts.documents) {
            lines.push(`- **Document:** [Download](${doc})`);
          }
        }
        if (artifacts.images && artifacts.images.length > 0) {
          for (const img of artifacts.images) {
            lines.push(`- **Image:** [View](${img})`);
          }
        }
      }

      // Extract a brief excerpt from the article content
      const paragraphs = extractParagraphs(a.content);
      if (paragraphs.length > 0) {
        const excerpt = paragraphs[0].length > 300 ? paragraphs[0].substring(0, 297) + '...' : paragraphs[0];
        lines.push(`- **Excerpt:** ${excerpt}`);
      }

      lines.push('');
    }
  }

  // Chronological index of all sources
  lines.push(`---\n`);
  lines.push(`## Chronological Index\n`);
  lines.push(`| Date | Publisher | Title |`);
  lines.push(`|------|-----------|-------|`);
  const chronological = [...articles].sort((a, b) => new Date(a.date) - new Date(b.date));
  for (const a of chronological) {
    lines.push(`| ${formatDate(a.date)} | ${a.publisher} | [${a.title}](${a.url}) |`);
  }
  lines.push('');

  return lines.join('\n');
}

// ─── Index Generation ────────────────────────────────────────────────────────

function generateIndex(progress) {
  const lines = [];
  lines.push('# Nigerian Corruption Cases Database\n');
  lines.push(`*Generated on ${new Date().toISOString().split('T')[0]}*\n`);
  lines.push('## Officials\n');
  lines.push('| Name | Position | Status | Articles |');
  lines.push('|------|----------|--------|----------|');
  const sorted = [...OFFICIALS].sort((a, b) => a.name.localeCompare(b.name));
  for (const o of sorted) {
    const p = progress[o.dir];
    const status = p?.status === 'completed' ? 'Done' : p?.status === 'fetched' ? 'Fetched' : 'Pending';
    lines.push(`| [${o.name}](./${o.dir}/) | ${o.position} | ${status} | ${p?.articleCount || 0} |`);
  }
  lines.push('\n## Categories\n');
  lines.push('Each official directory contains:\n');
  const cats = ['overview.md', 'charges.md', 'financial_details.md', 'court_proceedings.md', 'arrest_and_investigation.md', 'case_outcome.md', 'timeline.md', 'key_players.md', 'references.md'];
  for (const c of cats) lines.push(`- \`${c}\``);
  lines.push('- `artifacts/` — Downloaded documents, images, and saved HTML pages\n');
  lines.push('## Sources\n');
  lines.push('- [Premium Times](https://premiumtimesng.com) (WordPress REST API)');
  lines.push('- [Daily Post](https://dailypost.ng) (WordPress REST API)');
  lines.push('- [Channels Television](https://channelstv.com) (WordPress REST API)\n');
  return lines.join('\n');
}

// ─── Process Single Official ─────────────────────────────────────────────────

async function processOfficial(official, progress) {
  log(`Processing: ${official.name} (${official.dir})`);
  const officialDir = path.join(OUTPUT_DIR, official.dir);
  const artifactsDir = path.join(officialDir, 'artifacts');

  if (progress[official.dir]?.status === 'completed') {
    log(`  Skipping (already completed)`);
    return;
  }

  // Pass 1: Fetch articles
  let articles;
  if (progress[official.dir]?.status === 'fetched' && progress[official.dir]?.articles) {
    log(`  Using cached articles`);
    articles = progress[official.dir].articles;
  } else {
    log(`  Fetching articles...`);
    articles = await fetchAllArticles(official);
    log(`  Found ${articles.length} articles`);
    progress[official.dir] = {
      status: 'fetched',
      articleCount: articles.length,
      articles: articles.map(a => ({ id: a.id, title: a.title, date: a.date, url: a.url, publisher: a.publisher, domain: a.domain, content: a.content })),
    };
    saveProgress(progress);
  }

  if (DRY_RUN) {
    log(`  [DRY RUN] Would create 9 .md files in ${officialDir}`);
    return;
  }

  fs.mkdirSync(officialDir, { recursive: true });
  fs.mkdirSync(path.join(artifactsDir, 'screenshots'), { recursive: true });
  fs.mkdirSync(path.join(artifactsDir, 'documents'), { recursive: true });
  fs.mkdirSync(path.join(artifactsDir, 'images'), { recursive: true });

  log(`  Downloading artifacts...`);
  const downloadedArtifacts = await downloadArtifacts(articles, artifactsDir);

  // Pass 2: Build .md files from metadata (clean narratives) + references
  log(`  Writing .md files...`);

  const files = {
    'overview.md': buildOverview(official),
    'charges.md': buildCharges(official),
    'financial_details.md': buildFinancialDetails(official),
    'court_proceedings.md': buildCourtProceedings(official),
    'arrest_and_investigation.md': buildArrestInvestigation(official),
    'case_outcome.md': buildCaseOutcome(official),
    'timeline.md': buildTimeline(official),
    'key_players.md': buildKeyPlayers(official),
    'references.md': buildReferences(official, articles, downloadedArtifacts),
  };

  for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(officialDir, filename), content);
    verbose(`  Wrote ${filename}`);
  }

  progress[official.dir] = {
    ...progress[official.dir],
    status: 'completed',
    completedAt: new Date().toISOString(),
    articles: undefined,
  };
  saveProgress(progress);
  log(`  Completed: ${official.name}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  log('=== Populate Corruption Cases ===');
  log(`Officials: ${OFFICIALS.length}`);
  log(`Output: ${OUTPUT_DIR}`);
  log(`Dry run: ${DRY_RUN}`);
  if (SINGLE_OFFICIAL) log(`Single official: ${SINGLE_OFFICIAL}`);

  if (!DRY_RUN) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const progress = loadProgress();

  let officialsToProcess = OFFICIALS;
  if (SINGLE_OFFICIAL) {
    officialsToProcess = OFFICIALS.filter(o => o.dir === SINGLE_OFFICIAL);
    if (officialsToProcess.length === 0) {
      console.error(`Official not found: ${SINGLE_OFFICIAL}`);
      console.error(`Available: ${OFFICIALS.map(o => o.dir).join(', ')}`);
      process.exit(1);
    }
  }

  const total = officialsToProcess.length;
  let completed = 0;

  for (const official of officialsToProcess) {
    completed++;
    log(`[${completed}/${total}] Starting ${official.name}`);
    try {
      await processOfficial(official, progress);
    } catch (err) {
      log(`  ERROR: ${err.message}`);
      if (VERBOSE) console.error(err.stack);
      progress[official.dir] = { ...progress[official.dir], status: 'error', error: err.message };
      try { saveProgress(progress); } catch { /* ignore */ }
    }
  }

  if (!DRY_RUN) {
    log('Generating INDEX.md...');
    fs.writeFileSync(INDEX_FILE, generateIndex(progress));
    log(`Index written to ${INDEX_FILE}`);
  }

  const stats = Object.values(progress);
  log('\n=== Summary ===');
  log(`Total officials: ${OFFICIALS.length}`);
  log(`Completed: ${stats.filter(s => s.status === 'completed').length}`);
  log(`Errors: ${stats.filter(s => s.status === 'error').length}`);
  log(`Total articles: ${stats.reduce((sum, s) => sum + (s.articleCount || 0), 0)}`);
  log('================');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
