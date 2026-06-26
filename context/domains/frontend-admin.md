# Frontend and Admin Domain

## Purpose

The frontend is the customer app and admin dashboard. It reads public data from JoudaApp and uses Supabase Auth for admin access.

## Key Files

| File | Role |
|---|---|
| `services/supabaseClient.ts` | Supabase browser client and phone-header client helper |
| `services/supabaseService.ts` | Public app data access and order submission |
| `pages/AdminLogin.tsx` | Supabase Auth email/password login |
| `services/admin/` | Admin writes for products, content, settings |
| `components/admin/` | Admin UI components |

## Current Facts

- Admin login uses `supabase.auth.signInWithPassword`.
- Frontend env vars are `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Admin product changes can update JoudaApp directly, and Inventory-owned fields through `update-inventory`.
- Content managers write recipes, articles, banners, FAQ, and uploaded images.
- Image uploads use the `public-assets` storage bucket.
- Package and category features use `package_items` and `app_categories`.

## Product/Admin Fields

These fields are used by the current app/admin code and should not be treated as dead schema without checking usage:

| Field/Table | Used For |
|---|---|
| `products.app_category` | App-facing category override |
| `products.is_hidden_in_app` | Hide product from customer app |
| `products.force_out_of_stock` | Force unavailable state in app |
| `products.valid_until` | Package/offer expiry display |
| `products.tags` | UI badges |
| `package_items` | Package component mapping |
| `app_categories` | Editable app category list |
| `public-assets` | Admin image uploads |

## Risks

- Current admin services assume live RLS allows authenticated admin writes where needed.
- Checked-in migrations do not fully explain every admin field/table currently used by the code.
- Do not reintroduce `admin_pin` as the main admin model.
- Never place service role keys in frontend code.

## Related Context

- Database/RLS: `context/domains/database-rls.md`
- Edge Functions: `context/domains/edge-functions.md`
- Decisions: `context/decisions.md`
