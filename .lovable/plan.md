# Project Plan - Al-Huda Central Hub & Admin Suite

This plan outlines the roadmap for building a professional, modern, and live-updating central hub for Al-Huda fuel stations, including a hierarchical administration system and mobile optimization.

## Goals
- **Unified Customer Hub**: A live portal for customers to track fuel availability.
- **Hierarchical Admin**: Multi-level access (Super Admin vs. Managers) with group-based station management.
- **Full Auditing**: Track every edit (who, what, when, where) in a central dashboard.
- **Live Sync**: Real-time updates without page refreshes.
- **Mobile Optimized**: Professional PWA-ready design.

## Technical Strategy
1. **Real-time Engine**: Leverages Supabase Realtime for instant synchronization across all connected clients.
2. **Permission System**: 
   - `user_roles` for Super Admin distinction.
   - `manager_groups` and `manager_group_members` for multi-station assignments.
   - Granular flags (`can_edit_fuels`, etc.) for fine-grained control.
3. **Audit Trail**: PostgreSQL triggers on `stations` and `station_fuels` automatically populate a `station_audit_log` with actor metadata.
4. **Mobile Experience**: Modern Tailwind UI with PWA manifest support for "Add to Home Screen".

## Roadmap & Features
### 1. Advanced Admin Dashboards
- **Global Overview**: Statistics on fuel availability across the entire network.
- **Group Management**: Tool for Super Admins to bundle stations and assign them to managers.
- **Activity Feed**: Real-time stream of audit logs showing admin/manager actions.

### 2. User Experience Enhancements
- **"Add to Home Screen"**: Guidance for users to install the app on their phones.
- **Advanced Filtering**: Search by proximity, region, or specific fuel type.
- **Live Notifications**: Browser notifications when subscribed stations update their stock.

### 3. Proposed Ideas
- **Stock Forecasting**: Show trends of fuel availability.
- **Customer Feedback**: Simple reporting tool for customers at stations.
- **Map View**: Interactive map showing live status markers (Green/Red) for all stations.

## Technical Details
- **Backend**: PostgreSQL + RLS + Triggers.
- **Frontend**: TanStack Start, Lucide Icons, Shadcn UI.
- **Real-time**: Supabase `channel` subscriptions.
- **Audit Table**: `station_audit_log(id, actor_email, station_id, action, summary, changes, created_at)`.
