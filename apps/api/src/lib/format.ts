export function formatNaira(amount: number): string {
  if (amount >= 1e12) {
    const val = amount / 1e12;
    return `₦${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}T`;
  }
  if (amount >= 1e9) {
    const val = amount / 1e9;
    return `₦${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}B`;
  }
  if (amount >= 1e6) {
    const val = amount / 1e6;
    return `₦${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
  }
  if (amount >= 1e3) {
    const val = amount / 1e3;
    return `₦${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
  }
  return `₦${amount.toLocaleString()}`;
}

export function formatNairaFull(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function formatNumber(num: number): string {
  if (num >= 1e6) {
    return `${(num / 1e6).toFixed(1)}M`;
  }
  if (num >= 1e3) {
    return `${(num / 1e3).toFixed(0)}K`;
  }
  return num.toLocaleString();
}

export function formatPercentage(value: number, total: number): string {
  return `${((value / total) * 100).toFixed(1)}%`;
}

/**
 * Post-process free text to replace verbose Naira amounts with shorthand.
 * Handles:
 *   ₦2,500,000,000 → ₦2.5B
 *   NGN 150.2 billion → ₦150.2B
 *   ₦20,000,000 → ₦20M
 *   2,500,000,000 (bare, inside markdown table cells) → ₦2.5B
 */
export function formatNairaInText(text: string): string {
  // 1. Replace long-form: "NGN 1.50 billion" / "₦150.2 billion" / "N2 trillion"
  text = text.replace(
    /(?:NGN|₦)\s*([\d,.]+)\s*(trillion|billion|million)/gi,
    (_, num, unit) => {
      const val = parseFloat(num.replace(/,/g, ''));
      const suffix = unit[0].toUpperCase() === 'T' ? 'T' : unit[0].toUpperCase() === 'B' ? 'B' : 'M';
      return `₦${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}${suffix}`;
    },
  );

  // 2. Replace comma-separated full numbers with ₦/NGN prefix: ₦2,500,000,000 → ₦2.5B
  text = text.replace(
    /(?:NGN|₦)\s*([\d,]{7,})/g,
    (_, numStr) => {
      const num = parseFloat(numStr.replace(/,/g, ''));
      return formatNaira(num);
    },
  );

  // 3. Replace bare comma-separated numbers (≥1M, no currency prefix) in contexts
  //    that look like table cells or bold markers: **2,500,000,000** or | 2,500,000,000 |
  text = text.replace(
    /(?<=\*\*|[|])\s*([\d,]{7,})(?=\s*(?:\*\*|[|]))/g,
    (_, numStr) => {
      const num = parseFloat(numStr.replace(/,/g, ''));
      if (num >= 1e6) return formatNaira(num);
      return numStr;
    },
  );

  return text;
}
