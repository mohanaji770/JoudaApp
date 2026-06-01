// ═══════════════════════════════════════════════════════
// incoming.ts — Handle new/reversed invoices from POS
// ═══════════════════════════════════════════════════════
//
// Called when Inventory DB webhook fires on invoices table.
// INSERT (POSTED) → send to group with inv_* buttons
// UPDATE (is_voided) → notify group + cancel in JoudaApp

import { sendMessage } from './telegram.ts';
import { getClients } from './db.ts';
import { env } from './config.ts';
import { invButtons } from './workflow.ts';
import { fmtDate, paymentLabel } from './format.ts';

// ─── New Invoice (POS → Group) ──────────────────────────

export async function handleNewInvoice(record: any) {
  if (!record.customer_name_snapshot) return;

  const token = env.botToken();
  const { jouda, inventory } = getClients();

  // Fetch invoice items
  const { data: items } = await inventory
    .from('invoice_items')
    .select('product_name_snapshot, quantity')
    .eq('invoice_id', record.id);

  // Get collector name
  let collectorName = '—';
  if (record.collector_id) {
    const { data: user } = await inventory
      .from('users')
      .select('name')
      .eq('id', record.collector_id)
      .single();
    if (user) collectorName = user.name;
  }

  // Create tracking record in JoudaApp
  try {
    await jouda.from('customer_orders').insert({
      quotation_id: record.id,
      order_number: record.id,
      customer_name: record.customer_name_snapshot,
      customer_phone: record.customer_phone_snapshot || '',
      customer_address: record.customer_address_snapshot || null,
      subtotal: record.subtotal || 0,
      delivery_fee: record.delivery_fee || 0,
      total: record.total_amount || 0,
      payment_method: record.payment_method || 'CASH',
      status: 'submitted',
    });
  } catch (e) {
    console.warn('Failed to create customer_order:', e);
  }

  // Build message
  const itemCount = items?.length || 0;
  const itemsList = (items || [])
    .slice(0, 8)
    .map((i: any) => `• ${i.product_name_snapshot} × ${i.quantity}`)
    .join('\n');
  const extraItems =
    itemCount > 8 ? `\n<i>+ ${itemCount - 8} صنف آخر...</i>` : '';

  const subtotal = record.subtotal || 0;
  const discount = record.discount || 0;
  const companyAmount = Math.max(subtotal - discount, 0);
  const deliveryFee = record.delivery_fee || 0;

  const message = `\
🛒 <b>فاتورة جديدة — POS</b>
<code>${record.id}</code>
👤 العميل: ${record.customer_name_snapshot}

💰 المبلغ: ${companyAmount.toLocaleString()} ر.ي
🚚 توصيل: ${deliveryFee.toLocaleString()} ر.ي
💳 الدفع: ${paymentLabel(record.payment_method || 'CASH')}
${record.collector_id ? `👤 المحصل: ${collectorName}` : ''}
📦 الأصناف (${itemCount}):
${itemsList}${extraItems}

📅 ${fmtDate()}`;

  const keyboard = { inline_keyboard: invButtons(record.id, 'pending') };

  for (const gId of env.groupIds()) {
    try {
      await sendMessage(token, gId, message, { reply_markup: keyboard });
    } catch (e) {
      console.error(`Failed to send invoice to ${gId}:`, e);
    }
  }
}

// ─── Reversed Invoice ───────────────────────────────────

export async function handleReversedInvoice(record: any) {
  if (!record.is_voided) return;

  const token = env.botToken();
  const { jouda } = getClients();

  // Cancel tracking in JoudaApp
  try {
    await jouda
      .from('customer_orders')
      .update({ status: 'cancelled' })
      .eq('quotation_id', record.id);
  } catch (e) {
    console.warn('Failed to cancel JoudaApp order:', e);
  }

  const message = `\
🔄 <b>تم عكس فاتورة</b>
<code>${record.id}</code>
${record.customer_name_snapshot || '—'}
${(record.total_amount || 0).toLocaleString()} ر.ي
تم إعادة المخزون وإلغاء القيد المالي
${fmtDate()}`;

  for (const gId of env.groupIds()) {
    try {
      await sendMessage(token, gId, message);
    } catch (e) {
      console.error(`Failed to send reversal to ${gId}:`, e);
    }
  }
}
