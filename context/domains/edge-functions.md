# Edge Functions Domain

## Function Map

| Function | Path | Main Responsibility |
|---|---|---|
| `telegram-bot` | `supabase/functions/telegram-bot/` | Telegram commands/callbacks and Inventory webhooks |
| `submit-order` | `supabase/functions/submit-order/index.ts` | Create Inventory quotation and JoudaApp order |
| `sync-products` | `supabase/functions/sync-products/index.ts` | Sync Inventory products to JoudaApp |
| `update-inventory` | `supabase/functions/update-inventory/index.ts` | Admin-gated updates to Inventory product fields |
| `analyze-product` | `supabase/functions/analyze-product/index.ts` | AI product analysis using Gemini |

## Authentication

- `telegram-bot`: `verify_jwt=false`; Telegram updates pass without JWT. Non-Telegram webhook/cron requests require `x-webhook-secret`.
- `submit-order`: `verify_jwt=true` in `supabase/config.toml`.
- `sync-products`: `verify_jwt=false`; checks `WEBHOOK_SECRET`.
- `update-inventory`: validates the Authorization JWT in code and allows `joudafood@gmail.com`; it is not listed in the current `supabase/config.toml`, so verify its deployment JWT setting in Supabase Dashboard before changing exposure.
- `analyze-product`: reads `GEMINI_API_KEY`; it is not listed in the current `supabase/config.toml`, so verify its deployment JWT setting in Supabase Dashboard before changing exposure.

## Telegram Bot Internal Files

`telegram-bot` is the only multi-file function:

- `index.ts`: routing and auth checks
- `commands.ts`: text commands
- `wf-callbacks.ts`: app order callbacks
- `inv-callbacks.ts`: POS invoice callbacks
- `incoming.ts`: incoming Inventory invoice webhook
- `workflow.ts`: status machines and buttons
- `confirmations.ts`: sensitive action confirmations
- `config.ts`, `db.ts`, `telegram.ts`, `format.ts`: shared helpers

## Rules

- Keep callback data under 64 characters.
- Use `fmtDate()` for Telegram dates.
- Use service role only inside server-side functions.
- When adding env vars, update `AGENTS.md` and this file.

## Related Context

- Inventory sync: `context/domains/inventory-sync.md`
- Security: `context/security/security-status.md`
