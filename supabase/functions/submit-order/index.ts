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
  items: Array<{
    product_name: string;
    quantity: number;
    is_package?: boolean;
    sub_items?: Array<{ product_name: string; quantity: number }>;
  }>;
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
    .map((item) => {
      if (item.is_package && item.sub_items && item.sub_items.length > 0) {
        const subList = item.sub_items
          .map((sub) => `      ▫️ 🛒 ${sub.product_name} × ${sub.quantity * item.quantity}`)
          .join('\n');
        return `• 📦 <b>${item.product_name}</b> × ${item.quantity}\n${subList}`;
      } else {
        return `• 🛒 ${item.product_name} × ${item.quantity}`;
      }
    })
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

  const notesLine = orderData.notes ? `\n📝 <b>ملاحظات:</b> <code>${orderData.notes}</code>\n` : '';
  const message = `
📥 <b>طلب جديد من التطبيق 📱</b>
━━━━━━━━━━━━━━━━━━━
🆔 <b>رقم الطلب:</b> <code>#${orderNumber}</code>
👤 <b>العميل:</b> <b>${customerName}</b>
📱 <b>الهاتف:</b> <code>${customerPhone}</code>
📍 <b>العنوان:</b> <code>${customerAddress || 'غير محدد'}</code>
━━━━━━━━━━━━━━━━━━━
📦 <b>الأصناف المطلوبة:</b>
${itemsList}
${notesLine}━━━━━━━━━━━━━━━━━━━
💰 <b>إجمالي الطلب:</b> <b>${total.toLocaleString()}</b> ر.ي
━━━━━━━━━━━━━━━━━━━
⏱️ <b>التوقيت:</b> <code>${dateStr}</code>
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

    // 1. Initialize JoudaApp Client FIRST
    const joudaClient = createClient(joudaUrl, joudaServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. Connect to Inventory
    const inventoryClient = createClient(inventoryUrl, inventoryKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Handle Packages: decompose packages into their base products and calculate package discount
    const itemBarcodes = items.map((i: any) => i.product_barcode);
    const { data: packageMappings } = await joudaClient
      .from('package_items')
      .select('package_barcode, product_barcode, quantity')
      .in('package_barcode', itemBarcodes);

    let packageDiscount = 0;
    const rpcItems: any[] = [];
    let lineNo = 1;

    let baseProducts: any[] = [];
    if (packageMappings && packageMappings.length > 0) {
      const baseBarcodes = packageMappings.map((m: any) => m.product_barcode);
      const { data } = await joudaClient
        .from('products')
        .select('barcode, name, price')
        .in('barcode', baseBarcodes);
      if (data) baseProducts = data;
    }

    // 3. Resolve track_expiry setting from inventory database for all items
    const allBarcodesToQuery = [
      ...items.filter((i: any) => !String(i.product_barcode).startsWith('PKG-')).map((i: any) => i.product_barcode),
      ...(packageMappings || []).map((m: any) => m.product_barcode)
    ];

    let invProducts: any[] = [];
    if (allBarcodesToQuery.length > 0) {
      const { data: fetchedInvProducts, error: invProdError } = await inventoryClient
        .from('products')
        .select('barcode, track_expiry')
        .in('barcode', allBarcodesToQuery)
        .eq('is_active', true);
      if (invProdError) {
        console.error('Error fetching track_expiry from inventory database:', invProdError);
      }
      if (fetchedInvProducts) invProducts = fetchedInvProducts;
    }

    // 4. Retrieve active expiry batches from the materialized view
    const barcodesWithExpiry = invProducts
      .filter((p: any) => p.track_expiry === true)
      .map((p: any) => p.barcode);

    let activeBatches: any[] = [];
    if (barcodesWithExpiry.length > 0) {
      const { data: fetchedBatches, error: batchErr } = await inventoryClient
        .from('active_expiry_batches')
        .select('product_barcode, expiry_date, remaining_qty')
        .in('product_barcode', barcodesWithExpiry)
        .eq('warehouse_id', onlineWarehouseId)
        .gt('remaining_qty', 0)
        .order('expiry_date', { ascending: true });
      if (batchErr) {
        console.error('Error fetching active expiry batches:', batchErr);
      }
      if (fetchedBatches) activeBatches = fetchedBatches;
    }

    // Helper function to resolve expiry_date
    const resolveExpiryDate = async (barcode: string): Promise<string | null> => {
      const isExpiryTracked = invProducts.find((p: any) => p.barcode === barcode)?.track_expiry === true;
      if (!isExpiryTracked) return null;

      // Try active batches in the online warehouse
      const matchedBatches = activeBatches.filter(
        (b: any) => b.product_barcode === barcode && Number(b.remaining_qty) > 0
      );
      if (matchedBatches.length > 0) {
        return matchedBatches[0].expiry_date;
      }

      // Try historical incoming movements
      try {
        const { data: hist, error: histError } = await inventoryClient
          .from('inventory_movements')
          .select('expiry_date')
          .eq('product_barcode', barcode)
          .eq('action_type', 'IN')
          .not('expiry_date', 'is', null)
          .order('expiry_date', { ascending: false })
          .limit(1);

        if (!histError && hist && hist.length > 0) {
          return hist[0].expiry_date;
        }
      } catch (e) {
        console.error(`Historical expiry lookup failed for ${barcode}:`, e);
      }

      // Fallback: 6 months in the future
      const fallback = new Date();
      fallback.setMonth(fallback.getMonth() + 6);
      return fallback.toISOString().split('T')[0];
    };

    for (const item of items) {
      const isPackage = String(item.product_barcode).startsWith('PKG-');
      const pkgItems = packageMappings ? packageMappings.filter((m: any) => m.package_barcode === item.product_barcode) : [];
      
      if (isPackage) {
        if (pkgItems.length === 0) {
          return jsonResponse({ 
            success: false, 
            message: `عذراً، العرض/البكج (${item.product_name || item.product_barcode}) غير مكتمل (لا يحتوي على منتجات محددة). يرجى إبلاغ الإدارة.`
          }, 400);
        }

        let totalBasePrice = 0;
        for (const pItem of pkgItems) {
          const baseProd = baseProducts.find((bp: any) => bp.barcode === pItem.product_barcode);
          const basePrice = baseProd ? Number(baseProd.price) : 0;
          totalBasePrice += (basePrice * pItem.quantity);
          
          const expiryDate = await resolveExpiryDate(pItem.product_barcode);
          
          rpcItems.push({
            line_no: lineNo++,
            product_barcode: pItem.product_barcode,
            warehouse_id: onlineWarehouseId,
            quantity: pItem.quantity * item.quantity,
            unit_price: basePrice,
            expiry_date: expiryDate,
          });
        }
        
        // Discount = (Sum of base prices) - (Package price), all multiplied by how many packages bought
        const expectedBaseTotal = totalBasePrice * item.quantity;
        const actualPackageTotal = Number(item.unit_price) * item.quantity;
        packageDiscount += (expectedBaseTotal - actualPackageTotal);
      } else {
        // Normal product
        const expiryDate = await resolveExpiryDate(item.product_barcode);

        rpcItems.push({
          line_no: lineNo++,
          product_barcode: item.product_barcode,
          warehouse_id: onlineWarehouseId,
          quantity: item.quantity,
          unit_price: item.unit_price,
          expiry_date: expiryDate,
        });
      }
    }

    const total = subtotal + delivery_fee;

    // JoudaApp Client already initialized above

    let orderNumber = 'J-0000';
    try {
      const { data: orderNumberResult, error: seqError } = await joudaClient
        .rpc('generate_order_number');
      
      if (seqError) {
        console.error('Sequence Error:', seqError);
      }
      
      orderNumber = orderNumberResult || 'J-0000';
    } catch (e) {
      console.error('generate_order_number failed:', e);
    }

    // Embed order_number and notes in the address so the POS cashier sees them
    let combinedNotes = `رقم طلب التطبيق: ${orderNumber}`;
    if (notes) {
      combinedNotes += `\nملاحظات العميل: ${notes}`;
    }
    const finalAddress = customer_address 
      ? `${customer_address}\n\n[ ${combinedNotes} ]`
      : `[ ${combinedNotes} ]`;

    const { data: rpcResult, error: rpcError } = await inventoryClient.rpc('create_quotation', {
      p_idempotency_key: idempotencyKey,
      p_invoice_id: invoiceId,
      p_customer_id: null,
      p_customer_name_snapshot: customer_name,
      p_customer_phone_snapshot: customer_phone || null,
      p_customer_address_snapshot: finalAddress,
      p_issuing_warehouse_id: onlineWarehouseId,
      p_payment_method: payment_method || 'CASH',
      p_wallet_provider: null,
      p_subtotal: subtotal + packageDiscount,
      p_discount: packageDiscount,
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

    // 3. Store in JoudaApp local database
    let orderRecord: any = null;

    try {
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
        items: items.map((item: any) => {
          const isPackage = String(item.product_barcode).startsWith('PKG-');
          let subItems: Array<{ product_name: string; quantity: number }> = [];
          if (isPackage) {
            const pkgItems = packageMappings ? packageMappings.filter((m: any) => m.package_barcode === item.product_barcode) : [];
            subItems = pkgItems.map((pItem: any) => {
              const baseProd = baseProducts.find((bp: any) => bp.barcode === pItem.product_barcode);
              return {
                product_name: baseProd ? baseProd.name : pItem.product_barcode,
                quantity: pItem.quantity,
              };
            });
          }
          return {
            product_name: item.product_name,
            quantity: item.quantity,
            is_package: isPackage,
            sub_items: isPackage ? subItems : undefined,
          };
        }),
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
