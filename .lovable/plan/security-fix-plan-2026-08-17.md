# Security Fix Plan

This plan addresses several security improvements across the database and application code to ensure robust access control and input validation.

## Security Improvements

### 1. Database Hardening (RLS & Grants)
Ensuring all public tables follow the strict security requirements for Lovable Cloud:
- Enable Row Level Security (RLS) on all core tables.
- Apply explicit `GRANT` statements for `authenticated`, `anon`, and `service_role`.
- Implement fine-grained policies for hierarchical management.

**Tables to be secured:**
- `stations`: Public read, Super Admin write.
- `station_fuels`: Public read, Managers/Admins write.
- `announcements`: Public read, Super Admin write.
- `profiles`: Self read, Super Admin read all.
- `user_roles`: Read-only via security definer function `has_role`.
- `manager_groups`, `manager_group_members`, `manager_group_stations`: Super Admin only.
- `station_audit_log`: Authenticated read, Super Admin manage.

### 2. Public API Security
- Adding Zod validation and basic request filtering to `/api/public/manifest` to prevent potential abuse or unexpected inputs.

### 3. Server Function Hardening
- Ensuring all server functions use `requireSupabaseAuth` and verify specific roles before performing privileged operations.
- Verifying that sensitive server-side logic is correctly isolated from the client bundle.

### 4. Manifest Optimization
- Updating the PWA manifest with secure defaults and ensuring it doesn't leak any sensitive configuration.

## Technical Details

- **Database:** A new migration file will be created with `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `GRANT ... TO ...` for all tables defined in the schema.
- **Frontend:** No visual changes, but improved error handling and validation in forms.
- **Backend:** `createServerFn` handlers will be audited for proper role checks using the `has_role` helper.
