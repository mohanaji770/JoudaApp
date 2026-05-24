import { answerCallback, sendMessage } from './utils.ts';
import { handleCallback } from './callbacks.ts';
import { handleNewInvoice, handleReversedInvoice } from './incoming.ts';
import {
  handleHelp,
  handleOrders,
  handleOrderDetail,
  handleStock,
  handleLowStock,
  handleToday,
  handleMorningBriefing,
  handleMaintenance,
  handleStatus,
  handleSearch,
  handleExpense,
  handleExpiry,
  handleProfit,
  handleWallet
} from './commands.ts';

// ═══════════════════════════════════════════════════════
// Jouda Telegram Bot — Smart Admin Assistant
// Webhook-based Edge Function for Telegram Bot API
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// Main Webhook Handler
// ═══════════════════════════════════════════════════════

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const adminChatId = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID');

  if (!botToken || !adminChatId) {
    return new Response(JSON.stringify({ error: 'Missing Telegram config' }), { status: 500 });
  }

  try {
    const update = await req.json();

    // ── Auth: Check Telegram secret token header for Telegram updates ──
    if (update.update_id !== undefined) {
      // Telegram update — verify X-Telegram-Bot-Api-Secret-Token if configured
      const telegramSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET');
      if (telegramSecret) {
        const providedSecret = req.headers.get('X-Telegram-Bot-Api-Secret-Token') || '';
        if (providedSecret !== telegramSecret) {
          console.warn('Invalid Telegram webhook secret');
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
      }
    } else {
      // Non-Telegram request (Cron/DB webhook) — require WEBHOOK_SECRET
      const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
      if (!webhookSecret) {
        console.error('WEBHOOK_SECRET not configured');
        return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), { status: 500 });
      }
      const provided = req.headers.get('x-webhook-secret') || req.headers.get('authorization')?.replace('Bearer ', '') || '';
      if (provided !== webhookSecret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
      }
    }

    // ── Handle Cron/Automated Triggers ──
    if (update.cron_action === 'morning_briefing') {
      const adminChatIds = (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') || '').split(',').map(id => id.trim());
      for (const chatId of adminChatIds) {
        if (chatId) await handleMorningBriefing(botToken, chatId);
      }
      return new Response('Cron executed OK');
    }

    // ── Handle Inventory DB Webhook (POS invoices) ──
    if (update.type && update.table === 'invoices' && update.record) {
      const record = update.record;
      const oldRecord = update.old_record;
      const eventType = update.type;
      if (eventType === 'INSERT' && record.status === 'POSTED') {
        await handleNewInvoice(record);
        return new Response('OK');
      }
      if (eventType === 'UPDATE' && record.is_voided && !oldRecord?.is_voided) {
        await handleReversedInvoice(record);
        return new Response('OK');
      }
      return new Response('Ignored');
    }

    // ── Handle Callback (Inline Button Press) ──
    if (update.callback_query) {
      const cb = update.callback_query;
      const cbChatId = String(cb.message?.chat?.id || cb.from?.id);
      const adminChatIds = (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') || '').split(',').map(id => id.trim());

      if (!adminChatIds.includes(cbChatId)) {
        await answerCallback(botToken, cb.id, 'غير مصرح');
        return new Response('OK');
      }

      await handleCallback(botToken, cbChatId, cb);
      return new Response('OK');
    }

    // ── Handle Text Messages / Commands ──
    const message = update.message;
    if (!message?.text) return new Response('OK');

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    // 1. Group Chat Handling (Only allow /chatid)
    if (chatId.startsWith('-')) {
       if (text === '/chatid' || text.startsWith('/chatid@')) {
         await sendMessage(botToken, chatId, `معرف هذه المجموعة (Chat ID) هو:\n<code>${chatId}</code>`);
       }
       // Ignore all other commands/messages in groups
       return new Response('OK');
    }

    // 2. Private Chat Handling (Must be Admin)
    const adminChatIds = (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') || '').split(',').map(id => id.trim());
    
    if (!adminChatIds.includes(chatId)) {
      if (text === '/chatid') {
         await sendMessage(botToken, chatId, `معرف المحادثة (Chat ID) هو:\n<code>${chatId}</code>\nأضف هذا الرقم للإعدادات.`);
      } else {
         await sendMessage(botToken, chatId, 'هذا البوت خاص بإدارة جودة فقط');
      }
      return new Response('OK');
    }

    const [rawCommand, ...args] = text.split(/\s+/);
    const arg = args.join(' ');

    // Map reply keyboard button text → slash commands
    const BUTTON_MAP: Record<string, string> = {
      'الطلبات': '/orders',
      'مبيعات اليوم': '/today',
      'بحث منتج': '/search',
      'الارباح': '/profit',
      'المحصل': '/wallet',
      'الصلاحية': '/expiry',
      'مخزون منخفض': '/lowstock',
      'حالة النظام': '/status',
    };

    const command = BUTTON_MAP[text] || rawCommand.toLowerCase().replace(/@\w+$/, '');

    switch (command) {
      case '/start':
      case '/help':
        await handleHelp(botToken, chatId);
        break;

      case '/orders':
        await handleOrders(botToken, chatId);
        break;

      case '/order':
        if (!arg) { await sendMessage(botToken, chatId, 'استخدم: /order ORD-2026-0001'); break; }
        await handleOrderDetail(botToken, chatId, arg);
        break;

      case '/stock':
        if (!arg) { await sendMessage(botToken, chatId, 'استخدم: /stock [باركود]'); break; }
        await handleStock(botToken, chatId, arg);
        break;

      case '/lowstock':
        await handleLowStock(botToken, chatId);
        break;

      case '/today':
        await handleToday(botToken, chatId);
        break;

      case '/briefing':
        await handleMorningBriefing(botToken, chatId);
        break;

      case '/maintenance':
        await handleMaintenance(botToken, chatId, arg || undefined);
        break;

      case '/status':
        await handleStatus(botToken, chatId);
        break;

      case '/search':
        if (!arg) { await sendMessage(botToken, chatId, 'استخدم: /search [اسم المنتج]'); break; }
        await handleSearch(botToken, chatId, arg);
        break;

      case '/expense':
        if (!arg) { await sendMessage(botToken, chatId, 'الصيغة: /expense [مبلغ] [وصف]\nمثال: /expense 5000 بنزين'); break; }
        await handleExpense(botToken, chatId, arg);
        break;

      case '/expiry':
        await handleExpiry(botToken, chatId, arg || undefined);
        break;

      case '/profit':
        await handleProfit(botToken, chatId, arg || undefined);
        break;

      case '/wallet':
        await handleWallet(botToken, chatId, arg || undefined);
        break;

      default:
        await sendMessage(botToken, chatId, 'أمر غير معروف. أرسل /help لعرض الأوامر المتاحة.');
    }
  } catch (err: any) {
    console.error('Telegram bot error:', err);
    // Don't expose errors to Telegram
  }

  return new Response('OK');
});