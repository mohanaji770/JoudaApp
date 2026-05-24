import { createClient } from 'jsr:@supabase/supabase-js@2';

// Edge Function: submit-order
// Receives order from JoudaApp frontend
// Calls create_quotation() in Inventory Project via RPC
// Stores result in JoudaApp customer_orders

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Telegram Notification Helper — with Inline Buttons
async function sendTelegramNotification(orderData: {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  total: number;
  items: Array<{ product_name: string; quantity: number }>;
  notes?: string;
}) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatIdsStr = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID');

  if (!botToken || !chatIdsStr) {
    console.warn('Telegram notification skipped: missing TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID');
    return;
  }

  const { orderId, orderNumber, customerName, customerPhone, customerAddress, total, items } = orderData;

  const itemsList = items
    .map((item) => `• ${item.product_name} × ${item.quantity}`)
    .join('\n');

  const now = new Date();
  const y = now.getFullYear();
  const mo = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  let h = now.getHours();
  const period = h >= 12 ? 'م' : 'ص';
  h = h % 12; if (h === 0) h = 12;
  const mi = String(now.getMinutes()).padStart(2, '0');
  const dateStr = `${y}-${mo}-${d} ${h}:${mi} ${period}`;

  const notesLine = orderData.notes ? '\n📝 <b>ملاحظات:</b> ' + orderData.notes + '\n' : '';
  const message = `
🛒 <b>طلب جديد: ${orderNumber}</b>

👤 <b>العميل:</b> ${customerName}
📱 <b>الهاتف:</b> ${customerPhone}
📍 <b>العنوان:</b> ${customerAddress || 'غير محدد'}
💰 <b>المجموع:</b> ${total.toLocaleString()} ر.ي

📦 <b>الأصناف:</b>
${itemsList}
${notesLine}📅 ${dateStr}
`.trim();

  // Admin Approval Buttons (Only for Admins)
  const inline_keyboard = [
    [{ text: '✅ اعتماد الطلب (إرسال للجروب)', callback_data: `wf_approve_${orderId}` }],
    [{ text: '❌ رفض وإلغاء الطلب', callback_data: `wf_reject_${orderId}` }]
  ];

  const chatIds = chatIdsStr.split(',').map(id => id.trim()).filter(id => id);
  // Filter for private admin chats only (IDs without a minus sign)
  const adminIds = chatIds.filter(id => !id.startsWith('-'));

  for (const chatId of adminIds) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error(`Telegram notification failed for ${chatId}:`, error);
      }
    } catch (e) {
      console.error(`Telegram notification error for ${chatId}:`, e);
    }
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Check maintenance mode first (use anon key for public reads)
    const joudaUrl = Deno.env.get('SUPABASE_URL');
    const joudaAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const joudaServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (joudaUrl && joudaAnonKey) {
      const anonClient = createClient(joudaUrl, joudaAnonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      
      const { data: settings } = await anonClient
        .from('app_settings_public')
        .select('maintenance_mode, maintenance_message')
        .eq('id', 1)
        .single();
        
      if (settings?.maintenance_mode) {
        return jsonResponse({ 
          success: false, 
          message: settings.maintenance_message || 'النظام تحت الصيانة حالياً' 
        }, 503);
      }
    }

    if (!joudaUrl || !joudaServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const inventoryUrl = Deno.env.get('INVENTORY_SUPABASE_URL')!;
    const inventoryKey = Deno.env.get('INVENTORY_SERVICE_ROLE_KEY')!;
    const systemUserUuid = Deno.env.get('SYSTEM_USER_UUID')!;
    const onlineWarehouseId = Deno.env.get('ONLINE_WAREHOUSE_ID')!;

    if (!inventoryUrl || !inventoryKey || !systemUserUuid || !onlineWarehouseId) {
      return jsonResponse({ success: false, message: 'Missing server configuration' }, 500);
    }

    const body = await req.json();
    const { customer_name, customer_phone, customer_address, order_type, branch_id, payment_method, notes, items, subtotal, delivery_fee } = body;

    if (!customer_name || !customer_phone || !items || items.length === 0) {
      return jsonResponse({ success: false, message: 'Missing required fields' }, 400);
    }

    const invoiceId = crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();

    const rpcItems = items.map((item: any, index: number) => ({
      line_no: index + 1,
      product_barcode: item.product_barcode,
      warehouse_id: onlineWarehouseId,
      quantity: item.quantity,
      unit_price: item.unit_price,
      expiry_date: null,
    }));

    const total = subtotal + delivery_fee;

    // Connect to Inventory and call create_quotation
    const inventoryClient = createClient(inventoryUrl, inventoryKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: rpcResult, error: rpcError } = await inventoryClient.rpc('create_quotation', {
      p_idempotency_key: idempotencyKey,
      p_invoice_id: invoiceId,
      p_customer_id: null,
      p_customer_name_snapshot: customer_name,
      p_customer_phone_snapshot: customer_phone || null,
      p_customer_address_snapshot: customer_address || null,
      p_issuing_warehouse_id: onlineWarehouseId,
      p_payment_method: payment_method || 'CASH',
      p_wallet_provider: null,
      p_subtotal: subtotal,
      p_discount: 0,
      p_delivery_fee: delivery_fee || 0,
      p_collector_id: null,
      p_created_by: systemUserUuid,
      p_items: rpcItems,
    });

    if (rpcError) {
      console.error('RPC Error:', rpcError);
      return jsonResponse({ success: false, message: rpcError.message || 'Failed to create quotation' }, 500);
    }

    // Parse RPC result
    let quotationResult: any = rpcResult;
    if (typeof rpcResult === 'string') {
      try { quotationResult = JSON.parse(rpcResult); } catch { /* keep as string */ }
    }

    const quotationId = quotationResult?.invoice_id || invoiceId;
    const rpcSuccess = quotationResult?.success !== false;

    // Store in JoudaApp (use service_role for write access)
    const joudaClient = createClient(joudaUrl, joudaServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let orderRecord: any = null;
    let orderNumber = 'J-0000';

    try {
      // Generate order number using database function
      const { data: orderNumberResult, error: seqError } = await joudaClient
        .rpc('generate_order_number');
      
      if (seqError) {
        console.error('Sequence Error:', seqError);
      }
      
      orderNumber = orderNumberResult || 'J-0000';

      const { data: insertedOrder, error: insertError } = await joudaClient
        .from('customer_orders')
        .insert({
          quotation_id: quotationId,
          order_number: orderNumber,
          customer_name,
          customer_phone,
          customer_address: customer_address || null,
          order_type,
          branch_id: branch_id || null,
          subtotal,
          discount: 0,
          delivery_fee: delivery_fee || 0,
          total,
          payment_method: payment_method || 'CASH',
          notes: notes || null,
          status: rpcSuccess ? 'submitted' : 'failed',
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to insert order: ${insertError.message}`);
      }
      orderRecord = insertedOrder;

      // Store order items
      if (orderRecord?.id) {
        const orderItemsToInsert = items.map((item: any) => ({
          order_id: orderRecord.id,
          product_barcode: item.product_barcode,
          product_name: item.product_name || item.product_barcode,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
        }));

        const { error: itemsError } = await joudaClient
          .from('order_items')
          .insert(orderItemsToInsert);

        if (itemsError) {
          console.error('Insert order items error:', itemsError);
          // Non-critical: order exists but items failed. Don't roll back.
        }
      }
    } catch (localErr: any) {
      // Compensation: Cancel the quotation in Inventory since local save failed
      console.error('Local save failed, attempting compensation:', localErr);
      try {
        const suid = Deno.env.get('SYSTEM_USER_UUID') || 'system';
        await inventoryClient.rpc('reverse_invoice', {
          p_invoice_id: quotationId,
          p_actor_user_id: suid,
          p_reason: 'Compensation: JoudaApp insert failed',
          p_idempotency_key: crypto.randomUUID(),
        });
        console.log('Compensation successful: quotation reversed');
      } catch (compErr) {
        console.error('Compensation failed:', compErr);
      }
      return jsonResponse({ success: false, message: 'فشل حفظ الطلب محلياً. تم إلغاء الحجز.' }, 500);
    }

    // Send Telegram notification on success
    if (rpcSuccess) {
      await sendTelegramNotification({
        orderId: orderRecord?.id || '',
        orderNumber,
        customerName: customer_name,
        customerPhone: customer_phone,
        customerAddress: customer_address,
        total,
        notes: notes || undefined,
        items: items.map((item: any) => ({
          product_name: item.product_name,
          quantity: item.quantity,
        })),
      });
    }

    return jsonResponse({
      success: rpcSuccess,
      order_number: orderNumber,
      quotation_id: quotationId,
      order_id: orderRecord?.id || null,
      message: rpcSuccess
        ? 'Order submitted successfully'
        : quotationResult?.message || 'Quotation creation returned unclear result',
    });
  } catch (error: any) {
    console.error('submit-order error:', error);
    return jsonResponse({ success: false, message: error.message || 'Internal server error' }, 500);
  }
});
