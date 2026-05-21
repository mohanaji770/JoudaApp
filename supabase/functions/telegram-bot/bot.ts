const TOKEN = () => Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const API = (method: string) => `https://api.telegram.org/bot${TOKEN()}/${method}`;

async function tg(method: string, body: Record<string, unknown>) {
  const res = await fetch(API(method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description}`);
  return data;
}

export function send(chatId: string, text: string, keyboard?: unknown) {
  const body: Record<string, unknown> = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (keyboard) body.reply_markup = keyboard;
  return tg('sendMessage', body);
}

export function edit(chatId: string, msgId: number, text: string, keyboard?: unknown) {
  const body: Record<string, unknown> = { chat_id: chatId, message_id: msgId, text, parse_mode: 'HTML' };
  if (keyboard) body.reply_markup = keyboard;
  return tg('editMessageText', body);
}

export function answer(callbackId: string, text?: string, alert = false) {
  return tg('answerCallbackQuery', { callback_query_id: callbackId, text: text || '', show_alert: alert });
}

export function sendMenu(chatId: string, text: string) {
  const keyboard = {
    keyboard: [
      [{ text: 'Orders' }, { text: 'Today Sales' }],
      [{ text: 'Search Product' }, { text: 'Profit' }],
      [{ text: 'Wallet' }, { text: 'Expiry' }],
      [{ text: 'Low Stock' }, { text: 'Status' }],
    ],
    resize_keyboard: true,
  };
  return send(chatId, text, keyboard);
}
