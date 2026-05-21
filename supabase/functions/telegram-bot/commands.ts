import { sendMessage, sendMainMenu, getClients, STATUS_LABEL, buildOrderButtons } from './utils.ts';

function now() { return new Date().toISOString().replace('T', ' ').slice(0, 19); }
function dt(iso: string) { return iso ? new Date(iso).toISOString().replace('T', ' ').slice(0, 19) : ''; }

async function handleHelp(token: string, chatId: string) {
  const text = `<b>اهلا بك في بوت جودة</b>

استخدم الازرار السفلية للوصول السريع.

<b>اوامر:</b>
/order [رقم] - تفاصيل طلب
/stock [باركود] - مخزون منتج
/search [اسم] - بحث عن منتج
/expense [مبلغ] [وصف] - تسجيل مصروف

<b>اوامر النظام:</b>
/maintenance - تفعيل/الغاء الصيانة`.trim();
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
  if (error || !data?.length) { await sendMessage(token, chatId, 'لا توجد طلبات معلقة حاليا'); return; }
  let text = `<b>الطلبات المعلقة (${data.length})</b>\n\n`;
  for (const o of data) {
    text += `${STATUS_LABEL[o.status] || o.status} <b>${o.order_number}</b>\n`;
    text += `${o.customer_name} - ${(o.total || 0).toLocaleString()} ر.ي\n\n`;
  }
  text += `للتفاصيل: /order [رقم الطلب]`;
  await sendMessage(token, chatId, text);
}

async function handleOrderDetail(token: string, chatId: string, orderNum: string) {
  const { jouda } = getClients();
  const { data: order } = await jouda.from('customer_orders').select('*').eq('order_number', orderNum.toUpperCase()).single();
  if (!order) { await sendMessage(token, chatId, `لم يتم العثور على طلب: ${orderNum}`); return; }
  const { data: items } = await jouda.from('order_items').select('product_name, quantity, unit_price, total_price').eq('order_id', order.id);
  const itemsList = (items || []).map((i: any) => `• ${i.product_name} x ${i.quantity} = ${(i.total_price || 0).toLocaleString()}`).join('\n');
  const text = `<b>طلب من تطبيق جودة</b>\n\nتفاصيل الطلب: ${order.order_number}\n\n${STATUS_LABEL[order.status] || order.status}
العميل: ${order.customer_name}
الهاتف: ${order.customer_phone}
العنوان: ${order.customer_address || '-'}
التاريخ: ${dt(order.created_at)}

الاصناف:
${itemsList || 'لا توجد اصناف'}

المجموع: ${(order.subtotal || 0).toLocaleString()} ر.ي
التوصيل: ${(order.delivery_fee || 0).toLocaleString()} ر.ي
الاجمالي: ${(order.total || 0).toLocaleString()} ر.ي`.trim();
  const keyboard = buildOrderButtons(order.id, order.status);
  await sendMessage(token, chatId, text, keyboard ? { reply_markup: keyboard } : {});
}

async function handleStock(token: string, chatId: string, barcode: string) {
  const { inventory } = getClients();
  const { data: product } = await inventory.from('products').select('name, price, cost_price, unit').eq('barcode', barcode).single();
  if (!product) { await sendMessage(token, chatId, `لا يوجد منتج: ${barcode}`); return; }
  const { data: stock } = await inventory.from('product_stock_summary').select('warehouse_name, current_stock').eq('product_barcode', barcode);
  let text = `<b>${product.name}</b> <code>${barcode}</code>\nسعر البيع: ${(product.price || 0).toLocaleString()} ر.ي\nسعر التكلفة: ${(product.cost_price || 0).toLocaleString()} ر.ي\n\nالمخزون:\n`;
  if (!stock?.length) { text += 'لا يوجد مخزون'; }
  else { let total = 0; for (const s of stock) { const qty = s.current_stock || 0; total += qty; const icon = qty <= 0 ? '-' : qty < 10 ? '!' : '>'; text += `${icon} ${s.warehouse_name}: <b>${qty}</b> ${product.unit || ''}\n`; } text += `\nالاجمالي: ${total} ${product.unit || ''}`; }
  await sendMessage(token, chatId, text);
}

async function handleLowStock(token: string, chatId: string) {
  const { inventory } = getClients();
  const { data: products } = await inventory.from('products').select('barcode, name, min_stock, unit').eq('is_active', true);
  if (!products?.length) { await sendMessage(token, chatId, 'لا توجد منتجات'); return; }
  const { data: stockData } = await inventory.from('product_stock_summary').select('product_barcode, current_stock');
  const stockMap: Record<string, number> = {};
  (stockData || []).forEach((s: any) => { stockMap[s.product_barcode] = (stockMap[s.product_barcode] || 0) + (s.current_stock || 0); });
  const low = products.filter(p => (stockMap[p.barcode] || 0) < p.min_stock);
  if (low.length === 0) { await sendMessage(token, chatId, 'جميع المنتجات فوق الحد الادنى'); return; }
  let text = `<b>منتجات منخفضة المخزون (${low.length})</b>\n\n`;
  for (const p of low.slice(0, 20)) { text += `<b>${p.name}</b>\n   المتبقي: ${stockMap[p.barcode] || 0} / الحد: ${p.min_stock} ${p.unit || ''}\n\n`; }
  await sendMessage(token, chatId, text);
}

async function handleMorningBriefing(token: string, chatId: string) {
  const { inventory } = getClients();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const { data: invoices } = await inventory.from('invoices').select('subtotal, discount').gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()).eq('status', 'POSTED').eq('is_voided', false);
  const totalSales = (invoices || []).reduce((s, i) => s + Math.max((i.subtotal || 0) - (i.discount || 0), 0), 0);
  const invoicesCount = (invoices || []).length;
  const { data: products } = await inventory.from('products').select('barcode, name, min_stock, unit').eq('is_active', true);
  const { data: stockData } = await inventory.from('product_stock_summary').select('product_barcode, current_stock');
  const stockMap: Record<string, number> = {};
  (stockData || []).forEach((s: any) => { stockMap[s.product_barcode] = (stockMap[s.product_barcode] || 0) + (s.current_stock || 0); });
  const lowStock = (products || []).filter(p => (stockMap[p.barcode] || 0) <= p.min_stock);
  const { data: unsettledInvoices } = await inventory.from('invoices').select('collector_id, subtotal, discount').eq('status', 'POSTED').eq('is_settled', false).eq('is_voided', false).eq('payment_method', 'CASH').not('collector_id', 'is', null);
  const collectorDebts: Record<string, number> = {};
  (unsettledInvoices || []).forEach((i: any) => { const amt = Math.max((i.subtotal || 0) - (i.discount || 0), 0); collectorDebts[i.collector_id] = (collectorDebts[i.collector_id] || 0) + amt; });
  const { data: users } = await inventory.from('users').select('id, name, role').in('id', Object.keys(collectorDebts));
  const userMap: Record<string, string> = {};
  (users || []).forEach((u: any) => { userMap[u.id] = u.name; if (u.role === 'admin' || u.name?.toLowerCase() === 'manager') { delete collectorDebts[u.id]; } });
  const { data: unsettledExpenses } = await inventory.from('wallet_ledger').select('user_id, amount').in('user_id', Object.keys(collectorDebts)).is('settlement_batch_id', null).in('status', ['APPROVED', 'POSTED']).eq('entry_type', 'EXPENSE').eq('direction', 'OUT');
  const collectorExpenses: Record<string, number> = {};
  (unsettledExpenses || []).forEach((e: any) => { collectorExpenses[e.user_id] = (collectorExpenses[e.user_id] || 0) + (e.amount || 0); });
  let text = `<b>التقرير الصباحي</b> | ${now()}\n\n`;
  text += `<b>مبيعات الامس:</b>\nالاجمالي: <b>${totalSales.toLocaleString()}</b> ر.ي\nعدد الفواتير: ${invoicesCount}\n\n`;
  text += `<b>نواقص المخزون (${lowStock.length}):</b>\n`;
  if (lowStock.length === 0) { text += 'لا يوجد نواقص\n\n'; }
  else { for (const p of lowStock.slice(0, 5)) { text += `${p.name} (باقي ${stockMap[p.barcode] || 0})\n`; } if (lowStock.length > 5) text += `+ ${lowStock.length - 5} منتجات اخرى...\n`; text += '\n'; }
  const unsettledCount = Object.keys(collectorDebts).length;
  text += `<b>كاش لدى المحصلين (صافي) - ${unsettledCount}:</b>\n`;
  if (unsettledCount === 0) { text += 'جميع المبالغ موردة\n'; }
  else { for (const [colId, grossAmt] of Object.entries(collectorDebts)) { if (grossAmt > 0) { const exp = collectorExpenses[colId] || 0; const net = grossAmt - exp; text += `${userMap[colId] || colId}: <b>${net.toLocaleString()}</b> ر.ي (محصل: ${grossAmt.toLocaleString()} | مصروفات: ${exp.toLocaleString()})\n`; } } }
  await sendMessage(token, chatId, text);
}

async function handleToday(token: string, chatId: string) {
  const { inventory, jouda } = getClients();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const iso = todayStart.toISOString();
  const { data: invoices } = await inventory.from('invoices').select('subtotal, status').gte('created_at', iso).eq('status', 'POSTED');
  const totalSales = (invoices || []).reduce((s: number, i: any) => s + (i.subtotal || 0), 0);
  const invoiceCount = invoices?.length || 0;
  const { data: appOrders } = await jouda.from('customer_orders').select('id, status').gte('created_at', iso);
  const orderCount = appOrders?.length || 0;
  const pending = (appOrders || []).filter((o: any) => ['submitted', 'confirmed', 'preparing'].includes(o.status)).length;
  const delivered = (appOrders || []).filter((o: any) => o.status === 'delivered').length;
  const text = `<b>تقرير اليوم</b> | ${now()}

المبيعات:
• فواتير: ${invoiceCount}
• اجمالي المبيعات: ${totalSales.toLocaleString()} ر.ي

طلبات التطبيق:
• اجمالي: ${orderCount}
• معلقة: ${pending}
• مسلمة: ${delivered}`.trim();
  await sendMessage(token, chatId, text);
}

async function handleMaintenance(token: string, chatId: string, arg?: string) {
  const { jouda } = getClients();
  if (!arg || !['on', 'off'].includes(arg.toLowerCase())) {
    const { data } = await jouda.from('app_settings').select('maintenance_mode').eq('id', 1).single();
    const current = data?.maintenance_mode ? 'مفعل' : 'معطل';
    await sendMessage(token, chatId, `وضع الصيانة: ${current}\n\nللتبديل: /maintenance on او /maintenance off`);
    return;
  }
  const mode = arg.toLowerCase() === 'on';
  await jouda.from('app_settings').update({ maintenance_mode: mode }).eq('id', 1);
  await sendMessage(token, chatId, `وضع الصيانة: ${mode ? 'مفعل - التطبيق متوقف' : 'معطل - التطبيق يعمل'}`);
}

async function handleStatus(token: string, chatId: string) {
  const { jouda, inventory } = getClients();
  const { data: settings } = await jouda.from('app_settings').select('maintenance_mode').eq('id', 1).single();
  const { count: productCount } = await inventory.from('products').select('barcode', { count: 'exact', head: true }).eq('is_active', true);
  const { count: pendingOrders } = await jouda.from('customer_orders').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'confirmed', 'preparing']);
  const maintenance = settings?.maintenance_mode ? 'صيانة' : 'يعمل';
  const text = `<b>حالة النظام</b>

التطبيق: ${maintenance}
المنتجات النشطة: ${productCount || 0}
طلبات معلقة: ${pendingOrders || 0}
${now()}`.trim();
  await sendMessage(token, chatId, text);
}

async function handleSearch(token: string, chatId: string, query: string) {
  const { inventory } = getClients();
  const { data: products } = await inventory.from('products').select('barcode, name, price, cost_price, unit').eq('is_active', true).ilike('name', `%${query}%`).limit(10);
  if (!products?.length) { await sendMessage(token, chatId, `لا توجد منتجات تطابق: "${query}"`); return; }
  const { data: stockData } = await inventory.from('product_stock_summary').select('product_barcode, current_stock');
  const stockMap: Record<string, number> = {};
  (stockData || []).forEach((s: any) => { stockMap[s.product_barcode] = (stockMap[s.product_barcode] || 0) + (s.current_stock || 0); });
  let text = `<b>نتائج البحث: "${query}" (${products.length})</b>\n\n`;
  for (const p of products) { const qty = stockMap[p.barcode] || 0; const icon = qty <= 0 ? '-' : qty < 10 ? '!' : '>'; text += `${icon} <b>${p.name}</b>\n   <code>${p.barcode}</code> | ${(p.price || 0).toLocaleString()} ر.ي | ${qty} ${p.unit || ''}\n\n`; }
  await sendMessage(token, chatId, text);
}

async function handleExpense(token: string, chatId: string, arg: string) {
  const match = arg.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (!match) { await sendMessage(token, chatId, '<b>تسجيل مصروف</b>\n\nالصيغة: /expense [المبلغ] [الوصف]\n\nمثال: /expense 5000 بنزين'); return; }
  const amount = parseFloat(match[1]); const note = match[2].trim();
  if (amount <= 0) { await sendMessage(token, chatId, 'المبلغ يجب ان يكون اكبر من صفر'); return; }
  const { inventory } = getClients();
  const systemUserId = Deno.env.get('SYSTEM_USER_UUID') || 'admin';
  const { error } = await inventory.from('wallet_ledger').insert({ user_id: systemUserId, entry_type: 'EXPENSE', direction: 'OUT', amount, expense_category: 'تليجرام', status: 'POSTED', note: note, created_by: systemUserId, idempotency_key: `tg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` });
  if (error) { await sendMessage(token, chatId, `فشل التسجيل: ${error.message}`); return; }
  await sendMessage(token, chatId, `<b>تم تسجيل المصروف</b>\n\nالمبلغ: <b>${amount.toLocaleString()}</b> ر.ي\nالوصف: ${note}\n${now()}`);
}

async function handleExpiry(token: string, chatId: string, arg?: string) {
  const { inventory } = getClients();
  const daysAhead = parseInt(arg || '30') || 30;
  const cutoffDate = new Date(); cutoffDate.setDate(cutoffDate.getDate() + daysAhead);
  const cutoffIso = cutoffDate.toISOString().split('T')[0];
  const { data: batches } = await inventory.from('active_expiry_batches').select('product_barcode, product_name_snapshot, expiry_date, warehouse_name, remaining_qty').lte('expiry_date', cutoffIso).gt('remaining_qty', 0).order('expiry_date', { ascending: true }).limit(25);
  if (!batches?.length) { await sendMessage(token, chatId, `لا توجد منتجات تنتهي صلاحيتها خلال ${daysAhead} يوم`); return; }
  const today = new Date();
  let text = `<b>منتجات قريبة الصلاحية (خلال ${daysAhead} يوم)</b>\n\n`;
  for (const b of batches) {
    const expDate = new Date(b.expiry_date);
    const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const icon = daysLeft <= 0 ? 'منتهي!' : daysLeft <= 7 ? '!' : '~';
    const daysLabel = daysLeft <= 0 ? '<b>منتهي الصلاحية!</b>' : `باقي ${daysLeft} يوم`;
    text += `${icon} <b>${b.product_name_snapshot}</b>\n   ${b.expiry_date} - ${daysLabel}\n   ${b.remaining_qty} | ${b.warehouse_name}\n\n`;
  }
  await sendMessage(token, chatId, text);
}

async function handleProfit(token: string, chatId: string, arg?: string) {
  const { inventory } = getClients();
  const startDate = new Date(); let periodLabel = 'اليوم';
  if (arg === 'week' || arg === 'اسبوع') { startDate.setDate(startDate.getDate() - 7); periodLabel = 'اخر 7 ايام'; }
  else if (arg === 'month' || arg === 'شهر') { startDate.setDate(startDate.getDate() - 30); periodLabel = 'اخر 30 يوم'; }
  else { startDate.setHours(0, 0, 0, 0); }
  const iso = startDate.toISOString();
  const { data: invoices } = await inventory.from('invoices').select('id, subtotal, discount, delivery_fee').gte('created_at', iso).eq('status', 'POSTED').eq('is_voided', false);
  if (!invoices?.length) { await sendMessage(token, chatId, `لا توجد مبيعات في ${periodLabel}`); return; }
  const invoiceIds = invoices.map(i => i.id);
  const { data: items } = await inventory.from('invoice_items').select('product_barcode, quantity, unit_price').in('invoice_id', invoiceIds);
  const barcodes = [...new Set((items || []).map((i: any) => i.product_barcode))];
  const { data: products } = await inventory.from('products').select('barcode, cost_price').in('barcode', barcodes);
  const costMap: Record<string, number> = {}; (products || []).forEach((p: any) => { costMap[p.barcode] = p.cost_price || 0; });
  const totalRevenue = invoices.reduce((s, i) => s + (i.subtotal || 0), 0);
  const totalDiscount = invoices.reduce((s, i) => s + (i.discount || 0), 0);
  const totalDelivery = invoices.reduce((s, i) => s + (i.delivery_fee || 0), 0);
  const totalCost = (items || []).reduce((s: number, i: any) => s + ((costMap[i.product_barcode] || 0) * i.quantity), 0);
  const grossProfit = totalRevenue - totalDiscount - totalCost;
  const { data: expenses } = await inventory.from('wallet_ledger').select('amount').eq('entry_type', 'EXPENSE').eq('direction', 'OUT').in('status', ['APPROVED', 'POSTED']).gte('created_at', iso);
  const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const netProfit = grossProfit - totalExpenses;
  const icon = netProfit >= 0 ? '+' : '-';
  const text = `<b>تقرير الارباح - ${periodLabel}</b>

الايرادات:
• المبيعات: ${totalRevenue.toLocaleString()} ر.ي
• الخصومات: -${totalDiscount.toLocaleString()} ر.ي
• فواتير: ${invoices.length}

التكاليف:
• تكلفة البضاعة: ${totalCost.toLocaleString()} ر.ي

الربح الاجمالي: ${grossProfit.toLocaleString()} ر.ي

المصروفات: ${totalExpenses.toLocaleString()} ر.ي

${icon} <b>صافي الربح: ${netProfit.toLocaleString()}</b> ر.ي`.trim();
  await sendMessage(token, chatId, text);
}

async function handleWallet(token: string, chatId: string, arg?: string) {
  const { inventory } = getClients();
  if (!arg) {
    const { data: users } = await inventory.from('users').select('id, name, role').eq('is_active', true).in('role', ['collector', 'cashier']);
    if (!users?.length) { await sendMessage(token, chatId, 'لا يوجد مستخدمين نشطين'); return; }
    let text = `<b>المستخدمين المتاحين</b>\n\nاستخدم: /wallet [الاسم او ID]\n\n`;
    for (const u of users) { text += `<b>${u.name}</b> (<code>${u.id}</code>) - ${u.role}\n`; }
    await sendMessage(token, chatId, text); return;
  }
  const { data: users } = await inventory.from('users').select('id, name, role').eq('is_active', true);
  const user = (users || []).find((u: any) => { const isMatch = u.id === arg || u.name.includes(arg); const isAdmin = u.role === 'admin' || u.name?.toLowerCase() === 'manager'; return isMatch && !isAdmin; });
  if (!user) { await sendMessage(token, chatId, `لم يتم العثور على مستخدم: "${arg}"\n\nارسل /wallet بدون اسم لعرض القائمة`); return; }
  const { data: unsettledInvoices } = await inventory.from('invoices').select('id, subtotal, discount').eq('collector_id', user.id).eq('status', 'POSTED').eq('is_settled', false).eq('is_voided', false).eq('payment_method', 'CASH');
  const totalCollected = (unsettledInvoices || []).reduce((s: number, i: any) => { return s + Math.max((i.subtotal || 0) - (i.discount || 0), 0); }, 0);
  const { data: expenseEntries } = await inventory.from('wallet_ledger').select('amount, entry_type').eq('user_id', user.id).is('settlement_batch_id', null).in('status', ['APPROVED', 'POSTED']).in('entry_type', ['EXPENSE', 'DEDUCTION']).eq('direction', 'OUT');
  const totalExpenses = (expenseEntries || []).filter((e: any) => e.entry_type === 'EXPENSE').reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const totalDeductions = (expenseEntries || []).filter((e: any) => e.entry_type === 'DEDUCTION').reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const net = totalCollected - totalExpenses - totalDeductions;
  const text = `<b>رصيد المحصل: ${user.name}</b>

المحصل (غير مسوى): ${totalCollected.toLocaleString()} ر.ي
   فواتير: ${unsettledInvoices?.length || 0}

المصروفات: ${totalExpenses.toLocaleString()} ر.ي
الخصومات: ${totalDeductions.toLocaleString()} ر.ي

<b>المطلوب تسليمه: ${net.toLocaleString()}</b> ر.ي`.trim();
  await sendMessage(token, chatId, text);
}

export { handleHelp, handleOrders, handleOrderDetail, handleStock, handleLowStock, handleToday, handleMorningBriefing, handleMaintenance, handleStatus, handleSearch, handleExpense, handleExpiry, handleProfit, handleWallet };
