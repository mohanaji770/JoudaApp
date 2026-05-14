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
    const inventoryUrl = Deno.env.get('INVENTORY_SUPABASE_URL');
    const inventoryKey = Deno.env.get('INVENTORY_SERVICE_ROLE_KEY');
    const joudaUrl = Deno.env.get('SUPABASE_URL');
    const joudaAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const onlineWarehouseId = Deno.env.get('ONLINE_WAREHOUSE_ID');
    const systemUserUuid = Deno.env.get('SYSTEM_USER_UUID');

    if (!inventoryUrl || !inventoryKey) {
      throw new Error('Missing INVENTORY_SUPABASE_URL or INVENTORY_SERVICE_ROLE_KEY');
    }
    if (!joudaUrl || !joudaAnonKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    }
    if (!onlineWarehouseId || !systemUserUuid) {
      throw new Error('Missing ONLINE_WAREHOUSE_ID or SYSTEM_USER_UUID');
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

    // Store in JoudaApp
    const joudaClient = createClient(joudaUrl, joudaAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: orderRecord, error: insertError } = await joudaClient
      .from('customer_orders')
      .insert({
        quotation_id: quotationId,
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
      console.error('Insert order error:', insertError);
    }

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
      }
    }

    return jsonResponse({
      success: rpcSuccess,
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
