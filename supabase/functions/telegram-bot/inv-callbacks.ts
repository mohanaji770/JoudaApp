// ═══════════════════════════════════════════════════════
// inv-callbacks.ts — POS Invoice Workflow (inv_* buttons)
// ═══════════════════════════════════════════════════════
//
// Handles: inv_reserve, inv_prepare, inv_deliver,
//          inv_paid, inv_deposit, inv_reverse

import { answerCallback, editMessage } from './telegram.ts';
import { getClients } from './db.ts';
import { env, isAdmin } from './config.ts';
import { INV_ACTIONS, invButtons } from './workflow.ts';
import { fmtDate } from './format.ts';

// ─── Main Handler ───────────────────────────────────────

export async function handleInvCallback(
  token: string,
  chatId: string,
  callback: any,
) {
  const data = callback.data as string;
  const parts = data.split('_');
  const action = parts[1]; // reserve, prepare, deliver, ...
  const invoiceId = parts.slice(2).join('_'); // ID (may contain hyphens)
  const userName = callback.from?.first_name || 'موظف';
  const userId = String(callback.from?.id);
  const messageId = callback.message?.message_id;

  const { inventory, jouda } = getClients();

  // ── 1. Fetch invoice ──
  const { data: invoice } = await inventory
    .from('invoices')
    .select('id, workflow_status, is_voided, status')
    .eq('id', invoiceId)
    .single();

  if (!invoice || invoice.is_voided) {
    await answerCallback(
      token,
      callback.id,
      '⚠️ الفاتورة غير موجودة أو ملغية',
      true,
    );
    return;
  }

  if (invoice.status !== 'POSTED') {
    await answerCallback(
      token,
      callback.id,
      '⚠️ الفاتورة غير مرحّلة',
      true,
    );
    return;
  }

  const currentWf = invoice.workflow_status || 'pending';

  // ── 2. Validate action against state machine ──
  const currentActions = INV_ACTIONS[currentWf];
  if (!currentActions || !currentActions[action]) {
    await answerCallback(
      token,
      callback.id,
      '⚠️ هذا الإجراء غير متاح في الحالة الحالية',
      true,
    );
    return;
  }

  const actionDef = currentActions[action];

  // ── 3. Admin guard ──
  if (actionDef.adminOnly && !isAdmin(userId)) {
    await answerCallback(
      token,
      callback.id,
      '🔒 هذا الإجراء للمدير فقط',
      true,
    );
    return;
  }

  // ── 4. Handle reverse (special: calls RPC) ──
  if (action === 'reverse') {
    await handleReverse(
      token,
      chatId,
      callback,
      invoiceId,
      userName,
    );
    return;
  }

  // ── 5. Normal action: update workflow_status (optimistic lock) ──
  const { error: updateErr } = await inventory
    .from('invoices')
    .update({
      workflow_status: actionDef.nextStatus,
      workflow_updated_by: userId,
      workflow_updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId)
    .eq('workflow_status', currentWf); // Optimistic lock

  if (updateErr) {
    await answerCallback(
      token,
      callback.id,
      `فشل التحديث: ${updateErr.message}`,
      true,
    );
    return;
  }

  // ── 6. Sync status to JoudaApp ──
  const joudaStatusMap: Record<string, string> = {
    reserve: 'confirmed',
    prepare: 'preparing',
    deliver: 'delivered',
    paid: 'paid',
    deposit: 'deposited',
  };

  if (joudaStatusMap[action]) {
    await jouda
      .from('customer_orders')
      .update({ status: joudaStatusMap[action] })
      .eq('quotation_id', invoiceId);
  }

  // ── 7. Acknowledge ──
  await answerCallback(
    token,
    callback.id,
    `${actionDef.emoji} ${actionDef.label} — ${userName}`,
  );

  // ── 8. Update message: action trail + smart keyboard ──
  if (messageId) {
    const orig = callback.message?.text || '';
    const hasHeader = orig.includes('سجل حركات الطلب');
    const headerBlock = hasHeader ? '' : '\n\n───────────────────\n📋 <b>سجل حركات الطلب:</b>';
    const trail = `${headerBlock}\n• ${actionDef.emoji} <b>${actionDef.label}</b> 👤 <i>${userName}</i> ⏱️ <code>${fmtDate()}</code>`;
    const nextBtns = invButtons(invoiceId, actionDef.nextStatus);

    await editMessage(token, chatId, messageId, orig + trail, {
      reply_markup:
        nextBtns.length > 0
          ? { inline_keyboard: nextBtns }
          : undefined,
    });
  }
}

// ─── Reverse Invoice (Admin only) ───────────────────────

async function handleReverse(
  token: string,
  chatId: string,
  callback: any,
  invoiceId: string,
  userName: string,
) {
  const messageId = callback.message?.message_id;
  const { inventory, jouda } = getClients();
  const suid = env.systemUserId();

  const { data: rpcResult, error } = await inventory.rpc('reverse_invoice', {
    p_invoice_id: invoiceId,
    p_actor_user_id: suid,
    p_reason: 'عكس من تليجرام',
    p_idempotency_key: crypto.randomUUID(),
  });

  if (error) {
    await answerCallback(
      token,
      callback.id,
      `فشل العكس: ${error.message}`,
      true,
    );
    return;
  }

  const result = rpcResult as any;
  if (result && result.success === false) {
    await answerCallback(
      token,
      callback.id,
      `فشل العكس: ${result.error || 'خطأ غير معروف'}`,
      true,
    );
    return;
  }

  // Cancel in JoudaApp too
  await jouda
    .from('customer_orders')
    .update({ status: 'cancelled' })
    .eq('quotation_id', invoiceId);

  await answerCallback(
    token,
    callback.id,
    `🔄 تم عكس الفاتورة — ${userName}`,
  );

  // Update message: remove all buttons
  if (messageId) {
    const orig = callback.message?.text || '';
    const hasHeader = orig.includes('سجل حركات الطلب');
    const headerBlock = hasHeader ? '' : '\n\n───────────────────\n📋 <b>سجل حركات الطلب:</b>';
    const trail = `${headerBlock}\n• 🔄 <b>تم العكس</b> 👤 <i>${userName}</i> ⏱️ <code>${fmtDate()}</code>`;
    await editMessage(token, chatId, messageId, orig + trail, {
      reply_markup: undefined,
    });
  }
}
