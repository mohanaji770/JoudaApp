export function formatDate(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

export function ymd(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toISOString().slice(0, 10);
}

export function time(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toISOString().slice(11, 19).slice(0, 5);
}

export function invoiceCard(rec: Record<string, unknown>, itemCount: number, collector?: string) {
  const subtotal = Number(rec.subtotal || 0);
  const discount = Number(rec.discount || 0);
  const amount = Math.max(subtotal - discount, 0);
  const delivery = Number(rec.delivery_fee || 0);
  const pm = rec.payment_method === 'CASH' ? 'Cash' : rec.payment_method === 'BANK' ? 'Bank' : rec.payment_method || '?';

  return [
    `<code>${rec.id}</code> | ${rec.customer_name_snapshot || '—'} | ${amount.toLocaleString()} YER`,
    `Delivery ${delivery} | ${pm}${collector ? ` | Collector: ${collector}` : ''}`,
    `Items: ${itemCount}`,
    formatDate(rec.created_at as string),
  ].join('\n');
}

export function orderCard(order: Record<string, unknown>, items: { name: string; qty: number }[]) {
  const lines = items.map(i => `  ${i.name} x${i.qty}`).join('\n');
  return [
    `<code>${order.order_number || order.id}</code> | ${order.customer_name} | ${Number(order.total || 0).toLocaleString()} YER`,
    order.customer_phone ? `Phone: ${order.customer_phone}` : '',
    order.customer_address ? `Address: ${order.customer_address}` : '',
    `Items:`,
    lines,
    `Status: ${order.status || 'new'}`,
    formatDate(order.created_at as string),
  ].filter(Boolean).join('\n');
}

export function workflowLine(action: string, actor: string, ts?: string) {
  return `>> ${action} — ${actor} (${ts || time()})`;
}

export function reversedBlock(id: string, actor: string) {
  return [
    `REVERSED: <code>${id}</code>`,
    workflowLine('Reversed', actor),
  ].join('\n');
}

export const HELP_TEXT =
  'Commands:\n' +
  '/orders — Pending orders\n' +
  '/order [num] — Order detail\n' +
  '/stock [barcode] — Product stock\n' +
  '/lowstock — Low stock alerts\n' +
  '/today — Today sales\n' +
  '/profit [week|month] — Profit report\n' +
  '/wallet [name] — Collector balance\n' +
  '/expiry [days] — Near-expiry products\n' +
  '/search [name] — Find product\n' +
  '/expense [amount] [note] — Record expense\n' +
  '/briefing — Morning report\n' +
  '/maintenance on|off — Toggle maintenance\n' +
  '/status — System status';
