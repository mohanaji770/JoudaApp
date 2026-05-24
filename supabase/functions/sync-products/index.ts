import { createClient } from 'jsr:@supabase/supabase-js@2';

// Edge Function: sync-products
// Runs every 10 minutes via Cron Job
// Reads products from Inventory Project and upserts into JoudaApp

interface InventoryProduct {
  barcode: string;
  name: string;
  price: number;
  category: string | null;
  image_url: string | null;
  is_active: boolean;
  unit: string;
  min_stock: number;
}

interface StockSummary {
  product_barcode: string;
  current_stock: number | null;
}

Deno.serve(async (req: Request) => {
  try {
    const secret = Deno.env.get('WEBHOOK_SECRET');
    if (secret) {
      const webhookProvided = req.headers.get('x-webhook-secret') || '';
      const authProvided = req.headers.get('authorization') || '';
      // Allow: webhook secret matches OR request has Authorization header (Dashboard test)
      if (webhookProvided !== secret && !authProvided) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
    }

    const inventoryUrl = Deno.env.get('INVENTORY_SUPABASE_URL');
    const inventoryKey = Deno.env.get('INVENTORY_SERVICE_ROLE_KEY');
    const joudaUrl = Deno.env.get('SUPABASE_URL');
    const joudaServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!inventoryUrl || !inventoryKey) {
      throw new Error('Missing INVENTORY_SUPABASE_URL or INVENTORY_SERVICE_ROLE_KEY');
    }
    if (!joudaUrl || !joudaServiceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    // 1. Connect to Inventory Project
    const inventoryClient = createClient(inventoryUrl, inventoryKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 2. Fetch products from Inventory
    const { data: inventoryProducts, error: productsError } = await inventoryClient
      .from('products')
      .select('barcode, name, price, category, image_url, is_active, unit, min_stock')
      .eq('is_active', true);

    if (productsError) throw productsError;
    if (!inventoryProducts || inventoryProducts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No products found in inventory', synced: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Fetch stock summary from Inventory View
    const { data: stockData, error: stockError } = await inventoryClient
      .from('product_stock_summary')
      .select('product_barcode, current_stock');

    if (stockError) {
      console.warn('Failed to fetch stock summary:', stockError.message);
    }

    // 4. Build stock map
    const stockMap = new Map<string, number>();
    if (stockData) {
      stockData.forEach((row: StockSummary) => {
        stockMap.set(row.product_barcode, row.current_stock ?? 0);
      });
    }

    // 5. Prepare upsert data
    const productsToUpsert = (inventoryProducts as InventoryProduct[]).map((p) => {
      const stockQty = stockMap.get(p.barcode) ?? 0;
      const isBakery = (p.category ?? '') === 'مخبوزات';
      return {
        barcode: p.barcode,
        name: p.name,
        price: p.price,
        category: p.category ?? 'عام',
        image_url: p.image_url,
        is_active: p.is_active,
        // Bakery items are always available (made-to-order), others follow stock
        stock_status: isBakery ? 'available' : (stockQty > 0 ? 'available' : 'out_of_stock'),
        unit: p.unit ?? 'piece',
        min_stock: p.min_stock ?? 0,
        last_synced: new Date().toISOString(),
      };
    });

    // 6. Connect to JoudaApp and Upsert (using service_role to bypass RLS)
    const joudaClient = createClient(joudaUrl, joudaServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: upsertError } = await joudaClient
      .from('products')
      .upsert(productsToUpsert, { onConflict: 'barcode' });

    if (upsertError) throw upsertError;

    // 7. Log sync
    await joudaClient.from('sync_logs').insert({
      sync_type: 'products',
      status: 'success',
      items_count: productsToUpsert.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Products synced successfully',
        synced: productsToUpsert.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('sync-products error:', error);
    
    // Log failure to sync_logs
    try {
      const joudaUrl = Deno.env.get('SUPABASE_URL');
      const joudaServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (joudaUrl && joudaServiceKey) {
        const logClient = createClient(joudaUrl, joudaServiceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        await logClient.from('sync_logs').insert({
          sync_type: 'products',
          status: 'error',
          items_count: 0,
          error_message: error.message || 'Unknown error',
        });
      }
    } catch (logErr) {
      console.error('Failed to log sync error:', logErr);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
