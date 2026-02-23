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

export function formatForTelegram(richContent: AIResponseContent): TelegramOutput {
  const sections: string[] = [];

  // Main text
  if (richContent.text) {
    sections.push(richContent.text);
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
        `- ${item.count.toLocaleString()} ${item.label} (at ${formatNaira(item.unitCost)} each)`,
    );
    sections.push(`<b>${header}</b>\n${lines.join('\n')}`);
  }

  // Officials
  if (richContent.officials && richContent.officials.length > 0) {
    const lines: string[] = [];
    for (const group of richContent.officials) {
      lines.push(`<b>${group.state} ${group.year}</b>`);
      for (const o of group.officials) {
        lines.push(`- ${o.role}: ${o.name}${o.party ? ` (${o.party})` : ''}`);
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
