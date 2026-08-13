/**
 * Indian-format currency and number helpers.
 *
 * Everything that renders a price goes through here so the lakh/crore grouping
 * and the tabular alignment stay consistent across the site. Formatting is
 * locale-stable on purpose: ₹1,19,236 reads the same in both languages, and
 * switching the digit set would break the tabular price columns.
 */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const plain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function formatINR(value: number): string {
  return inr.format(Math.round(value));
}

export function formatNumber(value: number): string {
  return plain.format(Math.round(value));
}

/** Short form for chips and cards: ₹87,171 → ₹87,171; ₹1,45,640 → ₹1.46 L */
export function formatShortINR(value: number): string {
  if (value >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(2)} L`;
  }
  return formatINR(value);
}

export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${suffix}` : `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}
