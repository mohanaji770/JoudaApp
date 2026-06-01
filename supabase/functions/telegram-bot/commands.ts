// ═══════════════════════════════════════════════════════
// commands.ts — Text command handlers (minimal & focused)
// ═══════════════════════════════════════════════════════
//
// Currently: /help, /orders, /status
// To add commands later: create commands-advanced.ts and
// import in index.ts — no changes needed here.

import { sendMessage } from './telegram.ts';
import { getClients } from './db.ts';
import { STATUS_LABEL } from './config.ts';
import { fmtDate } from './format.ts';

// ─── /help, /start ──────────────────────────────────────

export async function handleHelp(token: string, chatId: string) {
  const text = `\
<b>🛒 بوت جودة — إدارة الطلبات</b>

الطلبات تصلك تلقائياً مع أزرار التحكم.

<b>📋 أوامر متاحة:</b>
/orders — عرض الطلبات المعلقة
/status — حالة النظام

<b>📌 كيف يعمل؟</b>
• طلب من التطبيق → يصلك هنا للاعتماد → يُرسل للمجموعة
• فاتورة POS → تصل المجموعة مباشرة مع أزرار التتبع`;

  await sendMessage(token, chatId, text);
}

// ─── /orders ────────────────────────────────────────────

export async function handleOrders(token: string, chatId: string) {
  const { jouda } = getClients();

  const { data, error } = await jouda
    .from('customer_orders')
    .select('id, order_number, customer_name, total, status, created_at')
    .in('status', [
      'submitted',
      'confirmed',
      'reserved',
      'preparing',
      'delivered',
      'paid',
    ])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !data?.length) {
    await sendMessage(token, chatId, '✅ لا توجد طلبات معلقة حالياً');
    return;
  }

  let text = `<b>📋 الطلبات المعلقة (${data.length})</b>\n\n`;

  for (const o of data) {
    const label = STATUS_LABEL[o.status] || o.status;
    text += `${label}  <b>${o.order_number}</b>\n`;
    text += `   ${o.customer_name} — ${(o.total || 0).toLocaleString()} ر.ي\n`;
    text += `   ${fmtDate(o.created_at)}\n\n`;
  }

  await sendMessage(token, chatId, text);
}

// ─── /status ────────────────────────────────────────────

export async function handleStatus(token: string, chatId: string) {
  const { jouda } = getClients();

  const { count: pendingCount } = await jouda
    .from('customer_orders')
    .select('id', { count: 'exact', head: true })
    .in('status', ['submitted', 'confirmed', 'reserved', 'preparing']);

  const { data: settings } = await jouda
    .from('app_settings')
    .select('maintenance_mode')
    .eq('id', 1)
    .single();

  const maintenance = settings?.maintenance_mode ? '🔴 صيانة' : '🟢 يعمل';

  const text = `\
<b>📊 حالة النظام</b>

${maintenance}  التطبيق
📋  طلبات معلقة: <b>${pendingCount || 0}</b>
📅  ${fmtDate()}`;

  await sendMessage(token, chatId, text);
}
