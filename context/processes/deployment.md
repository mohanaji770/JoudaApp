# Deployment Process

## Frontend

Expected deployment path: GitHub to Vercel.

Before shipping frontend changes:

```bash
npm run build
```

Run additional checks if the changed area has tests or lint requirements.

## Android

For Android release or native verification:

```bash
npm run build
npx cap sync android
npx cap open android
```

Use Android Studio to generate the signed AAB for Google Play.

## Edge Functions

Current docs mention Supabase Dashboard/manual deployment. If using CLI, confirm project id and function name before deploy.

After function changes:

- Confirm required secrets exist.
- Confirm JWT setting in `supabase/config.toml` or Dashboard.
- Test CORS/auth behavior for browser-called functions.
- Update `AGENTS.md` and relevant context files if behavior changes.

## Database

Use migrations or Supabase SQL Editor depending on current project workflow. For RLS/security work, inspect live policies before and after applying SQL.

## Related Context

- Android: `context/domains/android.md`
- Edge Functions: `context/domains/edge-functions.md`
- Database/RLS: `context/domains/database-rls.md`
