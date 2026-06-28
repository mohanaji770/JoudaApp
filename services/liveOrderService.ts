import { getSupabaseClient } from './supabaseClient';

export interface LiveOrder {
  id: string;
  order_number: string;
  quotation_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  order_type: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  notes: string | null;
  status: string;
  created_at: string;
  order_items?: { id: string }[];
}

export interface LiveOrderItem {
  id: string;
  order_id: string;
  product_barcode: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

/**
 * Fetch orders from Supabase by customer phone number.
 */
export const fetchLiveOrders = async (phone: string): Promise<LiveOrder[]> => {
  // Normalize phone: remove spaces, dashes
  const cleanPhone = phone.replace(/[\s\-]/g, '');
  const client = getSupabaseClient(cleanPhone);

  const { data, error } = await client
    .from('customer_orders')
    .select('*, order_items(id)')
    .eq('customer_phone', cleanPhone)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('fetchLiveOrders error:', error);
    return [];
  }
  return (data || []) as LiveOrder[];
};

/**
 * Fetch items for a specific order.
 */
export const fetchLiveOrderItems = async (orderId: string, phone: string): Promise<LiveOrderItem[]> => {
  const cleanPhone = phone.replace(/[\s\-]/g, '');
  const client = getSupabaseClient(cleanPhone);
  const { data, error } = await client
    .from('order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('id', { ascending: true });

  if (error) {
    console.error('fetchLiveOrderItems error:', error);
    return [];
  }
  return (data || []) as LiveOrderItem[];
};

/**
 * Fetch items for a batch of order IDs.
 */
export const fetchLiveOrdersItemsBatch = async (orderIds: string[], phone: string): Promise<LiveOrderItem[]> => {
  const cleanPhone = phone.replace(/[\s\-]/g, '');
  const client = getSupabaseClient(cleanPhone);
  const { data, error } = await client
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  if (error) {
    console.error('fetchLiveOrdersItemsBatch error:', error);
    return [];
  }
  return (data || []) as LiveOrderItem[];
};
