# Agent Workflow

## Before Editing

1. Read `AGENTS.md`.
2. Read `context/status.md`.
3. Read the domain file for the task.
4. Verify claims against code for any API, function, RLS, env var, path, or workflow touched.

## During Work

- Prefer existing patterns and services.
- Keep changes scoped.
- Do not revert unrelated user changes.
- For frontend work, run the app and visually verify when practical.
- For security/database work, prefer live Supabase verification when possible.

## After Meaningful Changes

Update documentation only where the change affects future work:

- `AGENTS.md`: system-level facts, commands, env vars, workflows, security model.
- `context/status.md`: current state, active work, recent changes.
- `context/decisions.md`: significant decisions and rationale.
- Domain files: relationships, risks, operational notes.

## What Not To Put In Context

- Large copied code blocks.
- Temporary debugging notes.
- Long audit reports already stored in `docs/security`.
- Implementation details that are obvious from a nearby source file.
