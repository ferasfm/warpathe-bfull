# Phase 02: Users and Permissions - Implementation Plan

Complete the authentication and authorization system for WARPATH with three distinct roles: `SUPER_ADMIN`, `ADMIN`, and `USER`.

## 1. Database & Security
- **Enum Update**: Synchronize `app_role` enum to include `super_admin`, `admin`, and `user`.
- **User Roles**: Ensure the `user_roles` table accurately tracks these assignments.
- **RLS Policies**:
    - `profiles`: Users can read their own profile; admins can read all.
    - `user_roles`: `super_admin` can manage all roles; `admin` can read roles and manage `user` roles (but not `admin` or `super_admin`).
- **Security Definer Functions**: Update `has_role` to support the new hierarchy.

## 2. Server-Side Authorization
- **Role Validation**: Implement server-side check utilities to prevent `USER` accounts from accessing admin functions or the `/admin` route via direct URL.
- **Server Functions**:
    - `getUsers`: Fetch all users for the management dashboard.
    - `updateUserRole`: Allow authorized role changes (e.g., `admin` can promote `user` to `user`, but not to `super_admin`).

## 3. UI & Routing
- **Protected Layouts**:
    - Update `src/routes/_authenticated/admin/route.tsx` to strictly enforce admin-only access.
- **Role-Based Sidebar**:
    - Dynamically show "Users" and "Admin Dashboard" links only to authorized roles.
- **Admin User Management**:
    - Build `/admin/users` to view and modify user permissions.
- **Logout/Session**: Verify that session persistence and logout remain robust.

## 4. Technical Details
- **Tech Stack**: TanStack Start, React 19, Supabase Auth + RLS.
- **Roles Hierarchy**:
    - `super_admin` > `admin` > `user`.
- **Data Integrity**: Enforce role-change logic in PostgreSQL functions to prevent privilege escalation.

## 5. Acceptance Criteria
- [ ] `USER` cannot access `/admin` or call admin server functions.
- [ ] `ADMIN` can manage normal users but not `super_admin`.
- [ ] `SUPER_ADMIN` has unrestricted access.
- [ ] Roles persist across refreshes and logout works correctly.
- [ ] No future features (Windows Agent, ADB) are implemented.
