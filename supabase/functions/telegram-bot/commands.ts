// ═══════════════════════════════════════════════════════
// commands.ts — Text command handlers (minimal & focused)
// ═══════════════════════════════════════════════════════
//
// Currently: /help, /orders, /status
// To add commands later: create commands-advanced.ts and
// import in index.ts — no changes needed here.

import { sendMessage } from './telegram.ts';
import { getClients } from './db.ts';
import { STATUS_LABEL, isAdmin, getInventoryUserId } from './config.ts';
import { fmtDate } from './format.ts';

// ─── /help, /start ──────────────────────────────────────

export async function handleHelp(token: string, chatId: string) {
  const admin = isAdmin(chatId);
  const driver = !!getInventoryUserId(chatId);

  let text = `<b>🛒 بوت جودة — نظام الإدارة والعمليات</b>\n\n`;

  if (admin) {
    text += `<b>👑 أوامر الإدارة:</b>\n`;
    text += `/orders — عرض الطلبات النشطة\n`;
    text += `/status — لوحة التحكم اللحظية\n`;
    text += `/cash — تقرير العهد المالية لجميع المناديب\n\n`;
  }

  if (driver) {
    text += `<b>🏍️ أوامر المناديب:</b>\n`;
    text += `/mycash — عرض عهدتك المالية الحالية\n\n`;
  }

  text += `<b>📌 ملاحظات:</b>\n`;
  text += `يمكنك الحصول على معرف حسابك لربطه عبر إرسال /chatid`;

  await sendMessage(token, chatId, text);
}

// ─── /orders ────────────────────────────────────────────

export async function handleOrders(token: string, chatId: string) {
  const { jouda, inventory } = getClients();

  // 1. Fetch App Orders (Jouda)
  const { data: appOrders } = await jouda
    .from('customer_orders')
    .select('id, order_number, customer_name, total, status, created_at')
    .in('status', ['submitted', 'confirmed', 'reserved', 'preparing'])
    .order('created_at', { ascending: false })
    .limit(8);

  // 2. Fetch POS Invoices (Inventory)
  const { data: posOrders } = await inventory
    .from('invoices')
    .select('id, customer_name_snapshot, total_amount, workflow_status, created_at')
    .eq('is_voided', false)
    .eq('is_settled', false)
    .in('workflow_status', ['pending', 'reserve', 'prepare', 'deliver'])
    .order('created_at', { ascending: false })
    .limit(8);

  const totalApp = appOrders?.length || 0;
  const totalPos = posOrders?.length || 0;

  if (totalApp === 0 && totalPos === 0) {
    await sendMessage(token, chatId, '✅ لا توجد طلبات معلقة حالياً');
    return;
  }

  let text = `📋 <b>قائمة الطلبات النشطة (${totalApp + totalPos})</b>\n\n`;

  if (totalApp > 0) {
    text += `📱 <b>طلبات التطبيق:</b>\n`;
    for (const o of appOrders!) {
      const label = STATUS_LABEL[o.status] || o.status;
      text += `🔹 <b>#${o.order_number}</b> [<code>${label}</code>]\n`;
      text += `   👤 العميل: ${o.customer_name} | 💰 ${(o.total || 0).toLocaleString()} ر.ي\n\n`;
    }
  }

  if (totalPos > 0) {
    text += `🛒 <b>فواتير تطبيق المخزون (POS):</b>\n`;
    for (const o of posOrders!) {
      const label = STATUS_LABEL[o.workflow_status] || o.workflow_status;
      text += `🔹 <b>#${o.id}</b> [<code>${label}</code>]\n`;
      text += `   👤 العميل: ${o.customer_name_snapshot} | 💰 ${(o.total_amount || 0).toLocaleString()} ر.ي\n\n`;
    }
  }

  text += `<i>💡 استخدم الأوامر للتتبع الفوري بدل البحث في الرسائل.</i>`;
  await sendMessage(token, chatId, text);
}

// ─── /status ────────────────────────────────────────────

export async function handleStatus(token: string, chatId: string) {
  const { jouda, inventory } = getClients();

  // 1. App Settings
  const { data: settings } = await jouda
    .from('app_settings')
    .select('maintenance_mode')
    .eq('id', 1)
    .single();
  const maintenance = settings?.maintenance_mode ? '🔴 صيانة' : '🟢 يعمل';

  // 2. Fetch all active app orders
  const { data: appOrders } = await jouda
    .from('customer_orders')
    .select('status')
    .in('status', ['submitted', 'confirmed', 'reserved', 'preparing', 'delivered']);
  
  // 3. Fetch all active pos orders
  const { data: posOrders } = await inventory
    .from('invoices')
    .select('workflow_status')
    .eq('is_voided', false)
    .eq('is_settled', false);

  // Group App Counts
  const appCounts = { submitted: 0, confirmed: 0, reserved: 0, preparing: 0, delivered: 0 };
  for (const o of appOrders || []) {
    if (o.status in appCounts) appCounts[o.status as keyof typeof appCounts]++;
  }

  // Group POS Counts
  const posCounts = { pending: 0, reserve: 0, prepare: 0, deliver: 0, paid: 0 };
  for (const o of posOrders || []) {
    if (o.workflow_status in posCounts) posCounts[o.workflow_status as keyof typeof posCounts]++;
  }

  const text = `\
📊 <b>لوحة التحكم اللحظية (Dashboard) ⚙️</b>
━━━━━━━━━━━━━━━━━━━
🌐 <b>وضع صيانة التطبيق:</b> ${maintenance}

📱 <b>طلبات التطبيق (${(appOrders?.length || 0)}):</b>
• 📨 بانتظار الاعتماد: <b>${appCounts.submitted}</b>
• ✅ بانتظار الحجز: <b>${appCounts.confirmed}</b>
• 📦 في قسم التعبئة: <b>${appCounts.reserved + appCounts.preparing}</b>
• 🚚 مع المندوب: <b>${appCounts.delivered}</b>

🛒 <b>فواتير الكاشير (${(posOrders?.length || 0)}):</b>
• 📨 بانتظار الحجز: <b>${posCounts.pending}</b>
• 📦 في قسم التعبئة: <b>${posCounts.reserve + posCounts.prepare}</b>
• 🚚 مع المندوب: <b>${posCounts.deliver}</b>
• 💰 تم الاستلام (بانتظار إيداع): <b>${posCounts.paid}</b>
━━━━━━━━━━━━━━━━━━━
📅 <b>التوقيت:</b> <code>${fmtDate()}</code>`;

  await sendMessage(token, chatId, text);
}

// ─── /cash ────────────────────────────────────────────

export async function handleCash(token: string, chatId: string) {
  const { inventory, jouda } = getClients();

  // 1. Fetch un-settled invoices from Inventory
  const { data: invoices, error } = await inventory
    .from('invoices')
    .select('id, collector_id, total_amount, delivery_fee, workflow_status, payment_method, users!invoices_collector_id_fkey(name)')
    .eq('is_voided', false)
    .eq('is_settled', false)
    .not('collector_id', 'is', null);

  if (error || !invoices?.length) {
    await sendMessage(token, chatId, '✅ لا توجد عهد مالية مسجلة على أي مندوب حالياً.');
    return;
  }

  // 2. Fetch App Orders statuses because their shadow invoices stay 'pending'
  const invoiceIds = invoices.map(i => i.id);
  const { data: appOrders } = await jouda
    .from('customer_orders')
    .select('quotation_id, status')
    .in('quotation_id', invoiceIds);

  const appStatusMap: Record<string, string> = {};
  if (appOrders) {
    for (const o of appOrders) {
      if (o.quotation_id) appStatusMap[o.quotation_id] = o.status;
    }
  }

  const driverStats: Record<string, { name: string, collected: number, collectedCount: number, pendingCount: number }> = {};
  let totalCashInMarket = 0;

  for (const inv of invoices) {
    const dId = inv.collector_id;
    if (!driverStats[dId]) {
      // @ts-ignore
      driverStats[dId] = { name: inv.users?.name || 'غير معروف', collected: 0, collectedCount: 0, pendingCount: 0 };
    }

    // Override workflow_status if it's an App Order
    const effectiveStatus = appStatusMap[inv.id] || inv.workflow_status;

    // What counts as Collected Cash?
    // POS: 'paid'
    // APP: 'paid' or 'delivered' (Wait, in App, is cash collected at 'delivered' or 'paid'?
    // Usually 'paid' is when the driver says they received the cash. But let's check both for safety, actually APP flow has a 'paid' button).
    // Let's stick to 'paid' for collected cash.
    if (['paid'].includes(effectiveStatus)) {
       if (inv.payment_method === 'CASH') {
          const cashAmount = Math.max((inv.total_amount || 0) - (inv.delivery_fee || 0), 0);
          driverStats[dId].collected += cashAmount;
          totalCashInMarket += cashAmount;
       }
       driverStats[dId].collectedCount++;
    } else {
       driverStats[dId].pendingCount++;
    }
  }

  let text = `💰 <b>تقرير العُهد المالية للمناديب 📊</b>\n━━━━━━━━━━━━━━━━━━━\n`;
  let hasDrivers = false;

  for (const dId in driverStats) {
    const st = driverStats[dId];
    if (st.collectedCount === 0 && st.pendingCount === 0) continue;
    
    hasDrivers = true;
    text += `🏍️ <b>${st.name}</b>: <b>${st.collected.toLocaleString()}</b> ر.ي\n`;
    text += `   (محصل: ${st.collectedCount} طلبات | معلق: ${st.pendingCount} طلبات)\n\n`;
  }

  if (!hasDrivers) {
    await sendMessage(token, chatId, '✅ لا توجد عهد مالية مسجلة على أي مندوب حالياً.');
    return;
  }

  text += `━━━━━━━━━━━━━━━━━━━\n`;
  text += `💵 <b>إجمالي الكاش الجاهز للتوريد:</b> <b>${totalCashInMarket.toLocaleString()}</b> ر.ي\n`;
  text += `<i>💡 يتم احتساب الدفع النقدي فقط (CASH) بعد خصم رسوم التوصيل.</i>`;

  await sendMessage(token, chatId, text);
}

// ─── /mycash ────────────────────────────────────────────

export async function handleMyCash(token: string, chatId: string) {
  const driverId = getInventoryUserId(chatId);
  if (!driverId) {
    await sendMessage(token, chatId, '⚠️ حسابك غير مسجل كمندوب في النظام.');
    return;
  }

  const { inventory, jouda } = getClients();

  const { data: invoices, error } = await inventory
    .from('invoices')
    .select('id, total_amount, delivery_fee, workflow_status, payment_method')
    .eq('collector_id', driverId)
    .eq('is_voided', false)
    .eq('is_settled', false);

  if (error || !invoices?.length) {
    await sendMessage(token, chatId, '✅ ليس عليك أي عهد مالية حالياً. (العهدة صفر)');
    return;
  }

  const invoiceIds = invoices.map(i => i.id);
  const { data: appOrders } = await jouda
    .from('customer_orders')
    .select('quotation_id, status')
    .in('quotation_id', invoiceIds);

  const appStatusMap: Record<string, string> = {};
  if (appOrders) {
    for (const o of appOrders) {
      if (o.quotation_id) appStatusMap[o.quotation_id] = o.status;
    }
  }

  let collected = 0;
  let collectedCount = 0;
  let pendingCount = 0;

  for (const inv of invoices) {
    const effectiveStatus = appStatusMap[inv.id] || inv.workflow_status;

    if (['paid'].includes(effectiveStatus)) {
       if (inv.payment_method === 'CASH') {
          collected += Math.max((inv.total_amount || 0) - (inv.delivery_fee || 0), 0);
       }
       collectedCount++;
    } else {
       pendingCount++;
    }
  }

  let text = `🏍️ <b>تقرير عهدتك المالية</b>\n━━━━━━━━━━━━━━━━━━━\n`;
  text += `💵 <b>الكاش المطلوب توريده:</b> <b>${collected.toLocaleString()}</b> ر.ي\n`;
  text += `📦 الطلبات المحصلة: ${collectedCount}\n`;
  text += `⏳ الطلبات في الطريق (معلقة): ${pendingCount}\n\n`;
  text += `<i>💡 يتم احتساب صافي الكاش بعد استقطاع أجور التوصيل الخاصة بك. لتصفية العهدة قم بتسليم المبلغ للإدارة.</i>`;

  await sendMessage(token, chatId, text);
}
