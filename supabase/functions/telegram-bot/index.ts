import { createClient } from 'jsr:@supabase/supabase-js@2';

// ═══════════════════════════════════════════════════════
// Jouda Telegram Bot — Smart Admin Assistant
// Webhook-based Edge Function for Telegram Bot API
// ═══════════════════════════════════════════════════════

const TELEGRAM_API = (token: string) => `https://api.telegram.org/bot${token}`;

// ─── Telegram API Helpers ───────────────────────────────

async function sendMessage(token: string, chatId: string, text: string, options: any = {}) {
  const body: any = { chat_id: chatId, text, parse_mode: 'HTML', ...options };
  const res = await fetch(`${TELEGRAM_API(token)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function editMessage(token: string, chatId: string, messageId: number, text: string, options: any = {}) {
  const body: any = { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...options };
  const res = await fetch(`${TELEGRAM_API(token)}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function answerCallback(token: string, callbackId: string, text?: string) {
  await fetch(`${TELEGRAM_API(token)}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId, text: text || '' }),
  });
}

// ─── Reply Keyboard Menu (Persistent Buttons) ──────────

async function sendMainMenu(token: string, chatId: string, text: string) {
  const keyboard = {
    keyboard: [
      [{ text: '📦 الطلبات' }, { text: '💰 مبيعات اليوم' }],
      [{ text: '🔍 بحث منتج' }, { text: '📈 الأرباح' }],
      [{ text: '🧾 المحصّل' }, { text: '⏰ الصلاحية' }],
      [{ text: '📉 مخزون منخفض' }, { text: '⚙️ حالة النظام' }],
    ],
    resize_keyboard: true,
    is_persistent: true,
  };

  const body = { chat_id: chatId, text, parse_mode: 'HTML', reply_markup: keyboard };
  await fetch(`${TELEGRAM_API(token)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── Supabase Clients ──────────────────────────────────

function getClients() {
  const joudaUrl = Deno.env.get('SUPABASE_URL')!;
  const joudaKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const invUrl = Deno.env.get('INVENTORY_SUPABASE_URL')!;
  const invKey = Deno.env.get('INVENTORY_SERVICE_ROLE_KEY')!;

  const jouda = createClient(joudaUrl, joudaKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const inventory = createClient(invUrl, invKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return { jouda, inventory };
}

// ─── Status Maps ───────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  submitted: '📨 جديد', confirmed: '✅ مؤكد', preparing: '👨‍🍳 قيد التحضير',
  delivered: '🎉 تم التسليم', cancelled: '❌ ملغي', failed: '⚠️ فشل',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['delivered', 'cancelled'],
  delivered: [], cancelled: [], failed: ['cancelled'],
};

// ─── Build Inline Keyboard for Order ────────────────────

function buildOrderButtons(orderId: string, currentStatus: string) {
  const next = VALID_TRANSITIONS[currentStatus] || [];
  if (next.length === 0) return undefined;

  const buttons = next.map(s => ({
    text: STATUS_LABEL[s] || s,
    callback_data: `order_${s}_${orderId}`,
  }));

  return { inline_keyboard: [buttons] };
}

// ─── Command Handlers ──────────────────────────────────

async function handleHelp(token: string, chatId: string) {
  const text = `
🤖 <b>أهلاً بك في بوت جودة الذكي</b>

👇 استخدم <b>الأزرار السفلية</b> للوصول السريع للتقارير والعمليات.

<b>⌨️ أوامر أخرى (تحتاج إدخال نص):</b>
/order [رقم] — تفاصيل طلب محدد
/stock [باركود] — تفاصيل المخزون بالباركود
/search [الاسم] — البحث عن منتج بالاسم
/expense [المبلغ] [الوصف] — لتسجيل مصروف

<b>⚙️ أوامر النظام:</b>
/maintenance — تفعيل/إلغاء وضع الصيانة
  `.trim();
  await sendMainMenu(token, chatId, text);
}

async function handleOrders(token: string, chatId: string) {
  const { jouda } = getClients();
  const { data, error } = await jouda
    .from('customer_orders')
    .select('id, order_number, customer_name, customer_phone, total, status, created_at')
    .in('status', ['submitted', 'confirmed', 'preparing'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !data?.length) {
    await sendMessage(token, chatId, '✅ لا توجد طلبات معلقة حالياً');
    return;
  }

  let text = `📋 <b>الطلبات المعلقة (${data.length})</b>\n\n`;
  for (const o of data) {
    const status = STATUS_LABEL[o.status] || o.status;
    text += `${status} <b>${o.order_number}</b>\n`;
    text += `👤 ${o.customer_name} — 💰 ${o.total?.toLocaleString()} ر.ي\n\n`;
  }
  text += `للتفاصيل: /order [رقم الطلب]`;
  await sendMessage(token, chatId, text);
}

async function handleOrderDetail(token: string, chatId: string, orderNum: string) {
  const { jouda } = getClients();
  const { data: order } = await jouda
    .from('customer_orders')
    .select('*')
    .eq('order_number', orderNum.toUpperCase())
    .single();

  if (!order) {
    await sendMessage(token, chatId, `❌ لم يتم العثور على طلب برقم: ${orderNum}`);
    return;
  }

  const { data: items } = await jouda
    .from('order_items')
    .select('product_name, quantity, unit_price, total_price')
    .eq('order_id', order.id);

  const itemsList = (items || []).map((i: any) => `• ${i.product_name} × ${i.quantity} = ${i.total_price?.toLocaleString()}`).join('\n');
  const status = STATUS_LABEL[order.status] || order.status;
  const date = new Date(order.created_at).toLocaleString('ar-SA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const text = `
🛒 <b>تفاصيل الطلب: ${order.order_number}</b>

${status}
👤 <b>العميل:</b> ${order.customer_name}
📱 <b>الهاتف:</b> ${order.customer_phone}
📍 <b>العنوان:</b> ${order.customer_address || '—'}
📅 <b>التاريخ:</b> ${date}

📦 <b>الأصناف:</b>
${itemsList || 'لا توجد أصناف'}

💰 <b>المجموع:</b> ${order.subtotal?.toLocaleString()} ر.ي
🚚 <b>التوصيل:</b> ${order.delivery_fee?.toLocaleString() || '0'} ر.ي
💵 <b>الإجمالي:</b> ${order.total?.toLocaleString()} ر.ي
  `.trim();

  const keyboard = buildOrderButtons(order.id, order.status);
  await sendMessage(token, chatId, text, keyboard ? { reply_markup: keyboard } : {});
}

async function handleStock(token: string, chatId: string, barcode: string) {
  const { inventory } = getClients();

  const { data: product } = await inventory.from('products').select('name, price, cost_price, unit').eq('barcode', barcode).single();
  if (!product) {
    await sendMessage(token, chatId, `❌ لا يوجد منتج بالباركود: ${barcode}`);
    return;
  }

  const { data: stock } = await inventory.from('product_stock_summary').select('warehouse_name, current_stock').eq('product_barcode', barcode);

  let text = `📦 <b>${product.name}</b>\n<code>${barcode}</code>\n\n`;
  text += `💰 سعر البيع: ${product.price?.toLocaleString()} ر.ي\n`;
  text += `📊 سعر التكلفة: ${product.cost_price?.toLocaleString()} ر.ي\n\n`;

  if (!stock?.length) {
    text += '⚠️ لا يوجد مخزون';
  } else {
    text += '🏭 <b>المخزون:</b>\n';
    let total = 0;
    for (const s of stock) {
      const qty = s.current_stock || 0;
      total += qty;
      const icon = qty <= 0 ? '🔴' : qty < 10 ? '🟡' : '🟢';
      text += `${icon} ${s.warehouse_name}: <b>${qty}</b> ${product.unit || ''}\n`;
    }
    text += `\n📊 <b>الإجمالي:</b> ${total} ${product.unit || ''}`;
  }

  await sendMessage(token, chatId, text);
}

async function handleLowStock(token: string, chatId: string) {
  const { inventory } = getClients();

  const { data: products } = await inventory.from('products').select('barcode, name, min_stock, unit').eq('is_active', true);
  if (!products?.length) { await sendMessage(token, chatId, '✅ لا توجد منتجات'); return; }

  const { data: stockData } = await inventory.from('product_stock_summary').select('product_barcode, current_stock');

  const stockMap: Record<string, number> = {};
  (stockData || []).forEach((s: any) => {
    stockMap[s.product_barcode] = (stockMap[s.product_barcode] || 0) + (s.current_stock || 0);
  });

  const low = products.filter(p => (stockMap[p.barcode] || 0) < p.min_stock);

  if (low.length === 0) {
    await sendMessage(token, chatId, '✅ جميع المنتجات فوق الحد الأدنى');
    return;
  }

  let text = `⚠️ <b>منتجات منخفضة المخزون (${low.length})</b>\n\n`;
  for (const p of low.slice(0, 20)) {
    const qty = stockMap[p.barcode] || 0;
    text += `🔴 <b>${p.name}</b>\n   المتبقي: ${qty} / الحد: ${p.min_stock} ${p.unit || ''}\n\n`;
  }
  await sendMessage(token, chatId, text);
}

// ─── /briefing — التقرير الصباحي ─────────────────────────

async function handleMorningBriefing(token: string, chatId: string) {
  const { inventory } = getClients();

  // 1. مبيعات الأمس
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isoToday = today.toISOString();
  const isoYesterday = yesterday.toISOString();

  const { data: invoices } = await inventory
    .from('invoices')
    .select('total_amount, subtotal, discount, delivery_fee')
    .gte('created_at', isoYesterday)
    .lt('created_at', isoToday)
    .eq('status', 'POSTED')
    .eq('is_voided', false);

  const totalSales = (invoices || []).reduce((s, i) => s + (i.total_amount || 0), 0);
  const invoicesCount = (invoices || []).length;

  // 2. المنتجات المنخفضة
  const { data: products } = await inventory.from('products').select('barcode, name, min_stock, unit').eq('is_active', true);
  const { data: stockData } = await inventory.from('product_stock_summary').select('product_barcode, current_stock');
  
  const stockMap: Record<string, number> = {};
  (stockData || []).forEach((s: any) => { stockMap[s.product_barcode] = (stockMap[s.product_barcode] || 0) + (s.current_stock || 0); });
  
  const lowStock = (products || []).filter(p => (stockMap[p.barcode] || 0) <= p.min_stock);

  // 3. المحصلين غير المسددين
  const { data: unsettledInvoices } = await inventory
    .from('invoices')
    .select('collector_id, total_amount, subtotal, discount')
    .eq('is_settled', false)
    .eq('is_voided', false)
    .eq('payment_method', 'CASH')
    .not('collector_id', 'is', null);

  const collectorDebts: Record<string, number> = {};
  (unsettledInvoices || []).forEach((i: any) => {
    const amt = Math.max((i.subtotal || i.total_amount || 0) - (i.discount || 0), 0);
    collectorDebts[i.collector_id] = (collectorDebts[i.collector_id] || 0) + amt;
  });

  const { data: users } = await inventory.from('users').select('id, name').in('id', Object.keys(collectorDebts));
  const userMap: Record<string, string> = {};
  (users || []).forEach((u: any) => { userMap[u.id] = u.name; });

  // بناء الرسالة
  let text = `☀️ <b>صباح الخير يا مدير!</b>\nإليك الملخص التلقائي ليوم الأمس:\n\n`;

  text += `📈 <b>مبيعات الأمس:</b>\n`;
  text += `• الإجمالي: <b>${totalSales.toLocaleString()}</b> ر.ي\n`;
  text += `• عدد الطلبات: ${invoicesCount}\n\n`;

  text += `⚠️ <b>نواقص المخزون (${lowStock.length}):</b>\n`;
  if (lowStock.length === 0) {
    text += `✅ لا يوجد نواقص\n\n`;
  } else {
    for (const p of lowStock.slice(0, 5)) {
      text += `• ${p.name} (باقي ${stockMap[p.barcode] || 0})\n`;
    }
    if (lowStock.length > 5) text += `+ ${lowStock.length - 5} منتجات أخرى...\n`;
    text += '\n';
  }

  const unsettledCount = Object.keys(collectorDebts).length;
  text += `💵 <b>كاش لدى المحصلين (${unsettledCount}):</b>\n`;
  if (unsettledCount === 0) {
    text += `✅ جميع المبالغ موردة\n`;
  } else {
    for (const [colId, amt] of Object.entries(collectorDebts)) {
      if (amt > 0) text += `• ${userMap[colId] || colId}: <b>${amt.toLocaleString()}</b> ر.ي\n`;
    }
  }

  await sendMessage(token, chatId, text);
}

async function handleToday(token: string, chatId: string) {
  const { inventory, jouda } = getClients();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const iso = todayStart.toISOString();

  // Sales invoices
  const { data: invoices } = await inventory
    .from('invoices')
    .select('total_amount, status')
    .gte('created_at', iso)
    .eq('status', 'POSTED');

  const totalSales = (invoices || []).reduce((s: number, i: any) => s + (i.total_amount || 0), 0);
  const invoiceCount = invoices?.length || 0;

  // App orders
  const { data: appOrders } = await jouda
    .from('customer_orders')
    .select('id, status')
    .gte('created_at', iso);

  const orderCount = appOrders?.length || 0;
  const pending = (appOrders || []).filter((o: any) => ['submitted', 'confirmed', 'preparing'].includes(o.status)).length;
  const delivered = (appOrders || []).filter((o: any) => o.status === 'delivered').length;

  const text = `
📊 <b>تقرير اليوم</b>
📅 ${new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

💰 <b>المبيعات:</b>
• فواتير: ${invoiceCount}
• إجمالي المبيعات: ${totalSales.toLocaleString()} ر.ي

📱 <b>طلبات التطبيق:</b>
• إجمالي: ${orderCount}
• معلقة: ${pending}
• مُسلَّمة: ${delivered}
  `.trim();

  await sendMessage(token, chatId, text);
}

async function handleMaintenance(token: string, chatId: string, arg?: string) {
  const { jouda } = getClients();

  if (!arg || !['on', 'off'].includes(arg.toLowerCase())) {
    const { data } = await jouda.from('app_settings').select('maintenance_mode').eq('id', 1).single();
    const current = data?.maintenance_mode ? '🔴 مفعّل' : '🟢 معطّل';
    await sendMessage(token, chatId, `⚙️ وضع الصيانة: ${current}\n\nللتبديل: /maintenance on أو /maintenance off`);
    return;
  }

  const mode = arg.toLowerCase() === 'on';
  await jouda.from('app_settings').update({ maintenance_mode: mode }).eq('id', 1);
  const emoji = mode ? '🔴' : '🟢';
  await sendMessage(token, chatId, `${emoji} وضع الصيانة: ${mode ? 'مفعّل — التطبيق متوقف' : 'معطّل — التطبيق يعمل'}`);
}

async function handleStatus(token: string, chatId: string) {
  const { jouda, inventory } = getClients();

  const { data: settings } = await jouda.from('app_settings').select('maintenance_mode').eq('id', 1).single();
  const { count: productCount } = await inventory.from('products').select('barcode', { count: 'exact', head: true }).eq('is_active', true);
  const { count: pendingOrders } = await jouda.from('customer_orders').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'confirmed', 'preparing']);

  const maintenance = settings?.maintenance_mode ? '🔴 صيانة' : '🟢 يعمل';
  const text = `
⚙️ <b>حالة النظام</b>

📱 التطبيق: ${maintenance}
📦 المنتجات النشطة: ${productCount || 0}
🛒 طلبات معلقة: ${pendingOrders || 0}
🕐 ${new Date().toLocaleString('ar-SA')}
  `.trim();

  await sendMessage(token, chatId, text);
}

// ─── /search — البحث عن منتج بالاسم ────────────────────

async function handleSearch(token: string, chatId: string, query: string) {
  const { inventory } = getClients();

  const { data: products } = await inventory
    .from('products')
    .select('barcode, name, price, cost_price, unit')
    .eq('is_active', true)
    .ilike('name', `%${query}%`)
    .limit(10);

  if (!products?.length) {
    await sendMessage(token, chatId, `❌ لا توجد منتجات تطابق: "${query}"`);
    return;
  }

  const { data: stockData } = await inventory.from('product_stock_summary').select('product_barcode, current_stock');
  const stockMap: Record<string, number> = {};
  (stockData || []).forEach((s: any) => {
    stockMap[s.product_barcode] = (stockMap[s.product_barcode] || 0) + (s.current_stock || 0);
  });

  let text = `🔍 <b>نتائج البحث: "${query}" (${products.length})</b>\n\n`;
  for (const p of products) {
    const qty = stockMap[p.barcode] || 0;
    const icon = qty <= 0 ? '🔴' : qty < 10 ? '🟡' : '🟢';
    text += `${icon} <b>${p.name}</b>\n`;
    text += `   <code>${p.barcode}</code> | 💰 ${p.price?.toLocaleString()} | 📦 ${qty} ${p.unit || ''}\n\n`;
  }

  await sendMessage(token, chatId, text);
}

// ─── /expense — تسجيل مصروف سريع ────────────────────────

async function handleExpense(token: string, chatId: string, arg: string) {
  // Format: /expense 5000 بنزين
  const match = arg.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (!match) {
    await sendMessage(token, chatId, '💸 <b>تسجيل مصروف</b>\n\nالصيغة: /expense [المبلغ] [الوصف]\n\nمثال: <code>/expense 5000 بنزين المولد</code>');
    return;
  }

  const amount = parseFloat(match[1]);
  const note = match[2].trim();

  if (amount <= 0) {
    await sendMessage(token, chatId, '❌ المبلغ يجب أن يكون أكبر من صفر');
    return;
  }

  const { inventory } = getClients();
  const systemUserId = Deno.env.get('SYSTEM_USER_UUID') || 'admin';

  // Insert directly into wallet_ledger using service_role (bypasses RLS)
  const { data: entry, error } = await inventory.from('wallet_ledger').insert({
    user_id: systemUserId,
    entry_type: 'EXPENSE',
    direction: 'OUT',
    amount,
    expense_category: 'تليجرام',
    status: 'POSTED',
    note: `📱 ${note}`,
    created_by: systemUserId,
    idempotency_key: `tg_expense_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }).select('id').single();

  if (error) {
    await sendMessage(token, chatId, `❌ فشل التسجيل: ${error.message}`);
    return;
  }

  await sendMessage(token, chatId, `✅ <b>تم تسجيل المصروف</b>\n\n💸 المبلغ: <b>${amount.toLocaleString()}</b> ر.ي\n📝 الوصف: ${note}\n🕐 ${new Date().toLocaleString('ar-SA')}`);
}

// ─── /expiry — تنبيهات الصلاحية ──────────────────────────

async function handleExpiry(token: string, chatId: string, arg?: string) {
  const { inventory } = getClients();

  const daysAhead = parseInt(arg || '30') || 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
  const cutoffIso = cutoffDate.toISOString().split('T')[0]; // yyyy-mm-dd

  const { data: batches } = await inventory
    .from('active_expiry_batches')
    .select('product_barcode, product_name_snapshot, expiry_date, warehouse_name, remaining_qty')
    .lte('expiry_date', cutoffIso)
    .gt('remaining_qty', 0)
    .order('expiry_date', { ascending: true })
    .limit(25);

  if (!batches?.length) {
    await sendMessage(token, chatId, `✅ لا توجد منتجات تنتهي صلاحيتها خلال ${daysAhead} يوم`);
    return;
  }

  const today = new Date();
  let text = `⏰ <b>منتجات قريبة الصلاحية (خلال ${daysAhead} يوم)</b>\n\n`;

  for (const b of batches) {
    const expDate = new Date(b.expiry_date);
    const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const icon = daysLeft <= 0 ? '🔴 منتهي!' : daysLeft <= 7 ? '🟠' : '🟡';
    const daysLabel = daysLeft <= 0 ? '<b>منتهي الصلاحية!</b>' : `باقي ${daysLeft} يوم`;

    text += `${icon} <b>${b.product_name_snapshot}</b>\n`;
    text += `   📅 ${b.expiry_date} — ${daysLabel}\n`;
    text += `   📦 ${b.remaining_qty} | 🏭 ${b.warehouse_name}\n\n`;
  }

  await sendMessage(token, chatId, text);
}

// ─── /profit — تقرير الأرباح ─────────────────────────────

async function handleProfit(token: string, chatId: string, arg?: string) {
  const { inventory } = getClients();

  // Determine date range
  const now = new Date();
  const startDate = new Date();
  let periodLabel = 'اليوم';

  if (arg === 'week' || arg === 'أسبوع') {
    startDate.setDate(startDate.getDate() - 7);
    periodLabel = 'آخر 7 أيام';
  } else if (arg === 'month' || arg === 'شهر') {
    startDate.setDate(startDate.getDate() - 30);
    periodLabel = 'آخر 30 يوم';
  } else {
    startDate.setHours(0, 0, 0, 0);
  }

  const iso = startDate.toISOString();

  // Get POSTED invoices in range
  const { data: invoices } = await inventory
    .from('invoices')
    .select('id, total_amount, subtotal, discount, delivery_fee')
    .gte('created_at', iso)
    .eq('status', 'POSTED')
    .eq('is_voided', false);

  if (!invoices?.length) {
    await sendMessage(token, chatId, `📊 لا توجد مبيعات في فترة "${periodLabel}"`);
    return;
  }

  const invoiceIds = invoices.map(i => i.id);

  // Get invoice items to calculate cost
  const { data: items } = await inventory
    .from('invoice_items')
    .select('product_barcode, quantity, unit_price')
    .in('invoice_id', invoiceIds);

  // Get product costs
  const barcodes = [...new Set((items || []).map((i: any) => i.product_barcode))];
  const { data: products } = await inventory
    .from('products')
    .select('barcode, cost_price')
    .in('barcode', barcodes);

  const costMap: Record<string, number> = {};
  (products || []).forEach((p: any) => { costMap[p.barcode] = p.cost_price || 0; });

  // Calculate
  const totalRevenue = invoices.reduce((s, i) => s + (i.subtotal || i.total_amount || 0), 0);
  const totalDiscount = invoices.reduce((s, i) => s + (i.discount || 0), 0);
  const totalDelivery = invoices.reduce((s, i) => s + (i.delivery_fee || 0), 0);
  const totalCost = (items || []).reduce((s: number, i: any) => s + ((costMap[i.product_barcode] || 0) * i.quantity), 0);
  const grossProfit = totalRevenue - totalDiscount - totalCost;

  // Get expenses in range
  const { data: expenses } = await inventory
    .from('wallet_ledger')
    .select('amount')
    .eq('entry_type', 'EXPENSE')
    .eq('direction', 'OUT')
    .in('status', ['APPROVED', 'POSTED'])
    .gte('created_at', iso);

  const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses;
  const profitIcon = netProfit >= 0 ? '📈' : '📉';

  const text = `
${profitIcon} <b>تقرير الأرباح — ${periodLabel}</b>

💰 <b>الإيرادات:</b>
• المبيعات: ${totalRevenue.toLocaleString()} ر.ي
• الخصومات: -${totalDiscount.toLocaleString()} ر.ي
• فواتير: ${invoices.length}

📦 <b>التكاليف:</b>
• تكلفة البضاعة: ${totalCost.toLocaleString()} ر.ي

📊 <b>الربح الإجمالي:</b> ${grossProfit.toLocaleString()} ر.ي

💸 <b>المصروفات:</b> ${totalExpenses.toLocaleString()} ر.ي

━━━━━━━━━━━━━━━━━
${profitIcon} <b>صافي الربح:</b> <b>${netProfit.toLocaleString()}</b> ر.ي
  `.trim();

  await sendMessage(token, chatId, text);
}

// ─── /wallet — تقرير المحصّل ─────────────────────────────

async function handleWallet(token: string, chatId: string, arg?: string) {
  const { inventory } = getClients();

  // List all collectors if no arg
  if (!arg) {
    const { data: users } = await inventory
      .from('users')
      .select('id, name, role')
      .eq('is_active', true)
      .in('role', ['collector', 'cashier', 'admin']);

    if (!users?.length) {
      await sendMessage(token, chatId, '❌ لا يوجد مستخدمين نشطين');
      return;
    }

    let text = `👥 <b>المستخدمين المتاحين</b>\n\nاستخدم: /wallet [الاسم أو ID]\n\n`;
    for (const u of users) {
      text += `• <b>${u.name}</b> (<code>${u.id}</code>) — ${u.role}\n`;
    }
    await sendMessage(token, chatId, text);
    return;
  }

  // Find user by name or ID
  const { data: users } = await inventory
    .from('users')
    .select('id, name, role')
    .eq('is_active', true);

  const user = (users || []).find((u: any) =>
    u.id === arg || u.name.includes(arg)
  );

  if (!user) {
    await sendMessage(token, chatId, `❌ لم يتم العثور على مستخدم: "${arg}"\n\nأرسل /wallet بدون اسم لعرض القائمة`);
    return;
  }

  // Get unsettled collections (CASH invoices)
  const { data: unsettledInvoices } = await inventory
    .from('invoices')
    .select('id, subtotal, discount, delivery_fee, total_amount')
    .eq('collector_id', user.id)
    .eq('is_settled', false)
    .eq('is_voided', false)
    .eq('payment_method', 'CASH');

  const totalCollected = (unsettledInvoices || []).reduce((s: number, i: any) => {
    const companyAmount = Math.max((i.subtotal || i.total_amount || 0) - (i.discount || 0), 0);
    return s + companyAmount;
  }, 0);

  // Get unsettled expenses
  const { data: expenseEntries } = await inventory
    .from('wallet_ledger')
    .select('amount, entry_type')
    .eq('user_id', user.id)
    .is('settlement_batch_id', null)
    .in('status', ['APPROVED', 'POSTED'])
    .in('entry_type', ['EXPENSE', 'DEDUCTION'])
    .eq('direction', 'OUT');

  const totalExpenses = (expenseEntries || []).filter((e: any) => e.entry_type === 'EXPENSE').reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const totalDeductions = (expenseEntries || []).filter((e: any) => e.entry_type === 'DEDUCTION').reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const net = totalCollected - totalExpenses - totalDeductions;
  const netIcon = net >= 0 ? '💵' : '🔴';

  const text = `
🧾 <b>رصيد المحصّل: ${user.name}</b>

💰 <b>المحصّل (غير مُسوّى):</b> ${totalCollected.toLocaleString()} ر.ي
   📄 فواتير: ${unsettledInvoices?.length || 0}

💸 <b>المصروفات:</b> ${totalExpenses.toLocaleString()} ر.ي
📍 <b>الخصومات:</b> ${totalDeductions.toLocaleString()} ر.ي

━━━━━━━━━━━━━━━━━
${netIcon} <b>المطلوب تسليمه:</b> <b>${net.toLocaleString()}</b> ر.ي
  `.trim();

  await sendMessage(token, chatId, text);
}

// ─── Callback (Inline Button) Handler ──────────────────

async function handleCallback(token: string, chatId: string, callback: any) {
  const data = callback.data as string; // e.g. "order_confirmed_uuid-here"
  const messageId = callback.message?.message_id;

  if (!data.startsWith('order_')) {
    await answerCallback(token, callback.id, 'إجراء غير معروف');
    return;
  }

  const parts = data.split('_');
  // order_confirmed_<uuid> or order_cancelled_<uuid>
  const newStatus = parts[1];
  const orderId = parts.slice(2).join('_');

  const { jouda, inventory } = getClients();

  // Get order
  const { data: order, error: orderErr } = await jouda
    .from('customer_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order || orderErr) {
    await answerCallback(token, callback.id, '❌ الطلب غير موجود');
    return;
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    await answerCallback(token, callback.id, `❌ لا يمكن الانتقال من ${STATUS_LABEL[order.status]} إلى ${STATUS_LABEL[newStatus]}`);
    return;
  }

  const systemUserId = Deno.env.get('SYSTEM_USER_UUID') || 'telegram-bot';

  // ── CONFIRMED → Convert quotation to invoice (deduct stock) ──
  if (newStatus === 'confirmed' && order.quotation_id) {
    const { data: rpcResult, error: rpcErr } = await inventory.rpc('convert_quotation_to_invoice', {
      p_invoice_id: order.quotation_id,
      p_converted_by: systemUserId,
    });

    if (rpcErr) {
      await answerCallback(token, callback.id, `❌ فشل خصم المخزون: ${rpcErr.message}`);
      return;
    }

    const result = rpcResult as any;
    if (result && result.success === false) {
      await answerCallback(token, callback.id, `❌ ${result.error || 'فشل تحويل التسعيرة'}`);
      return;
    }
  }

  // ── CANCELLED after CONFIRMED → Reverse invoice (restore stock) ──
  if (newStatus === 'cancelled' && order.status === 'confirmed' && order.quotation_id) {
    await inventory.rpc('reverse_invoice', {
      p_invoice_id: order.quotation_id,
      p_actor_user_id: systemUserId,
      p_reason: 'إلغاء طلب من تليجرام',
      p_idempotency_key: crypto.randomUUID(),
    });
  }

  // ── Update status in JoudaApp ──
  const updatePayload: Record<string, any> = { status: newStatus };
  if (newStatus === 'confirmed') updatePayload.confirmed_at = new Date().toISOString();
  else if (newStatus === 'delivered') updatePayload.delivered_at = new Date().toISOString();
  else if (newStatus === 'cancelled') updatePayload.cancelled_at = new Date().toISOString();

  const { error: updateErr } = await jouda.from('customer_orders').update(updatePayload).eq('id', orderId);

  if (updateErr) {
    await answerCallback(token, callback.id, `❌ فشل التحديث: ${updateErr.message}`);
    return;
  }

  await answerCallback(token, callback.id, `${STATUS_LABEL[newStatus]} تم التحديث`);

  // ── Update the original message with new status + new buttons ──
  if (messageId) {
    const originalText = callback.message?.text || '';
    // Build updated text
    const statusLine = `\n\n${STATUS_LABEL[newStatus]} — تم التحديث`;
    const newKeyboard = buildOrderButtons(orderId, newStatus);

    await editMessage(token, chatId, messageId,
      originalText + statusLine,
      newKeyboard ? { reply_markup: newKeyboard } : { reply_markup: { inline_keyboard: [] } }
    );
  }

  // ── Open WhatsApp link hint ──
  if (['confirmed', 'preparing', 'delivered'].includes(newStatus) && order.customer_phone) {
    let phone = order.customer_phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = '967' + phone.slice(1);
    else if (!phone.startsWith('967')) phone = '967' + phone;

    const msgs: Record<string, string> = {
      confirmed: '✅ تم تأكيد طلبك وسيتم تجهيزه قريباً',
      preparing: '👨‍🍳 طلبك قيد التحضير الآن',
      delivered: '🎉 تم تسليم طلبك. شكراً لتسوقك من جودة!',
    };

    const waMsg = encodeURIComponent(`🛍️ *جودة — تحديث طلبك*\n\n📦 *رقم الطلب:* ${order.order_number}\n${msgs[newStatus]}\n\n💰 *المبلغ:* ${order.total?.toLocaleString()} ر.ي\n\nشكراً لاختيارك جودة ❤️`);
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${waMsg}`;

    await sendMessage(token, chatId, `📲 <a href="${waUrl}">إرسال إشعار للعميل عبر واتساب</a>`, { disable_web_page_preview: true });
  }
}

// ═══════════════════════════════════════════════════════
// Main Webhook Handler
// ═══════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const adminChatId = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID');

  if (!botToken || !adminChatId) {
    return new Response(JSON.stringify({ error: 'Missing Telegram config' }), { status: 500 });
  }

  try {
    const update = await req.json();

    // ── Handle Cron/Automated Triggers ──
    if (update.cron_action === 'morning_briefing') {
      const adminChatIds = (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') || '').split(',').map(id => id.trim());
      // إرسال التقرير لكل المدراء المضافين
      for (const chatId of adminChatIds) {
        if (chatId) await handleMorningBriefing(botToken, chatId);
      }
      return new Response('Cron executed OK');
    }

    // ── Handle Callback (Inline Button Press) ──
    if (update.callback_query) {
      const cb = update.callback_query;
      const cbChatId = String(cb.message?.chat?.id || cb.from?.id);
      const adminChatIds = (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') || '').split(',').map(id => id.trim());

      if (!adminChatIds.includes(cbChatId)) {
        await answerCallback(botToken, cb.id, '⛔ غير مصرح');
        return new Response('OK');
      }

      await handleCallback(botToken, cbChatId, cb);
      return new Response('OK');
    }

    // ── Handle Text Messages / Commands ──
    const message = update.message;
    if (!message?.text) return new Response('OK');

    const chatId = String(message.chat.id);
    const adminChatIds = (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') || '').split(',').map(id => id.trim());
    if (!adminChatIds.includes(chatId)) {
      await sendMessage(botToken, chatId, '⛔ هذا البوت خاص بإدارة جودة فقط');
      return new Response('OK');
    }

    const text = message.text.trim();
    const [rawCommand, ...args] = text.split(/\s+/);
    const arg = args.join(' ');

    // Map reply keyboard button text → slash commands
    const BUTTON_MAP: Record<string, string> = {
      '📦 الطلبات': '/orders',
      '💰 مبيعات اليوم': '/today',
      '🔍 بحث منتج': '/search',
      '📈 الأرباح': '/profit',
      '🧾 المحصّل': '/wallet',
      '⏰ الصلاحية': '/expiry',
      '📉 مخزون منخفض': '/lowstock',
      '⚙️ حالة النظام': '/status',
    };

    const command = BUTTON_MAP[text] || rawCommand.toLowerCase().replace(/@\w+$/, '');

    switch (command) {
      case '/start':
      case '/help':
        await handleHelp(botToken, chatId);
        break;

      case '/orders':
        await handleOrders(botToken, chatId);
        break;

      case '/order':
        if (!arg) { await sendMessage(botToken, chatId, 'استخدم: /order ORD-2026-0001'); break; }
        await handleOrderDetail(botToken, chatId, arg);
        break;

      case '/stock':
        if (!arg) { await sendMessage(botToken, chatId, 'استخدم: /stock [باركود]'); break; }
        await handleStock(botToken, chatId, arg);
        break;

      case '/lowstock':
        await handleLowStock(botToken, chatId);
        break;

      case '/today':
        await handleToday(botToken, chatId);
        break;

      case '/briefing':
        await handleMorningBriefing(botToken, chatId);
        break;

      case '/maintenance':
        await handleMaintenance(botToken, chatId, arg || undefined);
        break;

      case '/status':
        await handleStatus(botToken, chatId);
        break;

      case '/search':
        if (!arg) { await sendMessage(botToken, chatId, 'استخدم: /search [اسم المنتج]'); break; }
        await handleSearch(botToken, chatId, arg);
        break;

      case '/expense':
        if (!arg) { await sendMessage(botToken, chatId, '💸 الصيغة: /expense [مبلغ] [وصف]\nمثال: /expense 5000 بنزين'); break; }
        await handleExpense(botToken, chatId, arg);
        break;

      case '/expiry':
        await handleExpiry(botToken, chatId, arg || undefined);
        break;

      case '/profit':
        await handleProfit(botToken, chatId, arg || undefined);
        break;

      case '/wallet':
        await handleWallet(botToken, chatId, arg || undefined);
        break;

      default:
        await sendMessage(botToken, chatId, '❓ أمر غير معروف. أرسل /help لعرض الأوامر المتاحة.');
    }
  } catch (err: any) {
    console.error('Telegram bot error:', err);
    // Don't expose errors to Telegram
  }

  return new Response('OK');
});
