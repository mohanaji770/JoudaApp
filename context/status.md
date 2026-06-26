# Project Status

## Current State

Jouda is a React/Vite customer app with Supabase Edge Functions and a Capacitor Android wrapper. JoudaApp stores the customer-facing product/content data, while JoudaStockManager Inventory remains the source of truth for stock, quotations, invoices, and collector workflows.

`AGENTS.md` was refreshed on 2026-06-26 to match the current code structure and should be read before code changes.

## Active Work

- [ ] Audit Inventory security and RLS.
- [ ] Review old `admin_pin` migrations and decide whether to remove, supersede, or document as legacy only.
- [ ] Prepare first Android release for Google Play.

## Recent Changes

| Date | Change | Impact |
|---|---|---|
| 2026-06-26 | `AGENTS.md` rewritten as concise system reference | Agents have a cleaner entry point with fewer stale claims |
| 2026-06-26 | `context-network` bootstrapped | Project now has persistent context files for status, decisions, domains, processes, and security |
| 2026-06-26 | Admin/live schema caveats added to docs | Agents are warned that migrations may not fully represent live RLS/schema |
| 2026-06-26 | `products.stock_quantity` and `is_stock_tracked` documented as display/sync fields | Prevents treating JoudaApp stock as source of truth |
| 2026-06-26 | `update-inventory` documented as admin JWT-gated bridge to Inventory | Clarifies how "always available" changes propagate |
| 2026-06-27 | Folder structure guidelines added | New frontend files now have documented placement rules before larger refactors |
| 2026-06-27 | Cart root components moved under `components/cart/` | First small structure refactor completed and verified with `npm run build` |
| 2026-06-27 | `MapLocationPicker` moved under `components/cart/` | `components/` root is now free of standalone cart/checkout components |
| 2026-06-27 | `useCheckout` moved under `components/cart/hooks/` | Checkout state and submission logic now lives with the cart feature and builds successfully |

## Known Risks

- Migrations contain legacy `admin_pin` RPCs, while current admin UI uses Supabase Auth. Treat PIN-based admin flows as legacy until audited.
- RLS/live database state may differ from checked-in migrations. Verify live Supabase state before sensitive database changes.
- `ALLOWED_ORIGIN` controls CORS strictness; if missing, Edge Functions fall back to `*`.

## Next Steps

1. Use this context network before starting cross-domain work.
2. Keep `context/status.md` current at the start/end of substantial sessions.
3. After major changes, update both `AGENTS.md` and the affected context node.

---

Last updated: 2026-06-27 by Codex.
