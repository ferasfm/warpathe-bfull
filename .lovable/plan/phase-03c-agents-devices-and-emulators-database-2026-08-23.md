# Phase 03C — Agents, Devices and Emulators Database

Implement the database schema for managing remote agents, physical devices, and MuMu emulator instances.

## User Review Required

> [!IMPORTANT]
> This phase is purely for database structure. No agent software or emulator automation will be built.

- **Agents**: Windows services running the automation host.
- **Devices**: Physical Android devices connected via ADB.
- **Emulators**: Virtual MuMu instances managed by agents.

## Technical Details

### 1. Database Schema (SQL)
- Create `public.agents`, `public.devices`, and `public.emulators` tables.
- **Emulators**: Default resolution `1012x800` and DPI `200`.
- **Relationships**:
    - Agents track heartbeats and versioning.
    - Devices and Emulators link to a parent Agent.
    - Emulators can be linked to a `farm_id` for dedicated automation tasks.

### 2. Security (RLS)
- **SUPER_ADMIN / ADMIN**: Full access to monitor and manage all agents and infrastructure.
- **USER**: No access by default (restricted to farm-level operations).
- RLS policies will enforce this hierarchy.

### 3. Documentation
- Update `docs/PROJECT_STATUS.md` to reflect Phase 03C completion.
- Update instruction block in `src/routes/index.tsx`.

## Verification Plan
- **SQL Migration**: Verify tables, foreign keys, and unique constraints.
- **RLS Test**: Ensure normal users cannot read agent or emulator metadata.
- **Integrity**: Verify that deleting an agent correctly handles (cascades or restricts) its devices.
