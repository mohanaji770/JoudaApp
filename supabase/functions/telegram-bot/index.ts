// ═══════════════════════════════════════════════════════
// index.ts — Jouda Telegram Bot (Clean Architecture)
// ═══════════════════════════════════════════════════════
//
// This file is a PURE ROUTER. No business logic here.
// All it does: authenticate → route → respond.
//
// Structure:
//   config.ts    → Environment & constants
//   db.ts        → Supabase clients
//   telegram.ts  → Telegram API helpers
//   format.ts    → Date/phone/message formatting
//   workflow.ts  → State machines (wf_* & inv_*)
//   commands.ts  → Text commands (/help, /orders, /status)
//   wf-callbacks → App order buttons (wf_*)
//   inv-callbacks→ POS invoice buttons (inv_*)
//   incoming.ts  → DB webhook (new/reversed invoices)

import { answerCallback, sendMessage } from './telegram.ts';
import { env, getInventoryUserId } from './config.ts';
import { handleWfCallback } from './wf-callbacks.ts';
import { handleInvCallback } from './inv-callbacks.ts';
import { handleNewInvoice, handleReversedInvoice } from './incoming.ts';
import { handleHelp, handleOrders, handleStatus, handleCash, handleMyCash } from './commands.ts';

// ─── Main Server ────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const botToken = env.botToken();
  if (!botToken) {
    return new Response(
      JSON.stringify({ error: 'Missing TELEGRAM_BOT_TOKEN' }),
      { status: 500 },
    );
  }

  try {
    const update = await req.json();

    // ═══ Authentication ═════════════════════════════════

    if (update.update_id !== undefined) {
      // Telegram update → verify X-Telegram-Bot-Api-Secret-Token
      const secret = env.telegramSecret();
      if (secret) {
        const provided =
          req.headers.get('X-Telegram-Bot-Api-Secret-Token') || '';
        if (provided !== secret) {
          console.warn('Invalid Telegram webhook secret');
          return new Response('Unauthorized', { status: 401 });
        }
      }
    } else {
      // Non-Telegram (DB webhook / Cron) → require WEBHOOK_SECRET
      const secret = env.webhookSecret();
      if (!secret) {
        return new Response('WEBHOOK_SECRET not configured', { status: 500 });
      }
      const provided =
        req.headers.get('x-webhook-secret') ||
        req.headers.get('authorization')?.replace('Bearer ', '') ||
        '';
      if (provided !== secret) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    // ═══ Route: DB Webhook (POS Invoice) ════════════════

    if (update.type && update.table === 'invoices' && update.record) {
      const { record, old_record, type } = update;
      if (type === 'INSERT' && record.status === 'POSTED') {
        await handleNewInvoice(record);
      } else if (
        type === 'UPDATE' &&
        record.is_voided &&
        !old_record?.is_voided
      ) {
        await handleReversedInvoice(record);
      }
      return new Response('OK');
    }

    // ═══ Route: Callback Query (Button Press) ═══════════

    if (update.callback_query) {
      const cb = update.callback_query;
      const cbChatId = String(cb.message?.chat?.id || cb.from?.id);
      const cbData = (cb.data as string) || '';

      // Auth: must be from admin chat or group chat
      const allowed = [...env.adminIds(), ...env.groupIds()];
      if (!allowed.includes(cbChatId)) {
        await answerCallback(botToken, cb.id, 'غير مصرح');
        return new Response('OK');
      }

      // Route by prefix
      if (cbData.startsWith('wf_')) {
        await handleWfCallback(botToken, cbChatId, cb);
      } else if (cbData.startsWith('inv_')) {
        await handleInvCallback(botToken, cbChatId, cb);
      } else {
        // Legacy order_* buttons or unknown
        await answerCallback(
          botToken,
          cb.id,
          '⚠️ هذا الزر من إصدار قديم. أعد إرسال الطلب.',
          true,
        );
      }
      return new Response('OK');
    }

    // ═══ Route: Text Message ════════════════════════════

    const message = update.message;
    if (!message?.text) return new Response('OK');

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    // Group chats: only /chatid is allowed
    if (chatId.startsWith('-')) {
      if (text === '/chatid' || text.startsWith('/chatid@')) {
        await sendMessage(
          botToken,
          chatId,
          `معرف المجموعة:\n<code>${chatId}</code>`,
        );
      }
      return new Response('OK');
    }

    // Private chats: must be admin OR a mapped driver
    if (!env.adminIds().includes(chatId) && !getInventoryUserId(chatId)) {
      if (text === '/chatid') {
        await sendMessage(
          botToken,
          chatId,
          `معرف المحادثة:\n<code>${chatId}</code>`,
        );
      } else {
        await sendMessage(botToken, chatId, 'هذا البوت خاص بإدارة فريق جوده.');
      }
      return new Response('OK');
    }

    // Parse and route command
    const command = text
      .split(/\s+/)[0]
      .toLowerCase()
      .replace(/@\w+$/, '');

    switch (command) {
      case '/start':
      case '/help':
        await handleHelp(botToken, chatId);
        break;

      case '/orders':
        await handleOrders(botToken, chatId);
        break;

      case '/status':
        await handleStatus(botToken, chatId);
        break;

      case '/cash':
        await handleCash(botToken, chatId);
        break;

      case '/mycash':
        await handleMyCash(botToken, chatId);
        break;

      default:
        await sendMessage(botToken, chatId, 'أمر غير معروف. أرسل /help');
    }
  } catch (err: any) {
    console.error('Bot error:', err?.message || err);
  }

  return new Response('OK');
});