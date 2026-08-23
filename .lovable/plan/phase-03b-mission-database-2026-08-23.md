# Phase 03B — Mission Database

Implement the core database schema for missions, mission templates, mission steps, and mission runs.

## User Review Required

> [!IMPORTANT]
> This phase focuses purely on the database layer. No UI or execution engine will be built yet.

- **Missions**: Top-level automation definitions.
- **Mission Templates**: Versioned configurations for missions.
- **Mission Steps**: Individual actions within a template (JSON-based configuration).
- **Mission Runs**: Execution logs for specific farms.

## Technical Details

### 1. Database Schema (SQL)
- Create `public.missions`, `public.mission_templates`, `public.mission_steps`, and `public.mission_runs` tables.
- **Constraints**:
    - `mission_steps`: Unique `(mission_template_id, step_order)` to prevent execution order conflicts.
    - Foreign keys connecting missions to runs, templates, and farms.
- **JSON Configuration**: `mission_steps.configuration` will use `jsonb` for flexible, structured step data.

### 2. Security (RLS)
- **Permissions**:
    - `SUPER_ADMIN` / `ADMIN`: Full CRUD on all mission tables.
    - `USER`: Read-only access to missions and runs associated with their assigned farms (via `farm_users`).
- **Grants**:
    - Ensure `authenticated` and `service_role` have appropriate access.

### 3. Documentation
- Update `docs/PROJECT_STATUS.md` to reflect Phase 03B completion.
- Update instruction block in `src/routes/index.tsx`.

## Verification Plan

- **SQL Migration**: Run and verify table creation and constraints.
- **RLS Test**:
    - Verify Admin can create missions.
    - Verify User can only see missions/runs if they have access to the related farm.
    - Verify `step_order` unique constraint prevents duplicates.
- **Build**: Ensure project remains stable and builds without errors.
