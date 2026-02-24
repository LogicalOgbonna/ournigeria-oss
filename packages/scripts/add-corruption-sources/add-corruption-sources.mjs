#!/usr/bin/env node
/**
 * Corruption Case Source Finder & Screenshot Tool
 *
 * Discovers relevant EFCC press releases and news articles for each official,
 * takes full-page Playwright screenshots, and appends a ## Sources section
 * to every .md file with URLs and screenshot references.
 *
 * Usage:
 *   node packages/scripts/add-corruption-sources.mjs                          # full run
 *   node packages/scripts/add-corruption-sources.mjs --official Yahaya_Bello  # single official
 *   node packages/scripts/add-corruption-sources.mjs --discovery-only         # find URLs only
 *   node packages/scripts/add-corruption-sources.mjs --dry-run                # preview without writing
 *
 * Env vars:
 *   GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX  — use Google Custom Search API (avoids CAPTCHA)
 *   Without these, falls back to DuckDuckGo HTML scraping via Playwright.
 *
 * Features:
 *  - Resumable: progress tracked in .corruption-sources-progress.json
 *  - Rate-limited: configurable delays between requests
 *  - Retries: exponential back-off on failures
 *  - Screenshots: full-page PNG via Playwright
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Configuration ─────────────────────────────────────────────

const CORRUPTION_DIR = path.resolve(__dirname, '../../source/corruption');
const PROGRESS_FILE = path.resolve(__dirname, '.corruption-sources-progress.json');

const SEARCH_DELAY_MS = 3000;
const SCREENSHOT_DELAY_MS = 3000;
const OFFICIAL_DELAY_MS = 5000;
const MAX_URLS_PER_OFFICIAL = 15;
const SCREENSHOT_WIDTH = 1280;
const RETRY_ATTEMPTS = 3;
const RETRY_BASE_MS = 2000;

const MD_FILES = [
  'overview.md',
  'charges.md',
  'financial_details.md',
  'court_proceedings.md',
  'arrest_and_investigation.md',
  'case_outcome.md',
  'timeline.md',
  'key_players.md',
];

// Source domains and their short labels
const NEWS_SOURCES = {
  'efcc.gov.ng': 'EFCC',
  'premiumtimesng.com': 'PremiumTimes',
  'saharareporters.com': 'SaharaReporters',
  'punchng.com': 'Punch',
  'vanguardngr.com': 'Vanguard',
  'dailypost.ng': 'DailyPost',
  'thecable.ng': 'TheCable',
  'channelstv.com': 'ChannelsTV',
};

// Known aliases/alternate names for officials who have them
const ALIASES = {
  Diepreye_Alamieyeseigha: ['Alamieyeseigha', 'DSP Alamieyeseigha'],
  'Diezani_Alison-Madueke': ['Diezani', 'Alison-Madueke'],
  'Femi_Fani-Kayode': ['Fani-Kayode', 'FFK'],
  'Adebayo_Alao-Akala': ['Alao-Akala'],
  Muazu_Babangida_Aliyu: ['Babangida Aliyu'],
  Obong_Victor_Attah: ['Victor Attah'],
  Orji_Uzor_Kalu: ['Orji Kalu'],
};

// Keyword → .md file classification
const CLASSIFICATION_RULES = [
  { keywords: ['arraign', 'charge', 'count', 'indict', 'prosecut'], file: 'charges.md' },
  { keywords: ['convict', 'sentence', 'acquit', 'discharg', 'pardon', 'verdict', 'guilty'], file: 'case_outcome.md' },
  { keywords: ['arrest', 'surrender', 'wanted', 'detain', 'apprehend', 'flee', 'fled'], file: 'arrest_and_investigation.md' },
  { keywords: ['forfeit', 'asset', 'billion', 'million', 'property', 'properties', 'recover', 'seize', 'launder'], file: 'financial_details.md' },
  { keywords: ['court', 'bail', 'trial', 'judge', 'justice', 'hearing', 'adjourn', 'ruling', 'appeal'], file: 'court_proceedings.md' },
];

// ─── CLI Argument Parsing ──────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

function hasFlag(name) {
  return args.includes(name);
}

const SINGLE_OFFICIAL = getArg('--official');
const DISCOVERY_ONLY = hasFlag('--discovery-only');
const DRY_RUN = hasFlag('--dry-run');

const GOOGLE_CSE_API_KEY = process.env.GOOGLE_CSE_API_KEY || '';
const GOOGLE_CSE_CX = process.env.GOOGLE_CSE_CX || '';
const USE_GOOGLE_CSE = !!(GOOGLE_CSE_API_KEY && GOOGLE_CSE_CX);

if ((GOOGLE_CSE_API_KEY && !GOOGLE_CSE_CX) || (!GOOGLE_CSE_API_KEY && GOOGLE_CSE_CX)) {
  console.warn('WARNING: Only one of GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX is set. Both are required for Google CSE. Falling back to DuckDuckGo.');
}

// ─── Helpers ───────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(text, maxLen = 80) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, maxLen);
}

function officialDisplayName(dirName) {
  return dirName.replace(/_/g, ' ');
}

function getSourceLabel(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    for (const [domain, label] of Object.entries(NEWS_SOURCES)) {
      if (hostname.includes(domain)) return label;
    }
    // Fallback: use hostname
    return hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
  } catch {
    return 'Unknown';
  }
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveProgress(progress) {
  progress._updatedAt = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function withRetry(fn, label) {
  for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < RETRY_ATTEMPTS) {
        const backoff = RETRY_BASE_MS * Math.pow(2, attempt - 1); // 2s, 4s, 8s
        console.warn(`  Attempt ${attempt} failed for ${label}: ${msg}. Retrying in ${backoff}ms...`);
        await sleep(backoff);
      } else {
        console.error(`  Failed after ${RETRY_ATTEMPTS} attempts for ${label}: ${msg}`);
        return null;
      }
    }
  }
  return null;
}

// ─── URL Discovery ─────────────────────────────────────────────

async function discoverUrlsGoogleCSE(query) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_CSE_API_KEY}&cx=${GOOGLE_CSE_CX}&q=${encodeURIComponent(query)}&num=10`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('retry-after') || '60');
    console.warn(`  Google CSE rate limited. Waiting ${retryAfter}s...`);
    await sleep(retryAfter * 1000);
    throw new Error('Rate limited (will retry)');
  }
  if (!res.ok) {
    throw new Error(`Google CSE HTTP ${res.status}: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.items) return [];
  return data.items.map((item) => ({
    url: item.link,
    title: item.title || '',
  }));
}

async function discoverUrlsDuckDuckGo(query, page) {
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const results = await page.evaluate(() => {
      const links = document.querySelectorAll('.result__a');
      return Array.from(links).map((a) => {
        let url = a.href;
        // DDG HTML wraps results in redirect URLs; extract the real target
        try {
          const parsed = new URL(url);
          const uddg = parsed.searchParams.get('uddg');
          if (uddg) url = uddg;
        } catch { /* keep as-is */ }
        return { url, title: a.textContent?.trim() || '' };
      });
    });
    return results.filter((r) => r.url && !r.url.includes('duckduckgo.com'));
  } catch (err) {
    console.warn(`  DuckDuckGo search failed: ${err.message}`);
    return [];
  }
}

async function discoverUrlsForOfficial(officialDir, searchPage) {
  const name = officialDisplayName(officialDir);
  const aliases = ALIASES[officialDir] || [];
  const allResults = [];
  const seenUrls = new Set();

  function addResults(results) {
    for (const r of results) {
      // Normalize URL
      let url = r.url;
      try {
        const parsed = new URL(url);
        // Remove tracking params
        parsed.searchParams.delete('utm_source');
        parsed.searchParams.delete('utm_medium');
        parsed.searchParams.delete('utm_campaign');
        url = parsed.toString();
      } catch { /* keep as-is */ }

      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        allResults.push({ url, title: r.title });
      }
    }
  }

  // Search 1: EFCC site
  const efccQuery = `site:efcc.gov.ng "${name}" EFCC`;
  console.log(`  Searching: ${efccQuery}`);
  const searchFn = USE_GOOGLE_CSE
    ? () => discoverUrlsGoogleCSE(efccQuery)
    : () => discoverUrlsDuckDuckGo(efccQuery, searchPage);
  const efccResults = await withRetry(searchFn, `EFCC search for ${name}`) || [];
  addResults(efccResults);
  await sleep(SEARCH_DELAY_MS);

  // Search 2: if <2 EFCC results, try aliases
  if (allResults.length < 2 && aliases.length > 0) {
    for (const alias of aliases) {
      const aliasQuery = `site:efcc.gov.ng "${alias}" EFCC`;
      console.log(`  Searching alias: ${aliasQuery}`);
      const searchFnAlias = USE_GOOGLE_CSE
        ? () => discoverUrlsGoogleCSE(aliasQuery)
        : () => discoverUrlsDuckDuckGo(aliasQuery, searchPage);
      const aliasResults = await withRetry(searchFnAlias, `alias search for ${alias}`) || [];
      addResults(aliasResults);
      await sleep(SEARCH_DELAY_MS);
      if (allResults.length >= 2) break;
    }
  }

  // Search 3: Broader news search
  const newsQuery = `"${name}" EFCC corruption Nigeria`;
  console.log(`  Searching news: ${newsQuery}`);
  const newsSearchFn = USE_GOOGLE_CSE
    ? () => discoverUrlsGoogleCSE(newsQuery)
    : () => discoverUrlsDuckDuckGo(newsQuery, searchPage);
  const newsResults = await withRetry(newsSearchFn, `news search for ${name}`) || [];
  addResults(newsResults);
  await sleep(SEARCH_DELAY_MS);

  // If still low, search fallback news sites specifically
  if (allResults.length < 3) {
    const fallbackSites = ['premiumtimesng.com', 'punchng.com', 'saharareporters.com', 'thecable.ng'];
    for (const site of fallbackSites) {
      const siteQuery = `site:${site} "${name}" EFCC`;
      console.log(`  Searching fallback: ${siteQuery}`);
      const fbSearchFn = USE_GOOGLE_CSE
        ? () => discoverUrlsGoogleCSE(siteQuery)
        : () => discoverUrlsDuckDuckGo(siteQuery, searchPage);
      const fbResults = await withRetry(fbSearchFn, `fallback search ${site}`) || [];
      addResults(fbResults);
      await sleep(SEARCH_DELAY_MS);
      if (allResults.length >= 5) break;
    }
  }

  // Cap at max
  return allResults.slice(0, MAX_URLS_PER_OFFICIAL);
}

// ─── Date Extraction ───────────────────────────────────────────

async function extractPublicationDate(page) {
  return page.evaluate(() => {
    // Try meta tags first
    const metaSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="publish-date"]',
      'meta[name="date"]',
      'meta[property="og:article:published_time"]',
      'meta[name="DC.date.issued"]',
      'meta[itemprop="datePublished"]',
    ];
    for (const sel of metaSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const content = el.getAttribute('content');
        if (content) return content;
      }
    }

    // Try time/datetime elements
    const timeEl = document.querySelector('time[datetime]');
    if (timeEl) return timeEl.getAttribute('datetime');

    // Try common article header date patterns
    const datePatterns = [
      '.post-date', '.entry-date', '.article-date', '.pub-date',
      '.date', '.published', '.timestamp', '.meta-date',
      '[class*="date"]', '[class*="time"]',
    ];
    for (const sel of datePatterns) {
      const el = document.querySelector(sel);
      if (el && el.textContent) {
        const text = el.textContent.trim();
        // Check if it looks like a date
        if (/\d{4}/.test(text) || /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(text)) {
          return text;
        }
      }
    }

    return null;
  });
}

const MONTHS_MAP = {
  january: '01', jan: '01', february: '02', feb: '02',
  march: '03', mar: '03', april: '04', apr: '04',
  may: '05', june: '06', jun: '06', july: '07', jul: '07',
  august: '08', aug: '08', september: '09', sep: '09', sept: '09',
  october: '10', oct: '10', november: '11', nov: '11',
  december: '12', dec: '12',
};

function parseDateString(raw) {
  if (!raw) return 'unknown-date';

  // Strip ordinal suffixes (1st, 2nd, 3rd, 13th, etc.)
  const cleaned = raw.replace(/(\d{1,2})(?:st|nd|rd|th)\b/gi, '$1');

  // Try ISO format
  const isoMatch = cleaned.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  // Try "Month Day, Year" format
  const mdyMatch = cleaned.match(/(\w+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (mdyMatch) {
    const m = MONTHS_MAP[mdyMatch[1].toLowerCase()];
    if (m) return `${mdyMatch[3]}-${m}-${mdyMatch[2].padStart(2, '0')}`;
  }

  // Try "Day Month, Year" or "Day Month Year" format
  const dmyMatch = cleaned.match(/(\d{1,2})\s+(\w+),?\s+(\d{4})/);
  if (dmyMatch) {
    const m = MONTHS_MAP[dmyMatch[2].toLowerCase()];
    if (m) return `${dmyMatch[3]}-${m}-${dmyMatch[1].padStart(2, '0')}`;
  }

  // Try to extract from URL-like patterns (e.g., /2024/12/13/)
  const urlDateMatch = cleaned.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (urlDateMatch) return `${urlDateMatch[1]}-${urlDateMatch[2]}-${urlDateMatch[3]}`;

  return 'unknown-date';
}

function extractDateFromUrl(url) {
  const match = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const match2 = url.match(/\/(\d{4})\/(\d{2})\//);
  if (match2) return `${match2[1]}-${match2[2]}-01`;
  return null;
}

// ─── Screenshots ───────────────────────────────────────────────

async function screenshotUrl(browser, articleInfo, officialDir) {
  const { url, title } = articleInfo;
  const sourceLabel = getSourceLabel(url);
  const outDir = path.join(CORRUPTION_DIR, officialDir);

  const page = await browser.newPage();
  try {
    page.setDefaultTimeout(30000);
    await page.setViewportSize({ width: SCREENSHOT_WIDTH, height: 800 });

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000); // Allow images/CSS to load

    // Extract publication date
    const rawDate = await extractPublicationDate(page);
    let date = parseDateString(rawDate);
    if (date === 'unknown-date') {
      const urlDate = extractDateFromUrl(url);
      if (urlDate) date = urlDate;
    }

    // Extract page title if we don't already have one
    const pageTitle = title || (await page.title()) || 'untitled';

    // Build screenshot filename
    const titleSlug = slugify(pageTitle, 80) || 'untitled';
    const screenshotName = `${sourceLabel}_${date}_${titleSlug}.png`;
    const screenshotPath = path.join(outDir, screenshotName);

    if (!DRY_RUN) {
      await page.screenshot({ path: screenshotPath, fullPage: true });
    }

    return {
      url,
      title: pageTitle,
      date,
      sourceLabel,
      screenshotName,
      screenshotPath,
    };
  } catch (err) {
    console.warn(`  Screenshot failed for ${url}: ${err.message}`);
    // Return partial info without screenshot
    const titleSlug = slugify(title || 'untitled', 80);
    const date = extractDateFromUrl(url) || 'unknown-date';
    return {
      url,
      title: title || url,
      date,
      sourceLabel,
      screenshotName: null,
      screenshotPath: null,
    };
  } finally {
    await page.close();
  }
}

// ─── Article Classification ────────────────────────────────────

function classifyArticle(title) {
  const lower = (title || '').toLowerCase();
  const matched = new Set();

  for (const rule of CLASSIFICATION_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw)) {
        matched.add(rule.file);
        break;
      }
    }
  }

  // Default to overview.md if nothing matched
  if (matched.size === 0) {
    matched.add('overview.md');
  }

  // All articles also go to timeline.md and key_players.md
  matched.add('timeline.md');
  matched.add('key_players.md');

  return Array.from(matched);
}

// ─── .md File Updater ──────────────────────────────────────────

function buildSourceEntry(article) {
  const datePart = article.date !== 'unknown-date' ? ` (${article.date})` : '';
  let entry = `- [${article.title}](${article.url})${datePart} - *${article.sourceLabel}*`;
  if (article.screenshotName) {
    entry += `\n  - Screenshot: [${article.screenshotName}](./${article.screenshotName})`;
  }
  return entry;
}

function appendSourcesToMdFile(filePath, articles) {
  if (articles.length === 0) return false;

  let content = fs.readFileSync(filePath, 'utf-8');

  // If there's already a ## Sources section, remove it to rebuild
  const sourcesIdx = content.indexOf('\n## Sources');
  if (sourcesIdx !== -1) {
    content = content.slice(0, sourcesIdx);
  } else if (content.startsWith('## Sources')) {
    content = '';
  }

  // Also trim trailing whitespace/newlines
  content = content.trimEnd();

  // Sort articles by date (known dates first, then unknown)
  const sorted = [...articles].sort((a, b) => {
    if (a.date === 'unknown-date' && b.date !== 'unknown-date') return 1;
    if (a.date !== 'unknown-date' && b.date === 'unknown-date') return -1;
    return b.date.localeCompare(a.date); // newest first
  });

  const sourcesSection = [
    '',
    '',
    '---',
    '',
    '## Sources',
    '',
    ...sorted.map(buildSourceEntry),
    '',
  ].join('\n');

  if (!DRY_RUN) {
    fs.writeFileSync(filePath, content + sourcesSection);
  }

  return true;
}

// ─── Main Processing ───────────────────────────────────────────

async function processOfficial(officialDir, browser, searchPage, progress) {
  const officialPath = path.join(CORRUPTION_DIR, officialDir);
  const name = officialDisplayName(officialDir);

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Processing: ${name}`);
  console.log(`${'='.repeat(60)}`);

  const officialProgress = progress[officialDir] || {};

  // Step 1: Discover URLs (skip if already discovered)
  let discovered;
  if (officialProgress.status === 'discovered' || officialProgress.status === 'screenshotted') {
    discovered = (officialProgress.discoveredUrls || []).map((u) =>
      typeof u === 'string' ? { url: u, title: '' } : u,
    );
    console.log(`\n  [1/4] Using ${discovered.length} previously discovered URLs`);
  } else {
    console.log('\n  [1/4] Discovering URLs...');
    discovered = await discoverUrlsForOfficial(officialDir, searchPage);
    console.log(`  Found ${discovered.length} unique URLs`);
  }

  if (discovered.length === 0) {
    console.warn(`  WARNING: No URLs found for ${name}. Skipping.`);
    return { official: officialDir, status: 'no-urls', urls: 0, screenshots: 0 };
  }

  // Save discovery progress
  progress[officialDir] = {
    status: 'discovered',
    discoveredUrls: discovered.map((d) => ({ url: d.url, title: d.title })),
    updatedAt: new Date().toISOString(),
  };
  saveProgress(progress);

  if (DISCOVERY_ONLY) {
    console.log('  [discovery-only] URLs found:');
    for (const d of discovered) {
      console.log(`    - ${d.title || d.url}`);
      console.log(`      ${d.url}`);
    }
    return { official: officialDir, status: 'discovered', urls: discovered.length, screenshots: 0 };
  }

  // Step 2: Screenshot each URL
  console.log('\n  [2/4] Taking screenshots...');
  const articles = [];
  for (let i = 0; i < discovered.length; i++) {
    const d = discovered[i];
    console.log(`  (${i + 1}/${discovered.length}) ${d.url}`);

    const article = await withRetry(
      () => screenshotUrl(browser, d, officialDir),
      d.url,
    );

    if (article) {
      articles.push(article);
    }

    if (i < discovered.length - 1) {
      await sleep(SCREENSHOT_DELAY_MS);
    }
  }

  // Save screenshot progress
  progress[officialDir] = {
    ...progress[officialDir],
    status: 'screenshotted',
    updatedAt: new Date().toISOString(),
  };
  saveProgress(progress);

  const screenshotCount = articles.filter((a) => a.screenshotName).length;
  console.log(`  Captured ${screenshotCount} screenshots out of ${articles.length} articles`);

  if (DRY_RUN) {
    console.log('  [dry-run] Would update .md files with:');
    for (const a of articles) {
      console.log(`    - ${a.title} (${a.date}) -> ${classifyArticle(a.title).join(', ')}`);
    }
    return { official: officialDir, status: 'dry-run', urls: discovered.length, screenshots: screenshotCount };
  }

  // Step 3: Classify articles to .md files
  console.log('\n  [3/4] Classifying articles...');
  const fileArticleMap = {};
  for (const mdFile of MD_FILES) {
    fileArticleMap[mdFile] = [];
  }

  for (const article of articles) {
    const targetFiles = classifyArticle(article.title);
    for (const tf of targetFiles) {
      if (fileArticleMap[tf]) {
        fileArticleMap[tf].push(article);
      }
    }
  }

  // Step 4: Update .md files
  console.log('\n  [4/4] Updating .md files...');
  let updatedCount = 0;
  for (const [mdFile, mdArticles] of Object.entries(fileArticleMap)) {
    if (mdArticles.length === 0) continue;

    const filePath = path.join(officialPath, mdFile);
    if (!fs.existsSync(filePath)) {
      console.warn(`  File not found: ${filePath}`);
      continue;
    }

    const updated = appendSourcesToMdFile(filePath, mdArticles);
    if (updated) {
      console.log(`  Updated ${mdFile} with ${mdArticles.length} sources`);
      updatedCount++;
    }
  }

  console.log(`  Updated ${updatedCount} .md files`);
  return { official: officialDir, status: 'completed', urls: discovered.length, screenshots: screenshotCount };
}

// ─── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('=== Corruption Case Source Finder ===');
  console.log(`Corruption dir: ${CORRUPTION_DIR}`);
  console.log(`Search method: ${USE_GOOGLE_CSE ? 'Google CSE API' : 'DuckDuckGo (Playwright)'}`);
  if (SINGLE_OFFICIAL) console.log(`Single official: ${SINGLE_OFFICIAL}`);
  if (DISCOVERY_ONLY) console.log('Mode: discovery-only');
  if (DRY_RUN) console.log('Mode: dry-run');
  console.log('');

  // Get list of officials
  let officials;
  if (SINGLE_OFFICIAL) {
    const officialPath = path.join(CORRUPTION_DIR, SINGLE_OFFICIAL);
    if (!fs.existsSync(officialPath)) {
      console.error(`Official directory not found: ${officialPath}`);
      process.exit(1);
    }
    officials = [SINGLE_OFFICIAL];
  } else {
    officials = fs.readdirSync(CORRUPTION_DIR)
      .filter((d) => {
        const p = path.join(CORRUPTION_DIR, d);
        return fs.statSync(p).isDirectory() && !d.startsWith('.');
      })
      .sort();
  }

  console.log(`Officials to process: ${officials.length}\n`);

  // Load progress
  const progress = loadProgress();

  // Launch Playwright
  let browser = null;
  let searchPage = null;

  if (!DISCOVERY_ONLY || !USE_GOOGLE_CSE) {
    const { chromium } = await import('playwright');
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });
    searchPage = await context.newPage();
  }

  const results = [];

  try {
    for (let i = 0; i < officials.length; i++) {
      const officialDir = officials[i];

      // Check progress for resumability
      const officialProgress = progress[officialDir];
      if (officialProgress && officialProgress.status === 'completed' && !SINGLE_OFFICIAL) {
        console.log(`Skipping ${officialDisplayName(officialDir)} (already completed)`);
        results.push({ official: officialDir, status: 'skipped' });
        continue;
      }

      const result = await processOfficial(officialDir, browser, searchPage, progress);
      results.push(result);

      // Save final progress (merge with intermediate state to preserve discoveredUrls)
      progress[officialDir] = {
        ...progress[officialDir],
        status: result.status,
        urls: result.urls,
        screenshots: result.screenshots,
        updatedAt: new Date().toISOString(),
      };
      saveProgress(progress);

      // Delay between officials
      if (i < officials.length - 1) {
        await sleep(OFFICIAL_DELAY_MS);
      }
    }
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('=== Summary ===');
  console.log(`${'='.repeat(60)}`);

  const completed = results.filter((r) => r.status === 'completed');
  const noUrls = results.filter((r) => r.status === 'no-urls');
  const skipped = results.filter((r) => r.status === 'skipped');
  const totalUrls = results.reduce((s, r) => s + (r.urls || 0), 0);
  const totalScreenshots = results.reduce((s, r) => s + (r.screenshots || 0), 0);

  console.log(`Processed: ${completed.length}`);
  console.log(`Skipped (already done): ${skipped.length}`);
  console.log(`No URLs found: ${noUrls.length}`);
  if (noUrls.length > 0) {
    console.log(`  ${noUrls.map((r) => officialDisplayName(r.official)).join(', ')}`);
  }
  console.log(`Total URLs discovered: ${totalUrls}`);
  console.log(`Total screenshots: ${totalScreenshots}`);
  console.log(`\nProgress saved to: ${PROGRESS_FILE}`);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
