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
