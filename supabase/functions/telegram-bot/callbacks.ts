import { 
  sendMessage, 
  editMessage, 
  answerCallback, 
  getClients, 
  fmtDate,
  STATUS_LABEL, 
  VALID_TRANSITIONS, 
  buildOrderButtons 
} from './utils.ts';

// ─── Callback (Inline Button) Handler ──────────────────

async function handleCallback(token: string, chatId: string, callback: any) {
  const data = callback.data as string; // e.g. "order_confirmed_uuid-here" or "wf_reserve_uuid-here"
  const messageId = callback.message?.message_id;

  // ── New Team Workflow Logic (Tracking employees) ──
  if (data.startsWith('wf_')) {
    const parts = data.split('_');
    const action = parts[1];
    const orderId = parts.slice(2).join('_');
    const userName = callback.from?.first_name || 'موظف';
    const userIdStr = String(callback.from?.id);

    const { jouda } = getClients();

    const adminIds = (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') || '').split(',').map(id => id.trim()).filter(id => !id.startsWith('-'));
    const groupIds = (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') || '').split(',').map(id => id.trim()).filter(id => id.startsWith('-'));

    // ── Fetch current order status to enforce State Machine ──
    const { data: order, error: orderErr } = await jouda
      .from('customer_orders')
      .select('status')
      .eq('id', orderId)
      .single();

    if (!order || orderErr) {
      await answerCallback(token, callback.id, 'الطلب غير موجود', true);
      return;
    }

    const currentStatus = order.status;

    let statusLabel = '';
    let dbStatus = '';

    // 1. Admin Actions (Approve / Reject)
    if (action === 'approve') {
      if (!adminIds.includes(userIdStr)) {
         await answerCallback(token, callback.id, 'صلاحية الاعتماد للإدارة فقط', true);
         return;
      }
      if (currentStatus !== 'submitted') {
         await answerCallback(token, callback.id, 'عذرا، تم اتخاذ إجراء على هذا الطلب مسبقاً', true);
         return;
      }
      statusLabel = 'تم الاعتماد';
       dbStatus = 'confirmed';
       await jouda.from('customer_orders').update({ status: dbStatus }).eq('id', orderId);

        const originalText = callback.message?.text || '';
        const forwardedText = originalText.includes('طلب من تطبيق جودة') ? originalText : 'طلب من تطبيق جودة\n\n' + originalText;
        const newText = originalText + `\n\n<b>تم الاعتماد والارسال للمجموعة</b> بواسطة: <i>${userName}</i>`;
       await editMessage(token, chatId, messageId, newText, { reply_markup: undefined });

        const teamKeyboard = [
          [{ text: 'حجز الطلب', callback_data: `wf_reserve_${orderId}` }],
          [{ text: 'تجهيز الطلب', callback_data: `wf_prepare_${orderId}` }],
          [{ text: 'تم التوصيل', callback_data: `wf_deliver_${orderId}` }],
          [{ text: 'تم استلام المبلغ', callback_data: `wf_paid_${orderId}` }],
          [{ text: 'تم الايداع (للمدير)', callback_data: `wf_deposit_${orderId}` }],
          [{ text: 'الغاء الطلب', callback_data: `wf_cancel_${orderId}` }]
        ];

       for (const gId of groupIds) {
          await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: gId,
              text: forwardedText,
              parse_mode: 'HTML',
              reply_markup: { inline_keyboard: teamKeyboard },
            }),
          });
       }

        await answerCallback(token, callback.id, `تم الارسال للمجموعة`, false);
       return;
    }
    
    if (action === 'reject') {
      if (!adminIds.includes(userIdStr)) {
         await answerCallback(token, callback.id, 'صلاحية الرفض للإدارة فقط', true);
         return;
      }
      if (currentStatus !== 'submitted') {
         await answerCallback(token, callback.id, 'عذرا، الطلب لم يعد قيد الانتظار', true);
         return;
      }
      statusLabel = 'تم الالغاء والرفض';
       dbStatus = 'cancelled';
       await jouda.from('customer_orders').update({ status: dbStatus }).eq('id', orderId);

       const originalText = callback.message?.text || '';
       const newText = originalText + `\n\n<b>تم رفض الطلب والغاؤه</b> بواسطة: <i>${userName}</i>`;
       await editMessage(token, chatId, messageId, newText, { reply_markup: undefined });

      await answerCallback(token, callback.id, `تم رفض الطلب`);
      return;
    }

    // 2. Deposit Protection Check
    if (action === 'deposit') {
      if (!adminIds.includes(userIdStr)) {
         await answerCallback(token, callback.id, 'عذرا، هذه الصلاحية لمدير النظام فقط', true);
         return;
      }
      if (currentStatus !== 'paid') {
         await answerCallback(token, callback.id, 'يجب استلام المبلغ من العميل اولا قبل الايداع', true);
         return;
      }
      statusLabel = 'تم الايداع';
       dbStatus = 'deposited';
    }

    // 3. Team Actions
    if (action === 'reserve') { 
       if (currentStatus !== 'confirmed') {
          await answerCallback(token, callback.id, 'لقد سبقك زميلك بحجز الطلب او لم يتم اعتماده بعد', true);
          return;
       }
       statusLabel = 'حجز الطلب'; dbStatus = 'reserved'; 
    }
    else if (action === 'prepare') { 
       if (currentStatus !== 'reserved') {
          await answerCallback(token, callback.id, 'يجب حجز الطلب اولا قبل تجهيزه', true);
          return;
       }
       statusLabel = 'تم التجهيز والتصوير'; dbStatus = 'preparing'; 
    }
    else if (action === 'deliver') { 
       if (currentStatus !== 'preparing') {
          await answerCallback(token, callback.id, 'يجب الانتهاء من التجهيز قبل التوصيل', true);
          return;
       }
       statusLabel = 'تم التوصيل'; dbStatus = 'delivered'; 
    }
    else if (action === 'paid') { 
       if (currentStatus !== 'delivered') {
          await answerCallback(token, callback.id, 'لا يمكن تسجيل الاستلام قبل تأكيد التوصيل', true);
          return;
       }
       statusLabel = 'تم استلام المبلغ'; dbStatus = 'paid'; 
    }
    else if (action === 'cancel') { 
       if (['delivered', 'paid', 'deposited', 'cancelled'].includes(currentStatus)) {
          await answerCallback(token, callback.id, 'لا يمكن الغاء الطلب في هذه المرحلة', true);
          return;
       }
       statusLabel = 'تم الالغاء'; dbStatus = 'cancelled'; 
    }

    // Update order status in DB
    if (dbStatus && dbStatus !== currentStatus) {
       await jouda.from('customer_orders').update({ status: dbStatus }).eq('id', orderId);
    }

    await answerCallback(token, callback.id, `تم تسجيل: ${statusLabel}`);

    if (messageId) {
       const originalText = callback.message?.text || '';
       const ts = fmtDate();
       
       // Append the action with the employee name
       const newText = originalText + `\n\n<b>${statusLabel}</b> — <i>${userName}</i> (${ts})`;
       
       // Remove the clicked button from the keyboard
       const oldKeyboard = callback.message?.reply_markup?.inline_keyboard || [];
       const newKeyboard = oldKeyboard.filter((row: any[]) => row[0].callback_data !== data);

       await editMessage(token, chatId, messageId, newText, { 
           reply_markup: { inline_keyboard: newKeyboard.length > 0 ? newKeyboard : undefined } 
       });
    }
    return;
  }

  // ── Inventory Invoice Workflow (inv_*) ──
  if (data.startsWith('inv_')) {
    const parts = data.split('_');
    const action = parts[1];
    const invoiceId = parts[2];
    const userName = callback.from?.first_name || 'Staff';
    const userIdStr = String(callback.from?.id);
    const { inventory, jouda } = getClients();
    const adminIds = (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') || '').split(',').map(id => id.trim()).filter(id => !id.startsWith('-'));

    if (['deposit', 'reverse'].includes(action) && !adminIds.includes(userIdStr)) {
      await answerCallback(token, callback.id, 'المدير فقط', true); return;
    }

    const { data: invoice } = await inventory.from('invoices').select('workflow_status, is_voided, status').eq('id', invoiceId).single();
    if (!invoice || invoice.is_voided) { await answerCallback(token, callback.id, 'الفاتورة غير موجودة', true); return; }
    if (invoice.status !== 'POSTED') { await answerCallback(token, callback.id, 'الفاتورة غير مرحلة', true); return; }

    const currentWf = invoice.workflow_status || 'pending';
    let orderId = '';
    if (!orderId) {
      const { data: order } = await jouda.from('customer_orders').select('id').eq('quotation_id', invoiceId).single();
      if (order) orderId = order.id;
    }

    const validNext: Record<string, string[]> = {
      pending: ['reserve'], reserve: ['prepare', 'reverse'], prepare: ['deliver', 'reverse'],
      deliver: ['paid', 'reverse'], paid: ['deposit', 'reverse'], deposit: ['reverse'], cancelled: [],
    };
    const actionLabels: Record<string, string> = {
      reserve: 'تم الحجز', prepare: 'تم التجهيز', deliver: 'تم التوصيل',
      paid: 'تم استلام', deposit: 'تم الايداع', reverse: 'تم عكس',
    };
    const joudaMap: Record<string, string> = {
      reserve: 'confirmed', prepare: 'preparing', deliver: 'delivered',
      paid: 'paid', deposit: 'deposited', reverse: 'cancelled',
    };

    if (action === 'reverse') {
      const suid = Deno.env.get('SYSTEM_USER_UUID') || 'admin';
      const { error } = await inventory.rpc('reverse_invoice', { p_invoice_id: invoiceId, p_actor_user_id: suid, p_reason: 'عكس من تليجرام', p_idempotency_key: crypto.randomUUID() });
      if (error) { await answerCallback(token, callback.id, 'فشل: ' + error.message, true); return; }
    } else {
      if (!validNext[currentWf]?.includes(action)) { await answerCallback(token, callback.id, 'الخطوة غير متاحة', true); return; }
      const { error } = await inventory.from('invoices').update({ workflow_status: action, workflow_updated_by: userIdStr, workflow_updated_at: new Date().toISOString() }).eq('id', invoiceId);
      if (error) { await answerCallback(token, callback.id, 'فشل: ' + error.message, true); return; }
    }

    if (orderId && joudaMap[action]) await jouda.from('customer_orders').update({ status: joudaMap[action] }).eq('id', orderId);
    await answerCallback(token, callback.id, actionLabels[action] + ' | ' + userName);

    if (messageId) {
      const ts = fmtDate();
      const orig = callback.message?.text || '';
      let txt: string;
      if (action === 'reverse') txt = 'تم عكس الفاتورة: <code>' + invoiceId + '</code>\n' + orig + '\n\n' + 'تم العكس' + ' -- ' + userName + ' (' + ts + ')';
      else txt = orig + '\n\n' + actionLabels[action] + ' -- ' + userName + ' (' + ts + ')';
      const oldKb = callback.message?.reply_markup?.inline_keyboard || [];
      const newKb = action === 'reverse' ? [] : oldKb.filter((row: any[]) => {
        return !row.some((btn: any) => btn?.callback_data === data);
      });
      await editMessage(token, chatId, messageId, txt, { reply_markup: action === 'reverse' ? undefined : { inline_keyboard: newKb.length > 0 ? newKb : undefined } });
    }
    return;
  }

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
    await answerCallback(token, callback.id, 'الطلب غير موجود');
    return;
  }

  // Validate transition
  const allowed = VALID_TRANSITIONS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    await answerCallback(token, callback.id, `لا يمكن الانتقال من ${STATUS_LABEL[order.status]} إلى ${STATUS_LABEL[newStatus]}`);
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
      await answerCallback(token, callback.id, `فشل خصم المخزون: ${rpcErr.message}`);
      return;
    }

    const result = rpcResult as any;
    if (result && result.success === false) {
      await answerCallback(token, callback.id, `${result.error || 'فشل تحويل التسعيرة'}`);
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
    await answerCallback(token, callback.id, `فشل التحديث: ${updateErr.message}`);
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
      confirmed: 'تم تأكيد طلبك وسيتم تجهيزه قريبا',
      preparing: 'طلبك قيد التحضير الان',
      delivered: 'تم تسليم طلبك. شكرا لتسوقك من جودة',
    };

    const waMsg = encodeURIComponent(`*جودة — تحديث طلبك*\n\n*رقم الطلب:* ${order.order_number}\n${msgs[newStatus]}\n\n*المبلغ:* ${order.total?.toLocaleString()} ر.ي\n\nشكرا لاختيارك جودة`);
    const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${waMsg}`;

    await sendMessage(token, chatId, `<a href="${waUrl}">ارسال اشعار للعميل عبر واتساب</a>`, { disable_web_page_preview: true });
  }
}

export { handleCallback };
