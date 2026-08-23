# Phase 04H: Admin Logs and System Settings

Implementation of Phase 04H focusing on audit logs, agent events, and system settings.

## Database
- Add `public.system_settings` table.
- Configure RLS policies for `audit_logs`, `agent_events`, and `system_settings` to allow Admin/Super Admin access.
- Seed initial platform settings.

## Server Logic (`src/lib/admin-logs.functions.ts`)
- `getAuditLogs`: Fetch audit logs with pagination and filters (Action, Entity Type).
- `getAgentEvents`: Fetch agent events with pagination.
- `getSystemSettings`: Fetch all platform settings.
- `updateSystemSetting`: CRUD for platform configuration with Admin authorization.

## UI Components
- `/admin/logs`: Audit log viewer with table display and pagination.
- `/admin/settings`: Settings management interface with edit capabilities and JSON validation.

## Security
- Server-side validation for all write operations.
- RLS enforcement to ensure only authorized admins can access log and settings data.
- Read-only protection for audit logs at the UI and database level.

## Verification
- Admin can access and filter logs.
- Admin can modify allowed system settings.
- Normal users are blocked from these routes and operations.
