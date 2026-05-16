import { createClient } from 'jsr:@supabase/supabase-js@2';

const TELEGRAM_API = (token: string) => `https://api.telegram.org/bot${token}`;

// ─── Telegram API Helpers ───────────────────────────────

async function sendMessage(token: string, chatId: string, text: string, options: any = {}) {
  const body: any = { chat_id: chatId, text, parse_mode: 'HTML', ...options };
  const res = await fetch(`${TELEGRAM_API(token)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function editMessage(token: string, chatId: string, messageId: number, text: string, options: any = {}) {
  const body: any = { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...options };
  const res = await fetch(`${TELEGRAM_API(token)}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function answerCallback(token: string, callbackId: string, text?: string, showAlert: boolean = false) {
  await fetch(`${TELEGRAM_API(token)}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackId, text: text || '', show_alert: showAlert }),
  });
}

// ─── Reply Keyboard Menu (Persistent Buttons) ──────────

async function sendMainMenu(token: string, chatId: string, text: string) {
  const keyboard = {
    keyboard: [
      [{ text: '📦 الطلبات' }, { text: '💰 مبيعات اليوم' }],
      [{ text: '🔍 بحث منتج' }, { text: '📈 الأرباح' }],
      [{ text: '🧾 المحصّل' }, { text: '⏰ الصلاحية' }],
      [{ text: '📉 مخزون منخفض' }, { text: '⚙️ حالة النظام' }],
    ],
    resize_keyboard: true,
    input_field_placeholder: 'اختر من القائمة أو اكتب أمراً...',
  };

  const body = { chat_id: chatId, text, parse_mode: 'HTML', reply_markup: keyboard };
  await fetch(`${TELEGRAM_API(token)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── Supabase Clients ──────────────────────────────────

function getClients() {
  const joudaUrl = Deno.env.get('SUPABASE_URL')!;
  const joudaKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const invUrl = Deno.env.get('INVENTORY_SUPABASE_URL')!;
  const invKey = Deno.env.get('INVENTORY_SERVICE_ROLE_KEY')!;

  const jouda = createClient(joudaUrl, joudaKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const inventory = createClient(invUrl, invKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return { jouda, inventory };
}

// ─── Status Maps ───────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  submitted: '📨 جديد', confirmed: '✅ مؤكد', preparing: '👨‍🍳 قيد التحضير',
  delivered: '🎉 تم التسليم', cancelled: '❌ ملغي', failed: '⚠️ فشل',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['delivered', 'cancelled'],
  delivered: [], cancelled: [], failed: ['cancelled'],
};

// ─── Build Inline Keyboard for Order ────────────────────

function buildOrderButtons(orderId: string, currentStatus: string) {
  const next = VALID_TRANSITIONS[currentStatus] || [];
  if (next.length === 0) return undefined;

  const buttons = next.map(s => ({
    text: STATUS_LABEL[s] || s,
    callback_data: `order_${s}_${orderId}`,
  }));

  return { inline_keyboard: [buttons] };
}

export {
  TELEGRAM_API,
  sendMessage,
  editMessage,
  answerCallback,
  sendMainMenu,
  getClients,
  STATUS_LABEL,
  VALID_TRANSITIONS,
  buildOrderButtons
};
