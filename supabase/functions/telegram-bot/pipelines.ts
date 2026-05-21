import { send } from './bot.ts';
import { jouda, inventory } from './db.ts';
import { buildKeyboard } from './workflow.ts';
import { invoiceCard, formatDate } from './templates.ts';

const GROUP_IDS = () => (Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || '').split(',').map(s => s.trim()).filter(Boolean);

export async function handleNewInvoice(record: any) {
  if (!record.customer_name_snapshot) return;

  const inv = inventory();

  // Fetch item count
  const { count } = await inv
    .from('invoice_items')
    .select('id', { count: 'exact', head: true })
    .eq('invoice_id', record.id);

  // Get collector name
  let collector = '';
  if (record.collector_id) {
    const { data: u } = await inv.from('users').select('name').eq('id', record.collector_id).single();
    if (u) collector = u.name;
  }

  // Create tracking in JoudaApp
  try {
    await jouda().from('customer_orders').insert({
      id: crypto.randomUUID(),
      quotation_id: record.id,
      order_number: record.id,
      customer_name: record.customer_name_snapshot,
      customer_phone: record.customer_phone_snapshot || '',
      customer_address: record.customer_address_snapshot || null,
      subtotal: record.subtotal || 0,
      delivery_fee: record.delivery_fee || 0,
      total: record.total_amount || 0,
      payment_method: record.payment_method || 'CASH',
      status: 'pending',
    });
  } catch { /* non-critical */ }

  const msg = invoiceCard(record, count || 0, collector);
  const kb = buildKeyboard(record.id, 'pending');

  for (const gId of GROUP_IDS()) {
    try { await send(gId, msg, kb); } catch { /* */ }
  }
}

export async function handleReversedInvoice(record: any) {
  if (!record.is_voided) return;

  try {
    await jouda().from('customer_orders').update({ status: 'cancelled' }).eq('quotation_id', record.id);
  } catch { /* */ }

  const msg = [
    `REVERSED: <code>${record.id}</code>`,
    `Amount: ${Number(record.total_amount || 0).toLocaleString()} YER`,
    `Stock restored | ${formatDate()}`,
  ].join('\n');

  for (const gId of GROUP_IDS()) {
    try { await send(gId, msg); } catch { /* */ }
  }
}
