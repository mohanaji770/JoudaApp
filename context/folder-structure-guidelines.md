# Jouda Folder Structure Guidelines

Last updated: 2026-06-27

## Purpose

Keep Jouda's file organization predictable while the project moves gradually from broad layer folders to clearer feature boundaries.

This guide applies to new files first. Move existing files only when the move is small, useful, and easy to verify.

## Current Direction

Jouda currently uses a mixed structure:

- Layer folders: `components/`, `pages/`, `services/`, `hooks/`, `utils/`
- Domain folders: `components/admin/`, `components/cart/`, `supabase/functions/telegram-bot/`

Future work should prefer feature ownership for domain-specific code, while keeping shared utilities genuinely shared.

## New File Placement

### Feature code

Use `features/<feature>/` for new domain-specific frontend code.

Recommended feature names:

- `products`
- `cart`
- `checkout`
- `admin`
- `content`
- `analyzer`
- `orders`

Recommended layout:

```text
features/<feature>/
├── components/
├── hooks/
├── api/
├── lib/
└── types.ts
```

Examples:

```text
features/products/components/ProductCard.tsx
features/products/api/productsApi.ts
features/products/hooks/useProducts.ts
features/products/lib/stockDisplay.ts
features/checkout/lib/checkoutValidation.ts
```

### Shared code

Use `shared/` only for code that is not owned by one feature.

```text
shared/
├── ui/
├── hooks/
└── lib/
```

Examples:

```text
shared/hooks/useDebounce.ts
shared/ui/Button.tsx
shared/lib/formatDate.ts
```

Do not put product, checkout, admin, or analyzer logic in `shared/`.

### Integrations

Use `integrations/` for platform or external-service adapters.

```text
integrations/
├── supabase/
└── capacitor/
```

Examples:

```text
integrations/supabase/client.ts
integrations/capacitor/camera.ts
```

### Existing folders during transition

Until older files are migrated:

- Reusable UI primitives may stay in `components/ui/`.
- Generic hooks may stay in `hooks/`.
- Admin UI may stay in `components/admin/`.
- Cart UI may stay in `components/cart/`.
- Edge Functions stay in `supabase/functions/`.
- Android native files stay in `android/`.

Avoid adding new domain-specific files to global `hooks/`, `utils/`, or `services/` unless there is a clear transition reason.

## Naming Conventions

- React components and pages: `PascalCase.tsx`
- Hooks: `useSomething.ts`
- Feature folders: lowercase plural where practical, such as `products` and `orders`
- API modules: `productsApi.ts`, `ordersApi.ts`, or an existing local service pattern
- Domain helpers: specific names like `stockDisplay.ts`, `checkoutValidation.ts`, not generic `utils.ts`
- Route wrappers: suffix with `Route.tsx` if they only connect routing to a page

## Refactor Rules

- Do not mix structural refactor with behavior changes.
- Move one small group at a time.
- Update imports in the same change.
- Use temporary re-exports when they reduce import churn.
- Run `npm run build` after each meaningful structural move.
- For Android-facing UI changes, run `npx cap sync android` after a successful build.

## Refactor Priorities

1. Move root cart components into cart ownership.
2. Split `services/supabaseService.ts` by domain, keeping compatibility exports during the transition.
3. Move domain hooks from global `hooks/` into their owning features.
4. Move modal components from `components/modals/` to their owning features.
5. Reduce `App.tsx` by extracting app routes, providers, and system hooks.

## Agent Rule

Before adding a new frontend file, decide whether it belongs to a feature, shared code, or an integration. If unsure, keep the change small and document the reason in the task summary.
