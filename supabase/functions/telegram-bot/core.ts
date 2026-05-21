import { createClient } from 'jsr:@supabase/supabase-js@2';

const sc = (url: string, key: string) => createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
let _j: ReturnType<typeof sc> | null = null;
let _i: ReturnType<typeof sc> | null = null;
export function jouda() { if (!_j) _j = sc(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!); return _j; }
export function inventory() { if (!_i) _i = sc(Deno.env.get('INVENTORY_SUPABASE_URL')!, Deno.env.get('INVENTORY_SERVICE_ROLE_KEY')!); return _i; }

// ─── Telegram helpers ──────────────────────────────────

const TK = () => Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const API = (m: string) => `https://api.telegram.org/bot${TK()}/${m}`;

async function tg(method: string, body: Record<string, unknown>) {
  const r = await fetch(API(method), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json();
  if (!d.ok) throw new Error(`TG ${method}: ${d.description}`);
  return d;
}

export function send(chatId: string, text: string, kb?: unknown) {
  const b: Record<string, unknown> = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (kb) b.reply_markup = kb;
  return tg('sendMessage', b);
}

export function edit(chatId: string, msgId: number, text: string, kb?: unknown) {
  const b: Record<string, unknown> = { chat_id: chatId, message_id: msgId, text, parse_mode: 'HTML' };
  if (kb) b.reply_markup = kb;
  return tg('editMessageText', b);
}

export function answer(cbId: string, text?: string, alert = false) {
  return tg('answerCallbackQuery', { callback_query_id: cbId, text: text || '', show_alert: alert });
}

export function sendMenu(chatId: string, text: string) {
  const kb = { keyboard: [[{ text: 'Orders' }, { text: 'Today Sales' }], [{ text: 'Search Product' }, { text: 'Profit' }], [{ text: 'Wallet' }, { text: 'Expiry' }], [{ text: 'Low Stock' }, { text: 'Status' }]], resize_keyboard: true };
  return send(chatId, text, kb);
}

export function fmtDate(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

export function wfLine(action: string, actor: string) {
  return `>> ${action} — ${actor} (${new Date().toISOString().slice(11, 19)})`;
}

export const HELP = '/orders /order [n] /stock [b] /lowstock /today /profit /wallet [n] /expiry [d] /search [q] /expense [amt] [note] /briefing /maintenance on|off /status';
