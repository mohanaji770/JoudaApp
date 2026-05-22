import { createClient } from 'jsr:@supabase/supabase-js@2';
import { fmtDate } from './utils.ts';

const BOT_TOKEN = () => Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const GROUP_IDS = () => (Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || '').split(',').map(s => s.trim()).filter(Boolean);

function getClients() {
  const jouda = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const inventory = createClient(
    Deno.env.get('INVENTORY_SUPABASE_URL')!,
    Deno.env.get('INVENTORY_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  return { jouda, inventory };
}

async function sendTelegram(chatId: string, text: string, keyboard?: any) {
  const body: any = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (keyboard) body.reply_markup = keyboard;
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN()}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram API: ${data.description}`);
  return data;
}

export async function handleNewInvoice(record: any) {
  if (!record.customer_name_snapshot) return;

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
  let orderId = '';
  try {
    const { data: order } = await jouda
      .from('customer_orders')
      .insert({
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
      })
      .select('id')
      .single();
    if (order) orderId = order.id;
  } catch (e) {
    console.warn('Failed to create customer_order:', e);
  }

  // Build message
  const itemCount = items?.length || 0;
  const itemsList = (items || []).slice(0, 8)
    .map((i: any) => `• ${i.product_name_snapshot} × ${i.quantity}`)
    .join('\n');
  const extraItems = itemCount > 8 ? `\n<i>+ ${itemCount - 8} صنف آخر...</i>` : '';

  const subtotal = record.subtotal || 0;
  const discount = record.discount || 0;
  const companyAmount = Math.max(subtotal - discount, 0);
  const deliveryFee = record.delivery_fee || 0;
  const paymentMethod = record.payment_method === 'CASH' ? 'كاش' :
    record.payment_method === 'BANK' ? 'بنك' :
    record.payment_method === 'WALLET' ? 'محفظة' : record.payment_method;

  const ts = fmtDate();

  const message = `
🛒 <b>فاتورة جديدة - POS</b>
<code>${record.id}</code>
👤 العميل: ${record.customer_name_snapshot}

💰 المبلغ: ${companyAmount.toLocaleString()} ر.ي
🚚 توصيل: ${deliveryFee.toLocaleString()} ر.ي
💳 الدفع: ${paymentMethod}
${record.collector_id ? `👤 المحصل: ${collectorName}` : ''}

📦 الاصناف (${itemCount}):
${itemsList}${extraItems}

📅 ${ts}
  `.trim();

  const keyboard = {
    inline_keyboard: [
      [{ text: '📦 حجز', callback_data: `inv_reserve_${record.id}` }],
      [{ text: '👨‍🍳 تجهيز', callback_data: `inv_prepare_${record.id}` }],
      [{ text: '🚚 توصيل', callback_data: `inv_deliver_${record.id}` }],
      [{ text: '💰 استلام', callback_data: `inv_paid_${record.id}` }],
      [{ text: '🏦 ايداع (مدير)', callback_data: `inv_deposit_${record.id}` }],
      [{ text: '🔄 عكس (مدير)', callback_data: `inv_reverse_${record.id}` }],
    ],
  };

  for (const gId of GROUP_IDS()) {
    try { await sendTelegram(gId, message, keyboard); }
    catch (e) { console.error(`Failed to send invoice to ${gId}:`, e); }
  }
}

export async function handleReversedInvoice(record: any) {
  if (!record.is_voided) return;

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

  const ts = fmtDate();
  const message = `
🔄 <b>تم عكس فاتورة</b>
<code>${record.id}</code>
${record.customer_name_snapshot || '-'}
${(record.total_amount || 0).toLocaleString()} ر.ي
تم اعادة المخزون والغاء القيد المالي
${ts}
  `.trim();

  for (const gId of GROUP_IDS()) {
    try { await sendTelegram(gId, message); }
    catch (e) { console.error(`Failed to send reversal to ${gId}:`, e); }
  }
}
