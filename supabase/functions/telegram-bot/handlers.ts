import { jouda, inventory } from './core.ts';
import { send, edit, answer, sendMenu, fmtDate, wfLine } from './core.ts';
import { execute, buildKeyboard, labelFor } from './workflow.ts';

const SU = () => Deno.env.get('SYSTEM_USER_UUID') || 'admin';
const GIDS = () => (Deno.env.get('TELEGRAM_GROUP_CHAT_ID') || '').split(',').map(s => s.trim()).filter(Boolean);
const ADM = () => (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') || '').split(',').map(s => s.trim()).filter(s => s && !s.startsWith('-'));

// --- Commands ------------------------------------------

export async function cmdHelp(cid: string) { await sendMenu(cid, '/orders /order [n] /stock [b] /lowstock /today /profit /wallet /expiry /search /expense /briefing /maintenance /status'); }

export async function cmdOrders(cid: string) {
  const { data, error } = await jouda().from('customer_orders').select('id,order_number,customer_name,total,status,created_at').in('status', ['submitted','confirmed','preparing','pending','reserved']).order('created_at', { ascending: false }).limit(10);
  if (error || !data?.length) { await send(cid, 'No pending orders'); return; }
  let t = "<b>Pending Orders (" + data.length + ")</b>\n\n";
  for (const o of data) { t += "<code>" + o.order_number + "</code> | " + o.customer_name + " | " + Number(o.total||0).toLocaleString() + " YER\nStatus: " + o.status + " | " + fmtDate(o.created_at) + "\n\n"; }
  await send(cid, t.trim());
}

export async function cmdOrderDetail(cid: string, onum: string) {
  const { data: o } = await jouda().from('customer_orders').select('*').eq('order_number', onum.toUpperCase()).single();
  if (!o) { await send(cid, 'Not found: ' + onum); return; }
  const { data: items } = await jouda().from('order_items').select('product_name,quantity,unit_price,total_price').eq('order_id', o.id);
  const lines = (items || []).map((i: any) => '  ' + i.product_name + ' x' + i.quantity + ' = ' + Number(i.total_price||0).toLocaleString()).join('\n');
  await send(cid, "<b>" + o.order_number + "</b>\nCustomer: " + o.customer_name + "\nPhone: " + o.customer_phone + "\nAddress: " + (o.customer_address||'—') + "\nSubtotal: " + Number(o.subtotal||0).toLocaleString() + " YER\nDelivery: " + Number(o.delivery_fee||0) + " YER\nTotal: " + Number(o.total||0).toLocaleString() + " YER\nStatus: " + o.status + "\n\nItems:\n" + (lines||'None') + "\n\n" + fmtDate(o.created_at));
}

export async function cmdStock(cid: string, barcode: string) {
  const inv = inventory();
  const { data: p } = await inv.from('products').select('name,price,cost_price,unit').eq('barcode', barcode).single();
  if (!p) { await send(cid, 'Not found: ' + barcode); return; }
  const { data: st } = await inv.from('product_stock_summary').select('warehouse_name,current_stock').eq('product_barcode', barcode);
  let t = "<b>" + p.name + "</b> <code>" + barcode + "</code>\nSale: " + Number(p.price||0).toLocaleString() + " | Cost: " + Number(p.cost_price||0).toLocaleString() + " YER\n\nStock:\n";
  if (!st?.length) { t += 'No stock'; } else { let total = 0; for (const s of st) { const q = s.current_stock || 0; total += q; t += (q <= 0 ? '0' : q < 10 ? '!' : '+') + ' ' + s.warehouse_name + ': <b>' + q + '</b> ' + (p.unit||'') + '\n'; } t += '\nTotal: ' + total + ' ' + (p.unit||''); }
  await send(cid, t);
}

export async function cmdLowStock(cid: string) {
  const inv = inventory();
  const { data: ps } = await inv.from('products').select('barcode,name,min_stock,unit').eq('is_active', true);
  if (!ps?.length) { await send(cid, 'No active products'); return; }
  const { data: sd } = await inv.from('product_stock_summary').select('product_barcode,current_stock');
  const mp: Record<string, number> = {}; (sd || []).forEach((s: any) => { mp[s.product_barcode] = (mp[s.product_barcode] || 0) + (s.current_stock || 0); });
  const low = ps.filter(p => (mp[p.barcode] || 0) < p.min_stock);
  if (!low.length) { await send(cid, 'All above minimum'); return; }
  let t = "<b>Low Stock (" + low.length + ")</b>\n\n";
  for (const p of low.slice(0, 15)) t += "<b>" + p.name + "</b> — " + (mp[p.barcode] || 0) + " / " + p.min_stock + " " + (p.unit || '') + "\n";
  await send(cid, t);
}

export async function cmdSearch(cid: string, q: string) {
  const inv = inventory();
  const { data: ps } = await inv.from('products').select('barcode,name,price,cost_price,unit').eq('is_active', true).ilike('name', '%' + q + '%').limit(10);
  if (!ps?.length) { await send(cid, 'No match: ' + q); return; }
  const { data: sd } = await inv.from('product_stock_summary').select('product_barcode,current_stock');
  const mp: Record<string, number> = {}; (sd || []).forEach((s: any) => { mp[s.product_barcode] = (mp[s.product_barcode] || 0) + (s.current_stock || 0); });
  let t = "<b>Results: " + q + " (" + ps.length + ")</b>\n\n";
  for (const p of ps) { const qty = mp[p.barcode] || 0; t += "<b>" + p.name + "</b> <code>" + p.barcode + "</code> | " + Number(p.price || 0).toLocaleString() + " YER | " + qty + " " + (p.unit || '') + "\n"; }
  await send(cid, t);
}

export async function cmdToday(cid: string) {
  const inv = inventory(); const start = new Date(); start.setHours(0, 0, 0, 0);
  const { data: iv } = await inv.from('invoices').select('subtotal').gte('created_at', start.toISOString()).eq('status', 'POSTED');
  const sales = (iv || []).reduce((s, i) => s + Number(i.subtotal || 0), 0);
  const { data: ao } = await jouda().from('customer_orders').select('id,status').gte('created_at', start.toISOString());
  const pend = (ao || []).filter((o: any) => ['submitted', 'confirmed', 'preparing', 'pending', 'reserved'].includes(o.status)).length;
  await send(cid, "<b>Today</b> | " + fmtDate() + "\n\nSales: <b>" + sales.toLocaleString() + "</b> YER | Invoices: " + (iv?.length || 0) + "\nApp Orders: " + (ao?.length || 0) + " | Pending: " + pend);
}

export async function cmdProfit(cid: string, arg?: string) {
  const inv = inventory(); const start = new Date(); let lbl = 'Today';
  if (arg === 'week') { start.setDate(start.getDate() - 7); lbl = '7 Days'; }
  else if (arg === 'month') { start.setDate(start.getDate() - 30); lbl = '30 Days'; }
  else { start.setHours(0, 0, 0, 0); }
  const { data: iv } = await inv.from('invoices').select('id,subtotal,discount').gte('created_at', start.toISOString()).eq('status', 'POSTED').eq('is_voided', false);
  if (!iv?.length) { await send(cid, 'No sales in ' + lbl); return; }
  const ids = iv.map(i => i.id);
  const { data: its } = await inv.from('invoice_items').select('product_barcode,quantity,unit_price').in('invoice_id', ids);
  const bcs = [...new Set((its || []).map((i: any) => i.product_barcode))];
  const { data: prs } = await inv.from('products').select('barcode,cost_price').in('barcode', bcs);
  const cm: Record<string, number> = {}; (prs || []).forEach((p: any) => { cm[p.barcode] = Number(p.cost_price || 0); });
  const rev = iv.reduce((s, i) => s + Number(i.subtotal || 0), 0);
  const disc = iv.reduce((s, i) => s + Number(i.discount || 0), 0);
  const cost = (its || []).reduce((s: number, i: any) => s + (cm[i.product_barcode] || 0) * i.quantity, 0);
  const gp = rev - disc - cost;
  const { data: ex } = await inv.from('wallet_ledger').select('amount').eq('entry_type', 'EXPENSE').eq('direction', 'OUT').in('status', ['APPROVED', 'POSTED']).gte('created_at', start.toISOString());
  const te = (ex || []).reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  await send(cid, "<b>Profit — " + lbl + "</b>\n\nRevenue: " + rev.toLocaleString() + "\nDiscounts: " + disc.toLocaleString() + "\nCost: " + cost.toLocaleString() + "\nGross: " + gp.toLocaleString() + "\nExpenses: " + te.toLocaleString() + "\n\n<b>Net: " + (gp - te).toLocaleString() + " YER</b>");
}

export async function cmdWallet(cid: string, arg?: string) {
  const inv = inventory();
  if (!arg) { const { data: us } = await inv.from('users').select('id,name,role').eq('is_active', true).in('role', ['collector', 'cashier']); if (!us?.length) { await send(cid, 'No collectors'); return; } let t = '<b>Collectors</b>\n/wallet [name]\n\n'; for (const u of us) t += "<b>" + u.name + "</b> <code>" + u.id + "</code> — " + u.role + "\n"; await send(cid, t); return; }
  const { data: us } = await inv.from('users').select('id,name,role').eq('is_active', true);
  const u = (us || []).find((x: any) => (x.id === arg || x.name.includes(arg)) && x.role !== 'admin' && x.name?.toLowerCase() !== 'manager');
  if (!u) { await send(cid, 'Not found: ' + arg); return; }
  const { data: ui } = await inv.from('invoices').select('id,subtotal,discount').eq('collector_id', u.id).eq('status', 'POSTED').eq('is_settled', false).eq('is_voided', false).eq('payment_method', 'CASH');
  const col = (ui || []).reduce((s: number, i: any) => s + Math.max(Number(i.subtotal || 0) - Number(i.discount || 0), 0), 0);
  const { data: ee } = await inv.from('wallet_ledger').select('amount,entry_type').eq('user_id', u.id).is('settlement_batch_id', null).in('status', ['APPROVED', 'POSTED']).in('entry_type', ['EXPENSE', 'DEDUCTION']).eq('direction', 'OUT');
  const exp = (ee || []).filter((e: any) => e.entry_type === 'EXPENSE').reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const ded = (ee || []).filter((e: any) => e.entry_type === 'DEDUCTION').reduce((s: number, e: any) => s + Number(e.amount || 0), 0);
  const net = col - exp - ded;
  await send(cid, "<b>" + u.name + "</b>\n\nCollected: " + col.toLocaleString() + " YER | Invoices: " + (ui?.length || 0) + "\nExpenses: " + exp.toLocaleString() + "\nDeductions: " + ded.toLocaleString() + "\n\n<b>Due: " + net.toLocaleString() + " YER</b>");
}

export async function cmdExpense(cid: string, arg: string) {
  const m = arg.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
  if (!m) { await send(cid, 'Format: /expense [amount] [note]'); return; }
  const amt = parseFloat(m[1]); if (amt <= 0) { await send(cid, 'Amount > 0'); return; }
  const { error } = await inventory().from('wallet_ledger').insert({ user_id: SU(), entry_type: 'EXPENSE', direction: 'OUT', amount: amt, expense_category: 'Telegram', status: 'POSTED', note: m[2].trim(), created_by: SU(), idempotency_key: 'tg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) });
  if (error) { await send(cid, 'Failed: ' + error.message); return; }
  await send(cid, 'Expense: <b>' + amt.toLocaleString() + '</b> YER — ' + m[2].trim());
}

export async function cmdExpiry(cid: string, arg?: string) {
  const days = parseInt(arg || '30') || 30;
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + days);
  const { data: bt } = await inventory().from('active_expiry_batches').select('product_name_snapshot,expiry_date,warehouse_name,remaining_qty').lte('expiry_date', cutoff.toISOString().slice(0, 10)).gt('remaining_qty', 0).order('expiry_date', { ascending: true }).limit(20);
  if (!bt?.length) { await send(cid, 'No products expiring within ' + days + ' days'); return; }
  let t = "<b>Expiring within " + days + " days</b>\n\n"; const now = new Date();
  for (const b of bt) { const dl = Math.ceil((new Date(b.expiry_date).getTime() - now.getTime()) / 86400000); t += "<b>" + b.product_name_snapshot + "</b> | " + b.expiry_date + " | " + dl + "d | " + b.remaining_qty + " | " + b.warehouse_name + "\n"; }
  await send(cid, t);
}

export async function cmdStatus(cid: string) {
  const { count: pc } = await inventory().from('products').select('barcode', { count: 'exact', head: true }).eq('is_active', true);
  const { count: po } = await jouda().from('customer_orders').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'confirmed', 'preparing', 'pending', 'reserved']);
  const { data: s } = await jouda().from('app_settings').select('maintenance_mode').eq('id', 1).single();
  await send(cid, "<b>Status</b>\n\nApp: " + (s?.maintenance_mode ? 'Maintenance' : 'Running') + "\nProducts: " + (pc || 0) + "\nPending Orders: " + (po || 0) + "\n" + fmtDate());
}

export async function cmdMaintenance(cid: string, arg?: string) {
  if (!arg || !['on', 'off'].includes(arg.toLowerCase())) { const { data: s } = await jouda().from('app_settings').select('maintenance_mode').eq('id', 1).single(); await send(cid, 'Maintenance: ' + (s?.maintenance_mode ? 'ON' : 'OFF') + '\n/maintenance on | off'); return; }
  const mode = arg.toLowerCase() === 'on'; await jouda().from('app_settings').update({ maintenance_mode: mode }).eq('id', 1); await send(cid, 'Maintenance: ' + (mode ? 'ON' : 'OFF'));
}

export async function cmdBriefing(cid: string) {
  const inv = inventory(); const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const { data: iv } = await inv.from('invoices').select('subtotal,discount').gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString()).eq('status', 'POSTED').eq('is_voided', false);
  const sales = (iv || []).reduce((s, i) => s + Math.max(Number(i.subtotal || 0) - Number(i.discount || 0), 0), 0);
  const { data: ps } = await inv.from('products').select('barcode,name,min_stock,unit').eq('is_active', true);
  const { data: sd } = await inv.from('product_stock_summary').select('product_barcode,current_stock');
  const sm: Record<string, number> = {}; (sd || []).forEach((s: any) => sm[s.product_barcode] = (sm[s.product_barcode] || 0) + (s.current_stock || 0));
  const low = (ps || []).filter(p => (sm[p.barcode] || 0) <= p.min_stock);
  const { data: ui } = await inv.from('invoices').select('collector_id,subtotal,discount').eq('status', 'POSTED').eq('is_settled', false).eq('is_voided', false).eq('payment_method', 'CASH').not('collector_id', 'is', null);
  const cd: Record<string, number> = {}; (ui || []).forEach((i: any) => { cd[i.collector_id] = (cd[i.collector_id] || 0) + Math.max(Number(i.subtotal || 0) - Number(i.discount || 0), 0); });
  const { data: us } = await inv.from('users').select('id,name,role').in('id', Object.keys(cd));
  const um: Record<string, string> = {}; (us || []).forEach((u: any) => { um[u.id] = u.name; if (u.role === 'admin' || u.name?.toLowerCase() === 'manager') delete cd[u.id]; });
  const { data: ue } = await inv.from('wallet_ledger').select('user_id,amount').in('user_id', Object.keys(cd)).is('settlement_batch_id', null).in('status', ['APPROVED', 'POSTED']).eq('entry_type', 'EXPENSE').eq('direction', 'OUT');
  const ce: Record<string, number> = {}; (ue || []).forEach((e: any) => ce[e.user_id] = (ce[e.user_id] || 0) + Number(e.amount || 0));
  let t = "<b>Morning Briefing</b> | " + fmtDate() + "\n\nSales Yesterday: <b>" + sales.toLocaleString() + "</b> YER | " + (iv?.length || 0) + " invoices\n\nLow Stock (" + low.length + "):\n";
  if (!low.length) t += 'None\n'; else for (const p of low.slice(0, 5)) t += p.name + " (" + (sm[p.barcode] || 0) + ")\n";
  t += "\nCollectors (Net):\n";
  if (!Object.keys(cd).length) t += 'All settled\n';
  else for (const [cid, gross] of Object.entries(cd)) { if (gross > 0) { const e = ce[cid] || 0; t += (um[cid] || cid) + ": <b>" + (gross - e).toLocaleString() + "</b> YER | Collected: " + gross.toLocaleString() + " | Expenses: " + e.toLocaleString() + "\n"; } }
  await send(cid, t);
}

// --- Callbacks -----------------------------------------

export async function handleCallback(cb: any) {
  const data = String(cb.data);
  if (data.startsWith('act_approve_') || data.startsWith('act_reject_')) { await handleApproval(cb, data); return; }
  if (data.startsWith('act_') || data.startsWith('inv_') || data.startsWith('wf_')) {
    let norm = data;
    if (data.startsWith('inv_')) norm = data.replace(/^inv_/, 'act_');
    if (data.startsWith('wf_')) norm = data.replace(/^wf_/, 'act_');
    cb.data = norm;
    const result = await execute(cb, {
      async getState(id: string) {
        const { data: o } = await jouda().from('customer_orders').select('id,status,workflow_locked_by').eq('id', id).single();
        if (o) return { status: o.status, lockedBy: (o as any).workflow_locked_by };
        const { data: o2 } = await jouda().from('customer_orders').select('id,status,workflow_locked_by').eq('quotation_id', id).single();
        if (o2) return { status: o2.status, lockedBy: (o2 as any).workflow_locked_by };
        const { data: inv } = await inventory().from('invoices').select('id,workflow_status,workflow_locked_by').eq('id', id).single();
        if (inv) return { status: inv.workflow_status || 'pending', lockedBy: inv.workflow_locked_by };
        return null;
      },
      async updateState(id: string, status: string, lockedBy: string) {
        const now = new Date().toISOString();
        const { error: e1 } = await jouda().from('customer_orders').update({ status, workflow_locked_by: lockedBy, workflow_updated_at: now }).eq('id', id);
        const { error: e2 } = await jouda().from('customer_orders').update({ status, workflow_locked_by: lockedBy, workflow_updated_at: now }).eq('quotation_id', id);
        if (!e1 || !e2) return null;
        const { error: e3 } = await inventory().from('invoices').update({ workflow_status: status, workflow_locked_by: lockedBy, workflow_updated_at: now }).eq('id', id);
        return (e1 && e2 && e3) ? 'Update failed' : null;
      },
      async onReverse(id: string) {
        const { error } = await inventory().rpc('reverse_invoice', { p_invoice_id: id, p_actor_user_id: SU(), p_reason: 'Reversed from Telegram', p_idempotency_key: crypto.randomUUID() });
        if (error) return error.message;
        await jouda().from('customer_orders').update({ status: 'cancelled' }).eq('id', id);
        return null;
      },
    });
    if (!result.ok) { await answer(cb.id, result.error || 'Error', true); return; }
    await answer(cb.id, labelFor(result.action!) + ' | ' + result.actorName);
    if (result.messageId && result.chatId) {
      const orig = cb.message?.text || '';
      let txt: string;
      if (result.nextStatus === 'cancelled') txt = 'REVERSED: <code>' + result.id + '</code>\n' + orig + '\n\n' + wfLine(labelFor('reverse'), result.actorName!);
      else txt = orig + '\n' + wfLine(labelFor(result.nextStatus!), result.actorName!);
      const kb = result.nextStatus === 'cancelled' ? undefined : buildKeyboard(result.id!, result.nextStatus!);
      await edit(result.chatId, result.messageId, txt, kb);
    }
    if (result.nextStatus !== 'cancelled') { try { await jouda().from('customer_orders').update({ status: result.nextStatus }).eq('id', result.id); } catch { /* */ } }
    return;
  }
  if (data.startsWith('order_')) {
    const parts = data.split('_'); const ns = parts[1]; const oid = parts.slice(2).join('_');
    const name = cb.from?.first_name || 'Staff';
    const { data: o } = await jouda().from('customer_orders').select('*').eq('id', oid).single();
    if (!o) { await answer(cb.id, 'Not found', true); return; }
    if (ns === 'confirmed' && o.quotation_id) await inventory().rpc('convert_quotation_to_invoice', { p_invoice_id: o.quotation_id, p_converted_by: SU() });
    if (ns === 'cancelled' && o.status === 'confirmed' && o.quotation_id) await inventory().rpc('reverse_invoice', { p_invoice_id: o.quotation_id, p_actor_user_id: SU(), p_reason: 'Cancelled', p_idempotency_key: crypto.randomUUID() });
    await jouda().from('customer_orders').update({ status: ns }).eq('id', oid);
    await answer(cb.id, ns + ' | ' + name);
  }
}

async function handleApproval(cb: any, data: string) {
  const parts = data.split('_'); const action = parts[1]; const oid = parts.slice(2).join('_');
  const aid = String(cb.from?.id); const aname = cb.from?.first_name || 'Admin';
  const msgId = cb.message?.message_id; const cid = String(cb.message?.chat?.id);
  if (!ADM().includes(aid)) { await answer(cb.id, 'Manager only', true); return; }
  const { data: o } = await jouda().from('customer_orders').select('*').eq('id', oid).single();
  if (!o || o.status !== 'submitted') { await answer(cb.id, 'Already handled', true); return; }
  if (action === 'reject') {
    await jouda().from('customer_orders').update({ status: 'cancelled' }).eq('id', oid);
    if (msgId && cid) await edit(cid, msgId, (cb.message?.text||'') + '\n\nRejected — ' + aname + ' (' + fmtDate() + ')');
    await answer(cb.id, 'Rejected');
    return;
  }
  if (o.quotation_id) { const { error } = await inventory().rpc('convert_quotation_to_invoice', { p_invoice_id: o.quotation_id, p_converted_by: SU() }); if (error) { await answer(cb.id, 'Failed: ' + error.message, true); return; } }
  await jouda().from('customer_orders').update({ status: 'confirmed' }).eq('id', oid);
  if (msgId && cid) await edit(cid, msgId, (cb.message?.text||'') + '\n\nApproved & sent to group — ' + aname);
  const { data: items } = await jouda().from('order_items').select('product_name, quantity').eq('order_id', oid);
  const it = (items || []).map((i: any) => '  ' + i.product_name + ' x' + i.quantity).join('\n');
  const card = ['<code>' + o.order_number + '</code> | ' + o.customer_name + ' | ' + Number(o.total||0).toLocaleString() + ' YER', o.customer_phone ? 'Phone: ' + o.customer_phone : '', o.customer_address ? 'Address: ' + o.customer_address : '', 'Items:', it || 'None', fmtDate(o.created_at)].filter(Boolean).join('\n');
  const kb = buildKeyboard(oid, 'confirmed');
  for (const gId of GIDS()) { try { await send(gId, card, kb); } catch { /* */ } }
  await answer(cb.id, 'Sent to group');
}

// --- Pipelines -----------------------------------------

export async function handleNewInvoice(rec: any) {
  if (!rec.customer_name_snapshot) return;
  const inv = inventory();
  const { count } = await inv.from('invoice_items').select('id', { count: 'exact', head: true }).eq('invoice_id', rec.id);
  let collector = '';
  if (rec.collector_id) { const { data: u } = await inv.from('users').select('name').eq('id', rec.collector_id).single(); if (u) collector = u.name; }
  try { await jouda().from('customer_orders').insert({ id: crypto.randomUUID(), quotation_id: rec.id, order_number: rec.id, customer_name: rec.customer_name_snapshot, customer_phone: rec.customer_phone_snapshot || '', customer_address: rec.customer_address_snapshot || null, subtotal: rec.subtotal || 0, delivery_fee: rec.delivery_fee || 0, total: rec.total_amount || 0, payment_method: rec.payment_method || 'CASH', status: 'pending' }); } catch { /* */ }
  const a = Math.max(Number(rec.subtotal||0) - Number(rec.discount||0), 0);
  const pm = rec.payment_method === 'CASH' ? 'Cash' : rec.payment_method || '?';
  const msg = ['<code>' + rec.id + '</code> | ' + (rec.customer_name_snapshot||'—') + ' | ' + a.toLocaleString() + ' YER', 'Delivery ' + (rec.delivery_fee||0) + ' | ' + pm + (collector ? ' | Collector: ' + collector : ''), 'Items: ' + (count||0), fmtDate(rec.created_at)].join('\n');
  const kb = buildKeyboard(rec.id, 'pending');
  for (const gId of GIDS()) { try { await send(gId, msg, kb); } catch { /* */ } }
}

export async function handleReversedInvoice(rec: any) {
  if (!rec.is_voided) return;
  try { await jouda().from('customer_orders').update({ status: 'cancelled' }).eq('quotation_id', rec.id); } catch { /* */ }
  const msg = 'REVERSED: <code>' + rec.id + '</code>\nAmount: ' + Number(rec.total_amount||0).toLocaleString() + ' YER\nStock restored | ' + fmtDate();
  for (const gId of GIDS()) { try { await send(gId, msg); } catch { /* */ } }
}
