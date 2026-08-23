# Project Plan: Warpath Automation Platform - Phase 01: Foundation

This plan covers the complete transformation of the existing codebase into the foundation for the Warpath Automation Platform. We will remove all "Al-Huda Fuel" branding and logic, replacing it with a clean, modular React + TanStack Start architecture secured by Supabase Auth.

## User Summary
Build the core web infrastructure for an automation platform including login, dashboards (User & Admin), protected routing, and a professional layout, ensuring full integration with Supabase for authentication and data.

## Proposed Changes

### Database & Security (Lovable Cloud / Supabase)
- Create `public.user_roles` table to handle Admin/User permissions.
- Implement `has_role` security definer function for RLS.
- Enable RLS on all new tables and grant appropriate permissions to `authenticated` and `service_role`.

### Infrastructure & Authentication
- Implement Supabase Auth flow with `/auth` and `/auth/callback` routes.
- Create an authentication guard component/layout (`src/routes/_authenticated`) to protect the dashboard and admin areas.
- Configure `src/start.ts` with `attachSupabaseAuth` middleware for server functions.

### Routing & Layout
- `/login`: Public login page with email/password and social login options.
- `/dashboard`: Protected user area for monitoring platform status.
- `/admin`: Protected administrative area restricted to users with the 'admin' role.
- Implement a `MainLayout` with a responsive `Sidebar` and `Header`.

### Documentation
- Create `docs/PROJECT_STATUS.md` to track development phases and issues.

## Technical Details
- **Framework**: React 19 + TanStack Start v1 (Vite 7).
- **Styling**: Tailwind CSS v4 + Shadcn UI components.
- **Auth**: Supabase Auth (SSR-ready via TanStack Start).
- **State Management**: TanStack Query for data fetching.
- **Protection**: `/admin` route will have a specific role check in its loader/middleware.

## Success Criteria
1. Clean build with no errors.
2. Functional login/logout flow.
3. Verified RLS and role-based access for the `/admin` route.
4. Professional, modular sidebar-based layout.
5. No legacy "Al-Huda Fuel" code remains in the main user paths.
