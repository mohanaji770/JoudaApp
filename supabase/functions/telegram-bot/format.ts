// ═══════════════════════════════════════════════════════
// format.ts — Date formatting & message helpers
// ═══════════════════════════════════════════════════════

/**
 * Format date in Gregorian 12-hour format.
 * NEVER use toLocaleString('ar-SA') — it produces Hijri dates.
 * Example output: "2026-05-22 5:30 م"
 */
export function fmtDate(d?: Date | string): string {
  const date = d ? new Date(d) : new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  let h = date.getHours();
  const period = h >= 12 ? 'م' : 'ص';
  h = h % 12;
  if (h === 0) h = 12;
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day} ${h}:${min} ${period}`;
}

/** Normalize phone number to international format (967...) */
export function formatPhone(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) clean = '967' + clean.slice(1);
  else if (!clean.startsWith('967')) clean = '967' + clean;
  return clean;
}

/** Build a WhatsApp deep link URL */
export function whatsappLink(phone: string, text: string): string {
  return `https://api.whatsapp.com/send?phone=${formatPhone(phone)}&text=${encodeURIComponent(text)}`;
}

/** Build an HTML <a> tag linking to WhatsApp */
export function whatsappButton(phone: string, text: string): string {
  const url = whatsappLink(phone, text);
  return `<a href="${url}">📱 إرسال إشعار للعميل عبر واتساب</a>`;
}

/** Format payment method label */
export function paymentLabel(method: string): string {
  const map: Record<string, string> = {
    CASH: 'كاش',
    BANK: 'بنك',
    WALLET: 'محفظة',
  };
  return map[method] || method;
}
