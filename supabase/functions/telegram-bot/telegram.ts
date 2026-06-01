// ═══════════════════════════════════════════════════════
// telegram.ts — Telegram Bot API helpers
// ═══════════════════════════════════════════════════════

const API = (token: string) => `https://api.telegram.org/bot${token}`;

/** Send a new message */
export async function sendMessage(
  token: string,
  chatId: string,
  text: string,
  options: Record<string, unknown> = {},
) {
  const body = { chat_id: chatId, text, parse_mode: 'HTML', ...options };
  const res = await fetch(`${API(token)}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Edit an existing message text (and optionally keyboard) */
export async function editMessage(
  token: string,
  chatId: string,
  messageId: number,
  text: string,
  options: Record<string, unknown> = {},
) {
  const body = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    ...options,
  };
  const res = await fetch(`${API(token)}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

/** Answer a callback query (button press acknowledgment) */
export async function answerCallback(
  token: string,
  callbackId: string,
  text = '',
  showAlert = false,
) {
  await fetch(`${API(token)}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callback_query_id: callbackId,
      text,
      show_alert: showAlert,
    }),
  });
}
