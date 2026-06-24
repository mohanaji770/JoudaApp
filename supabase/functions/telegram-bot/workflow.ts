// ═══════════════════════════════════════════════════════
// workflow.ts — State machines for App Orders & POS Invoices
// ═══════════════════════════════════════════════════════

// ─── Types ──────────────────────────────────────────────

export interface ActionDef {
  /** The status value stored in the DB after this action */
  nextStatus: string;
  /** Arabic label shown in messages */
  label: string;
  /** Emoji prefix */
  emoji: string;
  /** If true, only admins can perform this action */
  adminOnly?: boolean;
  /** If true, requires user confirmation before execution */
  requiresConfirmation?: boolean;
  /** The message shown in the confirmation prompt */
  confirmMessage?: string;
}

type InlineBtn = { text: string; callback_data: string };

// ─── App Order Workflow (wf_*) ──────────────────────────
// Status values stored in: customer_orders.status
//
// Flow:
// submitted → approve → confirmed → reserve → reserved → prepare → preparing
//          → reject  → cancelled                                → deliver → delivered
//                                                                          → paid → deposited
//
// Cancel available at: confirmed, reserved, preparing

export const APP_ACTIONS: Record<string, Record<string, ActionDef>> = {
  submitted: {
    approve: {
      nextStatus: 'confirmed',
      label: 'اعتماد الطلب',
      emoji: '✅',
      adminOnly: true,
    },
    reject: {
      nextStatus: 'cancelled',
      label: 'رفض الطلب',
      emoji: '❌',
      adminOnly: true,
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من رفض هذا الطلب؟',
    },
  },
  confirmed: {
    reserve: {
      nextStatus: 'reserved',
      label: 'حجز الطلب',
      emoji: '📦',
    },
    cancel: {
      nextStatus: 'cancelled',
      label: 'إلغاء الطلب',
      emoji: '❌',
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من إلغاء هذا الطلب؟',
    },
  },
  reserved: {
    prepare: {
      nextStatus: 'preparing',
      label: 'تجهيز الطلب',
      emoji: '👨‍🍳',
    },
    cancel: {
      nextStatus: 'cancelled',
      label: 'إلغاء الطلب',
      emoji: '❌',
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من إلغاء هذا الطلب؟',
    },
  },
  preparing: {
    deliver: {
      nextStatus: 'delivered',
      label: 'تم التوصيل',
      emoji: '🚚',
    },
    cancel: {
      nextStatus: 'cancelled',
      label: 'إلغاء الطلب',
      emoji: '❌',
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من إلغاء هذا الطلب؟',
    },
  },
  delivered: {
    paid: {
      nextStatus: 'paid',
      label: 'تم استلام المبلغ',
      emoji: '💰',
    },
    reverse: {
      nextStatus: 'cancelled',
      label: 'عكس (مدير)',
      emoji: '🔄',
      adminOnly: true,
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من إلغاء هذا الطلب المُسلّم؟',
    },
  },
  paid: {
    deposit: {
      nextStatus: 'deposited',
      label: 'تم الإيداع',
      emoji: '🏦',
      adminOnly: true,
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من توريد مبلغ هذا الطلب؟',
    },
    reverse: {
      nextStatus: 'cancelled',
      label: 'عكس (مدير)',
      emoji: '🔄',
      adminOnly: true,
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من إلغاء هذا الطلب المُسدّد؟',
    },
  },
  deposited: {
    reverse: {
      nextStatus: 'cancelled',
      label: 'عكس (مدير)',
      emoji: '🔄',
      adminOnly: true,
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من عكس هذا الطلب المُورّد؟',
    },
  },
};

/** Build inline keyboard for app order based on current status */
export function appOrderButtons(
  orderId: string,
  status: string,
  latitude?: number | null,
  longitude?: number | null,
): any[][] {
  const actions = APP_ACTIONS[status];
  if (!actions) return [];
  const buttons: any[][] = Object.entries(actions).map(([action, def]) => [
    {
      text: `${def.emoji} ${def.label}`,
      callback_data: `wf_${action}_${orderId}`,
    },
  ]);
  
  if (latitude && longitude) {
    buttons.push([
      { text: '📍 موقع العميل (خرائط جوجل)', url: `https://www.google.com/maps?q=${latitude},${longitude}` }
    ]);
  }
  
  return buttons;
}

// ─── POS Invoice Workflow (inv_*) ───────────────────────
// workflow_status values stored in: invoices.workflow_status
//
// Flow:
// pending → reserve → prepare → deliver → paid → deposit
// Reverse available at every stage (admin only)

export const INV_ACTIONS: Record<string, Record<string, ActionDef>> = {
  pending: {
    reserve: {
      nextStatus: 'reserve',
      label: 'حجز',
      emoji: '📦',
    },
  },
  reserve: {
    prepare: {
      nextStatus: 'prepare',
      label: 'تجهيز',
      emoji: '👨‍🍳',
    },
    reverse: {
      nextStatus: 'reversed',
      label: 'عكس (مدير)',
      emoji: '🔄',
      adminOnly: true,
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من عكس هذه الفاتورة المحجوزة؟',
    },
  },
  prepare: {
    deliver: {
      nextStatus: 'deliver',
      label: 'توصيل',
      emoji: '🚚',
    },
    reverse: {
      nextStatus: 'reversed',
      label: 'عكس (مدير)',
      emoji: '🔄',
      adminOnly: true,
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من عكس هذه الفاتورة قيد التجهيز؟',
    },
  },
  deliver: {
    paid: {
      nextStatus: 'paid',
      label: 'استلام',
      emoji: '💰',
    },
    reverse: {
      nextStatus: 'reversed',
      label: 'عكس (مدير)',
      emoji: '🔄',
      adminOnly: true,
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من عكس هذه الفاتورة المُسلّمة؟',
    },
  },
  paid: {
    deposit: {
      nextStatus: 'deposit',
      label: 'إيداع (مدير)',
      emoji: '🏦',
      adminOnly: true,
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من توريد مبلغ هذه الفاتورة؟',
    },
    reverse: {
      nextStatus: 'reversed',
      label: 'عكس (مدير)',
      emoji: '🔄',
      adminOnly: true,
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من عكس هذه الفاتورة المُسدّدة؟',
    },
  },
  deposit: {
    reverse: {
      nextStatus: 'reversed',
      label: 'عكس (مدير)',
      emoji: '🔄',
      adminOnly: true,
      requiresConfirmation: true,
      confirmMessage: 'هل أنت متأكد من عكس هذه الفاتورة المُورّدة؟',
    },
  },
};

/** Build inline keyboard for POS invoice based on workflow status */
export function invButtons(
  invoiceId: string,
  status: string,
): InlineBtn[][] {
  const actions = INV_ACTIONS[status];
  if (!actions) return [];
  return Object.entries(actions).map(([action, def]) => [
    {
      text: `${def.emoji} ${def.label}`,
      callback_data: `inv_${action}_${invoiceId}`,
    },
  ]);
}

// ─── Status Mappings ────────────────────────────────────

/** Map JoudaApp status to Inventory workflow_status */
export const APP_TO_INV_STATUS_MAP: Record<string, string> = {
  reserved: 'reserve',
  preparing: 'prepare',
  delivered: 'deliver',
  paid: 'paid',
  deposited: 'deposit',
};

/** Map Inventory action to JoudaApp status */
export const INV_ACTION_TO_APP_STATUS_MAP: Record<string, string> = {
  reserve: 'reserved',
  prepare: 'preparing',
  deliver: 'delivered',
  paid: 'paid',
  deposit: 'deposited',
  reverse: 'cancelled',
};
