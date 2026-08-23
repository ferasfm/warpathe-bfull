# Phase 03D — Vision, Recovery, Commands and Logs Database

Implement the remaining core database tables for the automation platform's intelligence and logging layers.

## User Review Required

> [!IMPORTANT]
> This phase is strictly for database schema implementation. No backend logic for vision processing or command execution will be added.

- **Vision**: Assets (templates/images) and rules for OCR/Image recognition.
- **Recovery**: Logic for handling crashes or stalls.
- **Agent Communication**: Commands sent to agents and events received from them.
- **Auditing**: System-wide logging of administrative actions.

## Technical Details

### 1. Database Schema (SQL)
- Create `public.vision_assets`, `public.vision_rules`, `public.recovery_rules`, `public.agent_commands`, `public.agent_events`, and `public.audit_logs`.
- **JSONB Integration**: Used for configuration, payloads, and metadata to allow for extensible structured data.
- **Audit Logs**: Linked to `auth.users` for accountability.

### 2. Security (RLS)
- **SUPER_ADMIN / ADMIN**: Full access to configuration and logs.
- **USER**: No access to infrastructure, vision, or system-wide logs.
- Strict RLS policies to maintain isolation.

### 3. Documentation
- Update `docs/PROJECT_STATUS.md` to reflect Phase 03D completion.
- Update instruction block in `src/routes/index.tsx`.

## Verification Plan
- **SQL Migration**: Confirm all 6 new tables are created with proper foreign keys.
- **JSONB Testing**: Verify that nested objects can be stored in configuration fields.
- **RLS Check**: Confirm `USER` roles cannot query `audit_logs` or `vision_rules`.
- **Build**: Ensure no regressions in existing dashboard or auth flows.
