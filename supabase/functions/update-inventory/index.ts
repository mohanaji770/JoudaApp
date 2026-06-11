import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Authenticate the Admin using their JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: No token provided' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const joudaUrl = Deno.env.get('SUPABASE_URL');
    const joudaAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!joudaUrl || !joudaAnonKey) {
      throw new Error('Missing JoudaApp Supabase environment variables');
    }

    const authClient = createClient(joudaUrl, joudaAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 3. Parse Payload
    const { barcode, category } = await req.json();
    if (!barcode || !category) {
      return new Response(JSON.stringify({ error: 'Missing barcode or category' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 4. Connect to Inventory Project and Update Category
    const invUrl = Deno.env.get('INVENTORY_SUPABASE_URL');
    const invKey = Deno.env.get('INVENTORY_SERVICE_ROLE_KEY');
    
    if (!invUrl || !invKey) {
      throw new Error('Missing Inventory Supabase environment variables');
    }

    const invClient = createClient(invUrl, invKey);
    const { error: updateError } = await invClient
      .from('products')
      .update({ category })
      .eq('barcode', barcode);

    if (updateError) throw updateError;

    // Return Success
    return new Response(
      JSON.stringify({ success: true, message: 'Category updated in inventory' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('update-inventory error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Unknown error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
