#!/usr/bin/env node
/**
 * GovSpend.ng Scraper
 *
 * Downloads all payment records from https://app.govspend.ng/api/payments/
 * and organises them into:
 *
 *   packages/source/govspend/{year}/{month}/{day}/{beneficiary_slug}/{payment_no}.md
 *   packages/source/govspend/{year}/{month}/{day}/{beneficiary_slug}/{payment_no}.json
 *
 * Usage:
 *   node packages/scripts/scrape-govspend.mjs              # full run (resumes automatically)
 *   node packages/scripts/scrape-govspend.mjs --from 100   # start from page 100
 *   node packages/scripts/scrape-govspend.mjs --delay 500  # 500ms between requests
 *
 * Features:
 *  - Resumable: tracks the last page scraped in a progress file
 *  - Rate-limited: configurable delay between requests
 *  - Retries: exponential back-off on failures
 *  - Deduplicates: skips payments that already exist on disk
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Configuration ─────────────────────────────────────────────

const API_BASE = 'https://app.govspend.ng/api/payments/';
const PER_PAGE = 100;

// Parse CLI args
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}

const DELAY_MS = Number(getArg('--delay') || 300);
const FORCE_FROM = getArg('--from') ? Number(getArg('--from')) : null;

const OUTPUT_DIR = path.resolve(__dirname, '../source/govspend');
const PROGRESS_FILE = path.join(OUTPUT_DIR, '.scrape-progress.json');
const STATS_FILE = path.join(OUTPUT_DIR, '.scrape-stats.json');

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ─── Helpers ───────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch {
      return null;
    }
  }
  return null;
}

function saveProgress(progress) {
  progress.updatedAt = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function fetchPage(page, retries = 5) {
  const url = `${API_BASE}?page=${page}&count=${PER_PAGE}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(300_000),
      });

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('retry-after') || '10');
        console.warn(`  Rate limited. Waiting ${retryAfter}s...`);
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < retries) {
        const backoff = attempt * 2000;
        console.warn(`  Attempt ${attempt} failed: ${msg}. Retrying in ${backoff}ms...`);
        await sleep(backoff);
      } else {
        throw new Error(`Failed after ${retries} attempts: ${msg}`);
      }
    }
  }

  throw new Error('Unreachable');
}

function formatAmount(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
}

function buildPaymentDocument(payment) {
  const [yearStr, monthStr, dayStr] = payment.date.split('-');
  const monthName = MONTHS[parseInt(monthStr, 10)] || monthStr;

  return [
    `# Payment Record: ${payment.payment_no}`,
    '',
    `**Date:** ${dayStr} ${monthName} ${yearStr}`,
    `**Payment Number:** ${payment.payment_no}`,
    `**Payer Code:** ${payment.payer_code}`,
    `**Organisation (MDA):** ${payment.organization_name}`,
    `**Beneficiary:** ${payment.beneficiary_name}`,
    `**Amount:** ${formatAmount(payment.amount)}`,
    '',
    '## Description',
    '',
    payment.description,
    '',
    '---',
    '',
    '## Reference',
    '',
    `- **Source:** [GovSpend.ng](https://www.govspend.ng)`,
    `- **Explore Page:** [https://www.govspend.ng/explore/](https://www.govspend.ng/explore/)`,
    `- **API Endpoint:** [https://app.govspend.ng/api/payments/${payment.payment_no}](https://app.govspend.ng/api/payments/${payment.payment_no})`,
    '',
  ].join('\n');
}

function savePayment(payment) {
  const [yearStr, monthStr, dayStr] = payment.date.split('-');
  const monthNum = parseInt(monthStr, 10);
  const monthName = MONTHS[monthNum] || monthStr;
  const day = parseInt(dayStr, 10).toString();

  const beneficiarySlug = slugify(payment.beneficiary_name);
  const dir = path.join(OUTPUT_DIR, yearStr, monthName, day, beneficiarySlug);
  const safePaymentNo = payment.payment_no.replace(/[/\\:*?"<>|]/g, '_');
  const filePath = path.join(dir, `${safePaymentNo}.md`);

  if (fs.existsSync(filePath)) {
    return false;
  }

  fs.mkdirSync(dir, { recursive: true });

  // Write markdown document (human-readable)
  fs.writeFileSync(filePath, buildPaymentDocument(payment));

  // Write companion JSON (machine-readable)
  const jsonPath = path.join(dir, `${safePaymentNo}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify({
    ...payment,
    source_url: `https://app.govspend.ng/api/payments/${payment.payment_no}`,
    explore_url: 'https://www.govspend.ng/explore/',
    scraped_at: new Date().toISOString(),
  }, null, 2));

  return true;
}

// ─── Main ──────────────────────────────────────────────────────

async function main() {
  console.log('=== GovSpend.ng Scraper ===');
  console.log(`Output: ${OUTPUT_DIR}`);
  console.log(`Per page: ${PER_PAGE} | Delay: ${DELAY_MS}ms\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let progress = loadProgress();
  let startPage = 1;

  if (FORCE_FROM) {
    startPage = FORCE_FROM;
    console.log(`Forced start from page ${startPage}`);
  } else if (progress) {
    startPage = progress.lastPage + 1;
    console.log(`Resuming from page ${startPage} (${progress.totalSaved.toLocaleString()} payments saved previously)`);
  } else {
    console.log('Starting fresh scrape...');
  }

  if (!progress) {
    progress = {
      lastPage: 0,
      totalPages: 0,
      totalSaved: 0,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  // Fetch first page to get pagination info
  console.log(`\nFetching page ${startPage}...`);
  const firstResponse = await fetchPage(startPage);
  const totalPages = firstResponse.last;
  progress.totalPages = totalPages;

  const totalTransactions = totalPages * PER_PAGE;
  console.log(`Total pages: ${totalPages.toLocaleString()} (~${totalTransactions.toLocaleString()} transactions)`);
  if (firstResponse.stats) {
    console.log(`DB stats: ${firstResponse.stats.num_transactions.toLocaleString()} transactions | ${formatAmount(firstResponse.stats.total_amount)}`);
    console.log(`  ${firstResponse.stats.num_orgs} organisations | ${firstResponse.stats.num_beneficiaries.toLocaleString()} beneficiaries`);
  }
  console.log('');

  // Process first page
  let newCount = 0;
  for (const payment of firstResponse.results) {
    if (savePayment(payment)) newCount++;
  }
  progress.totalSaved += newCount;
  progress.lastPage = startPage;
  saveProgress(progress);

  const skipCount = firstResponse.results.length - newCount;
  console.log(`Page ${startPage}/${totalPages} — ${newCount} new, ${skipCount} skipped`);

  // Process remaining pages
  for (let page = startPage + 1; page <= totalPages; page++) {
    await sleep(DELAY_MS);

    try {
      const response = await fetchPage(page);
      newCount = 0;
      for (const payment of response.results) {
        if (savePayment(payment)) newCount++;
      }
      progress.totalSaved += newCount;
      progress.lastPage = page;

      // Save progress every 10 pages
      if (page % 10 === 0) {
        saveProgress(progress);
      }

      const pct = ((page / totalPages) * 100).toFixed(1);

      // Print every 5 pages (or last page)
      if (page % 5 === 0 || page === totalPages) {
        console.log(`Page ${page}/${totalPages} (${pct}%) — ${progress.totalSaved.toLocaleString()} total saved`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`\n*** Error on page ${page}: ${msg}`);
      saveProgress(progress);
      console.log(`Progress saved at page ${page}. Run again to resume.\n`);
      process.exit(1);
    }
  }

  // Final save
  saveProgress(progress);

  const stats = {
    totalPages,
    totalPaymentsSaved: progress.totalSaved,
    startedAt: progress.startedAt,
    completedAt: new Date().toISOString(),
    source: 'https://www.govspend.ng/explore/',
    api: API_BASE,
  };
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));

  console.log(`\n=== Scraping complete ===`);
  console.log(`Total payments saved: ${progress.totalSaved.toLocaleString()}`);
  console.log(`Output: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
