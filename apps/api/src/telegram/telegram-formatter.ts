import type { AIResponseContent } from '../types';
import { formatNaira } from '../lib/format';

interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

interface TelegramOutput {
  text: string;
  replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] };
}

/**
 * Convert markdown (as produced by LLMs) to Telegram-compatible HTML.
 * Telegram supports: <b>, <i>, <u>, <s>, <code>, <pre>, <a href="">.
 */
function mdToTelegramHtml(md: string): string {
  let text = md;

  // Escape HTML entities first (except we'll add our own tags after)
  text = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Code blocks: ```lang?\n...\n``` → <pre>...</pre>
  text = text.replace(/```[\w]*\n([\s\S]*?)```/g, (_m, code) => {
    return `<pre>${code.trim()}</pre>`;
  });

  // Inline code: `...` → <code>...</code>
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers: ## text → bold line
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>');

  // Bold+italic: ***text*** or ___text___
  text = text.replace(/\*{3}(.+?)\*{3}/g, '<b><i>$1</i></b>');

  // Bold: **text** or __text__
  text = text.replace(/\*{2}(.+?)\*{2}/g, '<b>$1</b>');
  text = text.replace(/__(.+?)__/g, '<b>$1</b>');

  // Italic: *text* or _text_  (avoid matching mid-word underscores)
  text = text.replace(/(?<!\w)\*([^*\n]+?)\*(?!\w)/g, '<i>$1</i>');
  text = text.replace(/(?<!\w)_([^_\n]+?)_(?!\w)/g, '<i>$1</i>');

  // Strikethrough: ~~text~~
  text = text.replace(/~~(.+?)~~/g, '<s>$1</s>');

  // Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Bullet lists: lines starting with - or * (but not inside <pre>)
  text = text.replace(/^[-*]\s+/gm, '• ');

  // Numbered lists: clean up "1. " style (keep as-is, just ensure clean)
  // These render fine in Telegram as plain text

  // Horizontal rules: --- or *** → simple line
  text = text.replace(/^[-*_]{3,}$/gm, '—————');

  return text.trim();
}

export function formatForTelegram(richContent: AIResponseContent): TelegramOutput {
  const sections: string[] = [];

  // Main text — convert markdown to Telegram HTML
  if (richContent.text) {
    sections.push(mdToTelegramHtml(richContent.text));
  }

  // Stats → bold "Key Figures" section
  if (richContent.stats && richContent.stats.length > 0) {
    const lines = richContent.stats.map(
      (s) => `<b>${s.label}</b>: ${s.value}`,
    );
    sections.push(`<b>Key Figures</b>\n${lines.join('\n')}`);
  }

  // Money equivalents → bulleted list
  if (richContent.moneyEquivalents && richContent.moneyEquivalents.items.length > 0) {
    const { title, amount, items } = richContent.moneyEquivalents;
    const header = title || `What ${formatNaira(amount)} could fund`;
    const lines = items.map(
      (item) =>
        `• ${item.count.toLocaleString()} ${item.label} (at ${formatNaira(item.unitCost)} each)`,
    );
    sections.push(`<b>${header}</b>\n${lines.join('\n')}`);
  }

  // Officials
  if (richContent.officials && richContent.officials.length > 0) {
    const lines: string[] = [];
    for (const group of richContent.officials) {
      lines.push(`<b>${group.state} ${group.year}</b>`);
      for (const o of group.officials) {
        lines.push(`• ${o.role}: ${o.name}${o.party ? ` (${o.party})` : ''}`);
      }
    }
    sections.push(lines.join('\n'));
  }

  // State comparison → text table
  if (richContent.stateComparison) {
    const { state1, state2 } = richContent.stateComparison;
    sections.push(
      `<b>State Comparison</b>\n${state1.name}: ${formatNaira(state1.budget)} | Per capita: ${formatNaira(state1.perCapita)}\n${state2.name}: ${formatNaira(state2.budget)} | Per capita: ${formatNaira(state2.perCapita)}`,
    );
  }

  const text = sections.join('\n\n');

  // Follow-ups → inline keyboard buttons
  let replyMarkup: TelegramOutput['replyMarkup'];
  if (richContent.followUps && richContent.followUps.length > 0) {
    const buttons: InlineKeyboardButton[][] = richContent.followUps.map((f) => [
      {
        text: f.text.length > 64 ? f.text.slice(0, 61) + '...' : f.text,
        callback_data: 'fup:' + f.text.slice(0, 59),
      },
    ]);
    replyMarkup = { inline_keyboard: buttons };
  }

  return { text, replyMarkup };
}
