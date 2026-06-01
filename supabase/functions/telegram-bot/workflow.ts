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
    },
  },
  delivered: {
    paid: {
      nextStatus: 'paid',
      label: 'تم استلام المبلغ',
      emoji: '💰',
    },
  },
  paid: {
    deposit: {
      nextStatus: 'deposited',
      label: 'تم الإيداع',
      emoji: '🏦',
      adminOnly: true,
    },
  },
};

/** Build inline keyboard for app order based on current status */
export function appOrderButtons(
  orderId: string,
  status: string,
): InlineBtn[][] {
  const actions = APP_ACTIONS[status];
  if (!actions) return [];
  return Object.entries(actions).map(([action, def]) => [
    {
      text: `${def.emoji} ${def.label}`,
      callback_data: `wf_${action}_${orderId}`,
    },
  ]);
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
    },
  },
  paid: {
    deposit: {
      nextStatus: 'deposit',
      label: 'إيداع (مدير)',
      emoji: '🏦',
      adminOnly: true,
    },
    reverse: {
      nextStatus: 'reversed',
      label: 'عكس (مدير)',
      emoji: '🔄',
      adminOnly: true,
    },
  },
  deposit: {
    reverse: {
      nextStatus: 'reversed',
      label: 'عكس (مدير)',
      emoji: '🔄',
      adminOnly: true,
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
