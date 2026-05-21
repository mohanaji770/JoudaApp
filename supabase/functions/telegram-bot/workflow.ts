const ADMIN_IDS = () => (Deno.env.get('TELEGRAM_ADMIN_CHAT_ID') || '').split(',').map(s => s.trim()).filter(s => s && !s.startsWith('-'));

// ─── Labels ───────────────────────────────────────────

const LABELS: Record<string, string> = {
  approve: 'Approved', reject: 'Rejected',
  reserve: 'Reserved', prepare: 'Preparing', deliver: 'Delivered',
  paid: 'Paid', deposit: 'Deposited', reverse: 'Reversed',
};
export function labelFor(a: string) { return LABELS[a] || a; }

// ─── Workflow Definition ──────────────────────────────

type Guard = 'self' | 'admin' | null;

const WF: Record<string, { label: string; guard: Guard }[]> = {
  pending:   [{ label: 'Reserve', guard: null }],
  reserved:  [{ label: 'Prepare', guard: 'self' },  { label: 'Reverse', guard: 'admin' }],
  preparing: [{ label: 'Deliver', guard: 'self' },  { label: 'Reverse', guard: 'admin' }],
  delivered: [{ label: 'Paid', guard: 'self' },     { label: 'Reverse', guard: 'admin' }],
  paid:      [{ label: 'Deposit', guard: 'admin' }, { label: 'Reverse', guard: 'admin' }],
  deposited: [{ label: 'Reverse', guard: 'admin' }],
  cancelled: [],
};

export function stepsFor(status: string) { return WF[status] || []; }

// ─── Runtime Context ──────────────────────────────────

export interface WfResult {
  ok: boolean;
  error?: string;
  action?: string;
  nextStatus?: string;
  actorName?: string;
  lockedBy?: string;
  messageId?: number;
  chatId?: string;
  id?: string;
}

export interface DbAdapter {
  getState: (id: string) => Promise<{ status: string; lockedBy?: string } | null>;
  updateState: (id: string, status: string, lockedBy: string) => Promise<string | null>;
  onReverse: (id: string) => Promise<string | null>;
}

// ─── Engine ───────────────────────────────────────────

export async function execute(callback: any, db: DbAdapter): Promise<WfResult> {
  const parts = String(callback.data).split('_');
  const action = parts[1];
  const id = parts.slice(2).join('_');
  const actorId = String(callback.from?.id);
  const actorName = callback.from?.first_name || 'Staff';

  // 1. Get current state
  const current = await db.getState(id);
  if (!current) return { ok: false, error: 'Not found or voided' };

  // 2. Validate action
  const steps = WF[current.status];
  if (!steps) return { ok: false, error: `No actions from ${current.status}` };

  const step = steps.find(s => s.label.toLowerCase() === action);
  if (!step) return { ok: false, error: `Cannot ${action} from ${current.status}` };

  if (step.guard === 'admin' && !ADMIN_IDS().includes(actorId)) {
    return { ok: false, error: 'Manager only' };
  }
  if (step.guard === 'self' && current.lockedBy && current.lockedBy !== actorId) {
    return { ok: false, error: 'Reserved by another staff' };
  }

  // 3. Execute
  const nextStatus = action === 'reverse' ? 'cancelled' : action;
  const lockedBy = action === 'reserve' ? actorId : (current.lockedBy || actorId);

  if (action === 'reverse') {
    const err = await db.onReverse(id);
    if (err) return { ok: false, error: err };
  } else {
    const err = await db.updateState(id, nextStatus, lockedBy);
    if (err) return { ok: false, error: err };
  }

  return {
    ok: true,
    action, id, nextStatus, actorName, lockedBy,
    messageId: callback.message?.message_id,
    chatId: String(callback.message?.chat?.id),
  };
}

// ─── Build Keyboard ───────────────────────────────────

export function buildKeyboard(id: string, status: string) {
  const steps = WF[status];
  if (!steps?.length) return undefined;
  return {
    inline_keyboard: steps.map(s => [{
      text: s.label,
      callback_data: `act_${s.label.toLowerCase()}_${id}`,
    }])
  };
}
