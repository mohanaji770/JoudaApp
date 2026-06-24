// ═══════════════════════════════════════════════════════
// confirmations.ts — Handle Confirmation / Abort buttons
// ═══════════════════════════════════════════════════════

import { answerCallback, editMessage } from './telegram.ts';
import { ActionDef } from './workflow.ts';

export interface ParsedAction {
  action: string;
  id: string;
  isConfirmed: boolean;
  isAbort: boolean;
  isUndo: boolean;
}

export function parseCallbackData(data: string, idPartsIndex: number = 2): ParsedAction {
  const parts = data.split('_');
  let rawAction = parts[1] || '';
  
  let id = parts.slice(idPartsIndex).join('_');
  if (rawAction === 'undo') {
    id = parts.slice(idPartsIndex + 1).join('_');
  }

  const isConfirmed = rawAction.startsWith('confirm-');
  const isAbort = rawAction.startsWith('abort-');
  const isUndo = rawAction === 'undo';

  let action = rawAction;
  if (isConfirmed) action = action.replace('confirm-', '');
  if (isAbort) action = action.replace('abort-', '');

  return { action, id, isConfirmed, isAbort, isUndo };
}

export async function handleAbort(
  token: string,
  chatId: string,
  callbackId: string,
  messageId: number | undefined,
  originalText: string,
  restoredButtons: { text: string; callback_data: string }[][]
) {
  if (messageId) {
    const cleanedText = originalText.split('\n\n⚠️ تأكيد:')[0];
    await editMessage(token, chatId, messageId, cleanedText, {
      reply_markup: restoredButtons.length > 0 ? { inline_keyboard: restoredButtons } : undefined,
    });
  }
  await answerCallback(token, callbackId, 'تم التراجع');
}

export async function requireConfirmation(
  token: string,
  chatId: string,
  callbackId: string,
  messageId: number | undefined,
  originalText: string,
  action: string,
  id: string,
  actionDef: ActionDef,
  prefix: 'wf' | 'inv'
) {
  if (messageId) {
    const confirmText = `${originalText}\n\n⚠️ تأكيد: <b>${actionDef.confirmMessage || 'هل أنت متأكد؟'}</b>`;
    const confirmButtons = [
      [{ text: '✅ نعم، متأكد', callback_data: `${prefix}_confirm-${action}_${id}` }],
      [{ text: '❌ لا، تراجع', callback_data: `${prefix}_abort-${action}_${id}` }]
    ];

    await editMessage(token, chatId, messageId, confirmText, {
      reply_markup: { inline_keyboard: confirmButtons },
    });
  }
  await answerCallback(token, callbackId);
}
