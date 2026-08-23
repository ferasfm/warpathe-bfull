# Phase 04A: Admin Dashboard Implementation

Build the core administrative dashboard for WARPATH, providing a high-level overview of system status, operational metrics, and navigation to sub-modules.

## User Review Required

> [!IMPORTANT]
> The current UI is in Arabic (RTL). Should the Admin Dashboard follow this language, or switch to English for the "Professional Administrative" look requested?

## Proposed Changes

### 1. Navigation & Sidebar
- Update `src/components/layout/Sidebar.tsx` to include all requested Admin sub-sections:
  - Dashboard
  - Users
  - Accounts & Farms
  - Resources & Fleets
  - Missions
  - Agents & Devices
  - Vision
  - Recovery
  - Logs
  - Settings
- Note: Only the "Dashboard" and "Users" links will be functional in this phase.

### 2. Admin Dashboard Layout (`src/routes/_authenticated/admin/index.tsx`)
- Implement a new responsive grid layout.
- **Summary Cards**:
  - Fetch counts from Supabase for: Users, Accounts, Farms, Fleets, Missions, Agents, Devices, Emulators.
- **Operational Status Cards**:
  - Online/Offline Agents (calculated from `agents.last_heartbeat`).
  - Active/Failed Missions (calculated from `mission_runs.status`).
- **Recent Activity**:
  - List of latest entries from `audit_logs` or `agent_events`.
- **System Status**:
  - Visual indicators for core system components.

### 3. Data Fetching
- Create a new server function `getAdminStats` to efficiently fetch counts and status metrics in a single request (or via separate parallel queries).

### 4. Security & Roles
- Verify that `src/routes/_authenticated/route.tsx` correctly guards the `/admin` path for `admin` and `super_admin` roles.

### 5. Documentation
- Update `docs/PROJECT_STATUS.md` to reflect Phase 04A completion.

## Technical Details
- Use `lucide-react` for icons.
- Use `shadcn/ui` components (Card, Badge, Button).
- Implement server functions in `src/lib/admin.functions.ts`.
- Database queries will use the Supabase JS client inside server functions.

## Acceptance Criteria
- [ ] ADMIN/SUPER_ADMIN can access `/admin`.
- [ ] USER is redirected away from `/admin`.
- [ ] Dashboard displays live counts from the database.
- [ ] Sidebar includes all 10 requested navigation items.
- [ ] App builds successfully without lint errors.
