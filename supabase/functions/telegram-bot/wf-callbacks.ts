// ═══════════════════════════════════════════════════════
// wf-callbacks.ts — App Order Workflow (wf_* buttons)
// ═══════════════════════════════════════════════════════
//
// Handles: wf_approve, wf_reject, wf_reserve, wf_prepare,
//          wf_deliver, wf_paid, wf_deposit, wf_cancel

import { answerCallback, editMessage, sendMessage } from './telegram.ts';
import { getClients } from './db.ts';
import { env, isAdmin, getInventoryUserId } from './config.ts';
import { APP_ACTIONS, appOrderButtons, APP_TO_INV_STATUS_MAP } from './workflow.ts';
import { fmtDate, whatsappButton } from './format.ts';
import { parseCallbackData, handleAbort, requireConfirmation } from './confirmations.ts';

// ─── Main Handler ───────────────────────────────────────

export async function handleWfCallback(
  token: string,
  chatId: string,
  callback: any,
) {
  const { action, id: orderId, isConfirmed, isAbort, isUndo } = parseCallbackData(callback.data);
  const userName = callback.from?.first_name || 'موظف';
  const userId = String(callback.from?.id);
  const messageId = callback.message?.message_id;

  const { jouda, inventory } = getClients();

  // ── 1. Fetch current order ──
  const { data: order, error: orderErr } = await jouda
    .from('customer_orders')
    .select(
      'id, status, quotation_id, order_number, customer_name, customer_phone, subtotal, discount, delivery_fee, total, payment_method, notes, latitude, longitude',
    )
    .eq('id', orderId)
    .single();

  if (!order || orderErr) {
    await answerCallback(token, callback.id, '⚠️ الطلب غير موجود', true);
    return;
  }

  // ── 1.5 Special action: undo ──
  if (isUndo) {
    const prevStatus = (callback.data as string).split('_')[2];
    await handleUndo(token, chatId, callback, orderId, prevStatus, userName);
    return;
  }

  // ── 1.6 Special action: abort (cancel confirmation) ──
  if (isAbort) {
    const restoredButtons = appOrderButtons(orderId, order.status, order.latitude, order.longitude);
    await handleAbort(token, chatId, callback.id, messageId, callback.message?.text || '', restoredButtons);
    return;
  }

  // ── 2. Validate action against state machine ──
  const currentActions = APP_ACTIONS[order.status];
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

  // ── 3.5 Check Confirmation ──
  if (actionDef.requiresConfirmation && !isConfirmed) {
    await requireConfirmation(token, chatId, callback.id, messageId, callback.message?.text || '', action, orderId, actionDef, 'wf');
    return;
  }

  // ── 4. Special actions: approve & reject ──
  if (action === 'approve') {
    await handleApprove(token, chatId, callback, order, userName);
    return;
  }

  if (action === 'reject') {
    await handleReject(token, chatId, callback, order, userName);
    return;
  }

  // ── 5. Cancel → reverse inventory if stock was deducted ──
  if (
    action === 'cancel' &&
    ['confirmed', 'reserved', 'preparing'].includes(order.status) &&
    order.quotation_id
  ) {
    const suid = env.systemUserId();
    const { error: reverseErr } = await inventory.rpc('reverse_invoice', {
      p_invoice_id: order.quotation_id,
      p_actor_user_id: suid,
      p_reason: 'إلغاء طلب تطبيق من تليجرام',
      p_idempotency_key: `rev_${order.quotation_id}`,
    });
    if (reverseErr) {
      await answerCallback(
        token,
        callback.id,
        `فشل إلغاء المخزون: ${reverseErr.message}`,
        true,
      );
      return;
    }
  }

  // ── 5.5 Deposit → settle invoice via RPC (creates settlement_batch + wallet entry) ──
  // TEMPORARILY DISABLED PER USER REQUEST (2026-06-25)
  /*
  if (action === 'deposit' && order.quotation_id) {
    const { data: settleResult, error: settleErr } = await inventory.rpc('settle_single_invoice', {
      p_invoice_id: order.quotation_id,
      p_actor_user_id: env.systemUserId(),
      p_idempotency_key: `settle_${order.quotation_id}`,
    });
    if (settleErr) {
      await answerCallback(
        token,
        callback.id,
        `فشل تسجيل التوريد في المخزون: ${settleErr.message}`,
        true,
      );
      return;
    }
    const settleData = settleResult as any;
    if (settleData && settleData.success === false) {
      await answerCallback(
        token,
        callback.id,
        `فشل تسجيل التوريد: ${settleData.error || 'خطأ غير معروف'}`,
        true,
      );
      return;
    }
  }
  */

  // ── 5.6 Invoice Assignment (Driver Mapping) — reserve only ──
  // TEMPORARILY DISABLED PER USER REQUEST (2026-06-25)
  // Only assign collector at the 'reserve' step. Prepare/deliver can be done by anyone.
  /*
  if (action === 'reserve' && order.quotation_id) {
    const inventoryUserId = getInventoryUserId(userId);
    if (inventoryUserId) {
      const { data, error } = await inventory.rpc('assign_invoice_to_collector', {
        p_invoice_id: order.quotation_id,
        p_collector_id: inventoryUserId,
        p_actor_user_id: env.systemUserId(),
      });
      if (error || (data && data.success === false)) {
        const errMsg = error?.message || data?.error || 'Unknown error';
        console.error('Failed to assign invoice:', errMsg);
        await answerCallback(token, callback.id, `⚠️ لم يتم إسناد الفاتورة في المخزون: ${errMsg}`, true);
      } else {
        // 2. Create COLLECTION entry (since convert_quotation skipped it)
        const companyAmount = Math.max((order.subtotal || 0) - (order.discount || 0), 0);
        if (companyAmount > 0 && order.payment_method === 'CASH') {
          await inventory.from('wallet_ledger').insert({
            user_id: inventoryUserId,
            invoice_id: order.quotation_id,
            entry_type: 'COLLECTION',
            direction: 'IN',
            amount: companyAmount,
            status: 'POSTED',
            idempotency_key: `wl_tg_${order.quotation_id}`,
            note: 'تحصيل من طلب تطبيق',
            created_by: env.systemUserId(),
          });
        }
      }
    } else {
      // Not mapped in TELEGRAM_DRIVER_MAP — block reserve since we need a collector
      await answerCallback(token, callback.id, `⚠️ لا يمكنك حجز الطلب: حسابك (${userId}) غير مربوط بالمخزون في TELEGRAM_DRIVER_MAP`, true);
      return;
    }
  }
  */

  // ── 6. Update status (optimistic lock) ──
  const updatePayload: Record<string, unknown> = {
    status: actionDef.nextStatus,
  };
  if (actionDef.nextStatus === 'delivered')
    updatePayload.delivered_at = new Date().toISOString();
  if (actionDef.nextStatus === 'cancelled')
    updatePayload.cancelled_at = new Date().toISOString();

  const { data: updated, error: updateErr } = await jouda
    .from('customer_orders')
    .update(updatePayload)
    .eq('id', orderId)
    .eq('status', order.status) // Optimistic lock
    .select('id')
    .single();

  if (updateErr || !updated) {
    await answerCallback(
      token,
      callback.id,
      '⚠️ سبقك زميلك — الطلب تم تحديثه مسبقاً',
      true,
    );
    return;
  }

  // ── 6.5 Sync status to Inventory workflow_status ──
  if (order.quotation_id && actionDef.nextStatus !== 'cancelled') {
    if (APP_TO_INV_STATUS_MAP[actionDef.nextStatus]) {
      await inventory.from('invoices').update({ workflow_status: APP_TO_INV_STATUS_MAP[actionDef.nextStatus] }).eq('id', order.quotation_id);
    }
  }

  // ── 7. Acknowledge ──
  await answerCallback(
    token,
    callback.id,
    `${actionDef.emoji} ${actionDef.label}`,
  );

  // ── 8. Update message: action trail + smart keyboard ──
  if (messageId) {
    const originalText = callback.message?.text || '';
    const hasHeader = originalText.includes('سجل الحركات');
    const headerBlock = hasHeader ? '' : '\n\n📋 <b>سجل الحركات:</b>';
    const trail = `${headerBlock}\n${actionDef.emoji} <b>${actionDef.label}</b> (بواسطة: ${userName})`;
    const nextButtons = appOrderButtons(orderId, actionDef.nextStatus, order.latitude, order.longitude);

    // Append Undo button if eligible
    if (['reserve', 'prepare', 'deliver'].includes(action)) {
      // Must insert before the Google Maps button if it exists (which is usually the last button)
      const undoBtn = [{ text: '🔙 تراجع عن الحركة السابقة', callback_data: `wf_undo_${order.status}_${orderId}` }];
      if (order.latitude && order.longitude && nextButtons.length > 0) {
        // Insert before the last button (which is the map)
        nextButtons.splice(nextButtons.length - 1, 0, undoBtn);
      } else {
        nextButtons.push(undoBtn);
      }
    }

    await editMessage(token, chatId, messageId, originalText + trail, {
      reply_markup:
        nextButtons.length > 0
          ? { inline_keyboard: nextButtons }
          : undefined,
    });
  }

  // ── 9. WhatsApp notification for key statuses ──
  if (
    ['delivered'].includes(actionDef.nextStatus) &&
    order.customer_phone
  ) {
    const msgs: Record<string, string> = {
      delivered: 'تم تسليم طلبك بنجاح 🎉\n\nنهتم جداً برأيك! كيف كانت تجربتك معنا؟\nنرجو منك تقييم الخدمة عبر الرد على هذه الرسالة من 1 إلى 5 نجوم ⭐\n(ملاحظاتك تساعدنا على تقديم الأفضل دائماً)',
    };
    const waText = `*جوده — تحديث طلبك*\n\n*رقم الطلب:* ${order.order_number}\n${msgs[actionDef.nextStatus]}\n\n*المبلغ:* ${(order.total || 0).toLocaleString()} ر.ي\n\nشكراً لاختيارك جوده`;
    const waHtml = whatsappButton(order.customer_phone, waText);
    await sendMessage(token, chatId, waHtml, {
      disable_web_page_preview: true,
    });
  }
}

// ─── Approve (Admin only) ───────────────────────────────
// 1. Convert quotation → invoice in Inventory (deduct stock)
// 2. Update status to confirmed
// 3. Edit admin message (remove buttons)
// 4. Send order to group with team workflow buttons
// 5. Send WhatsApp link for customer notification

async function handleApprove(
  token: string,
  chatId: string,
  callback: any,
  order: any,
  userName: string,
) {
  const messageId = callback.message?.message_id;
  const { jouda, inventory } = getClients();

  // Convert quotation to invoice (deduct stock)
  let newQuotationId = order.quotation_id;
  if (order.quotation_id) {
    const suid = env.systemUserId();
    const { data: rpcResult, error: convertErr } = await inventory.rpc(
      'convert_quotation_to_invoice',
      {
        p_invoice_id: order.quotation_id,
        p_converted_by: suid,
      },
    );
    if (convertErr) {
      await answerCallback(
        token,
        callback.id,
        `فشل خصم المخزون: ${convertErr.message}`,
        true,
      );
      return;
    }
    const result = rpcResult as any;
    if (result && result.success === false) {
      await answerCallback(
        token,
        callback.id,
        `فشل خصم المخزون: ${result.error || 'خطأ'}`,
        true,
      );
      return;
    }
    
    // Capture the new invoice ID (whether freshly generated or recovered via idempotency)
    if (typeof result === 'string' && result.startsWith('INV-')) {
      newQuotationId = result;
    } else if (result && typeof result === 'object' && result.invoice_id) {
      newQuotationId = result.invoice_id;
    } else if (result && typeof result === 'object' && result.id) {
      newQuotationId = result.id;
    }
  }

  // Update status (optimistic lock on 'submitted')
  const { data: updated, error: updateErr } = await jouda
    .from('customer_orders')
    .update({
      status: 'confirmed',
      quotation_id: newQuotationId, // Update with the new invoice ID
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .eq('status', 'submitted')
    .select('id')
    .single();

  if (updateErr || !updated) {
    await answerCallback(
      token,
      callback.id,
      '⚠️ تم اتخاذ إجراء على هذا الطلب مسبقاً',
      true,
    );
    return;
  }

  // Edit admin message: show "approved" + remove buttons
  if (messageId) {
    const originalText = callback.message?.text || '';
    const newText =
      originalText +
      `\n\n📋 <b>سجل الحركات:</b>\n✅ <b>تم الاعتماد</b> (بواسطة: ${userName})`;
    await editMessage(token, chatId, messageId, newText, {
      reply_markup: undefined,
    });
  }

  // Build group message with team buttons
  const teamButtons = appOrderButtons(order.id, 'confirmed', order.latitude, order.longitude);
  const orderText = callback.message?.text || '';
  const groupText = orderText.includes('طلب جديد')
    ? orderText
    : `🛒 <b>طلب من تطبيق جوده</b>\n\n${orderText}`;

  // Send to all groups
  for (const gId of env.groupIds()) {
    await sendMessage(token, gId, groupText, {
      reply_markup:
        teamButtons.length > 0
          ? { inline_keyboard: teamButtons }
          : undefined,
    });
  }

  // WhatsApp notification for customer (Temporarily Disabled)
  /*
  if (order.customer_phone) {
    const disc = order.discount || 0;
    const delivery = order.delivery_fee || 0;
    const sub = order.subtotal || 0;
    const tot = order.total || sub + delivery - disc;

    let waMsg = `*جوده — تم تأكيد طلبك* 🛒\n\n`;
    waMsg += `*رقم الطلب:* ${order.order_number}\n`;
    waMsg += `*الاسم:* ${order.customer_name}\n\n`;
    waMsg += `💰 *المبلغ:* ${sub.toLocaleString()} ر.ي`;
    if (disc > 0) waMsg += `\n🏷️ *الخصم:* ${disc.toLocaleString()} ر.ي`;
    waMsg += `\n🚚 *التوصيل:* ${delivery.toLocaleString()} ر.ي`;
    waMsg += `\n💵 *الإجمالي:* ${tot.toLocaleString()} ر.ي`;
    if (order.notes) waMsg += `\n📝 *ملاحظات:* ${order.notes}`;
    waMsg += `\n\nسنقوم بتجهيز طلبك قريباً. شكراً لاختيارك جوده`;

    const waHtml = whatsappButton(order.customer_phone, waMsg);
    for (const gId of env.groupIds()) {
      await sendMessage(token, gId, waHtml, {
        disable_web_page_preview: true,
      });
    }
  }
  */

  await answerCallback(
    token,
    callback.id,
    '✅ تم الاعتماد وإرسال الطلب للمجموعة',
  );
}

// ─── Reject (Admin only) ────────────────────────────────

async function handleReject(
  token: string,
  chatId: string,
  callback: any,
  order: any,
  userName: string,
) {
  const messageId = callback.message?.message_id;
  const { jouda, inventory } = getClients();

  // Void the quotation in Inventory to prevent it from hanging forever
  if (order.quotation_id) {
    const suid = env.systemUserId();
    const { error: voidErr } = await inventory.rpc('void_quotation', {
      p_invoice_id: order.quotation_id,
      p_actor_user_id: suid
    });
    
    if (voidErr) {
      await answerCallback(
        token,
        callback.id,
        `فشل أرشفة عرض السعر في المخزون: ${voidErr.message}`,
        true,
      );
      return;
    }
  }

  const { data: updated, error } = await jouda
    .from('customer_orders')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', order.id)
    .eq('status', 'submitted')
    .select('id')
    .single();

  if (error || !updated) {
    await answerCallback(
      token,
      callback.id,
      '⚠️ الطلب لم يعد قيد الانتظار',
      true,
    );
    return;
  }

  if (messageId) {
    const originalText = callback.message?.text || '';
    const newText =
      originalText +
      `\n\n📋 <b>سجل الحركات:</b>\n❌ <b>تم رفض الطلب</b> (بواسطة: ${userName})`;
    await editMessage(token, chatId, messageId, newText, {
      reply_markup: undefined,
    });
  }

  await answerCallback(token, callback.id, '❌ تم رفض الطلب');
}

// ─── Undo (Fat Finger Rescue) ───────────────────────────

async function handleUndo(
  token: string,
  chatId: string,
  callback: any,
  orderId: string,
  prevStatus: string,
  userName: string,
) {
  const { jouda, inventory } = getClients();
  const messageId = callback.message?.message_id;

  // 1. Time Limit Guard
  const editDate = callback.message?.edit_date || callback.message?.date || 0;
  const now = Math.floor(Date.now() / 1000);
  const timeLimit = parseInt(Deno.env.get('UNDO_TIME_LIMIT_SECONDS') || '180'); // Default 3 minutes
  if (now - editDate > timeLimit) {
    await answerCallback(token, callback.id, `⏳ انتهى وقت التراجع المسموح (${Math.floor(timeLimit / 60)} دقائق)`, true);
    return;
  }

  // 2. Fetch order to verify
  const { data: order, error: orderErr } = await jouda
    .from('customer_orders')
    .select('id, status, quotation_id')
    .eq('id', orderId)
    .single();

  if (!order || orderErr) {
    await answerCallback(token, callback.id, '⚠️ الطلب غير موجود', true);
    return;
  }

  // 3. Revert Status in DB
  const updatePayload: Record<string, unknown> = { status: prevStatus };

  const { data: updated, error: updateErr } = await jouda
    .from('customer_orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select('id')
    .single();

  if (updateErr || !updated) {
    await answerCallback(token, callback.id, '⚠️ فشل التراجع', true);
    return;
  }

  // 3.5 Sync Undo to Inventory workflow_status
  if (order.quotation_id && prevStatus !== 'cancelled') {
    // If we reverted to a status that exists in Inventory
    if (APP_TO_INV_STATUS_MAP[prevStatus]) {
      await inventory.from('invoices').update({ workflow_status: APP_TO_INV_STATUS_MAP[prevStatus] }).eq('id', order.quotation_id);
    } else if (prevStatus === 'confirmed') {
      // 'confirmed' in JoudaApp means it hasn't entered the inventory workflow (pending reserve)
      await inventory.from('invoices').update({ workflow_status: 'pending' }).eq('id', order.quotation_id);
    }
  }

  // If undoing 'reserve' (reverting to 'confirmed'), clear collector and COLLECTION entry
  // TEMPORARILY DISABLED PER USER REQUEST (2026-06-25)
  /*
  if (prevStatus === 'confirmed' && order.quotation_id) {
    const suid = env.systemUserId();
    await inventory.from('invoices').update({
      collector_id: null
    }).eq('id', order.quotation_id);
    
    await inventory.from('wallet_ledger').delete()
      .eq('invoice_id', order.quotation_id)
      .eq('entry_type', 'COLLECTION')
      .eq('direction', 'IN');
  }
  */

  // 4. Update Telegram Message Trail
  if (messageId) {
    const originalText = callback.message?.text || '';
    const lines = originalText.split('\n');
    lines.pop(); // Remove the last trail line
    const newText = lines.join('\n');

    // Generate original buttons for the restored status
    const restoredButtons = appOrderButtons(orderId, prevStatus);

    await editMessage(token, chatId, messageId, newText, {
      reply_markup: restoredButtons.length > 0 ? { inline_keyboard: restoredButtons } : undefined,
    });
  }

  await answerCallback(token, callback.id, '🔙 تم التراجع بنجاح');
}
