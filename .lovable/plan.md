# Phase 15: Monitoring, Logs and Operational Observability

Build the complete operational monitoring and logging layer for WARPATH, providing administrators and users with real-time visibility into the platform's state and history.

## User Review Required

> [!IMPORTANT]
> - Real-time monitoring will use Supabase Realtime subscriptions where available, falling back to 5-10s polling for non-realtime tables.
> - Historical logs will be paginated to ensure performance.
> - Retention settings will be added to `system_settings` but actual cleanup scripts (CRON) require a separate infrastructure step (Phase 16+ or serverless functions).

## Proposed Changes

### Database & Schema
- Add `retention_settings` to `system_settings` table.
- Ensure `audit_logs`, `agent_events`, and `mission_runs` have necessary indexes for performant filtering.

### Admin Dashboard Enhancements
- Create `/admin/monitoring` as the central hub.
- **Top Metrics**: Real-time counters for Agents (Online/Offline), Devices, MuMu (Busy/Idle), and Missions.
- **Agent Monitoring List**: Detailed status, heartbeat lag, and connected emulators.
- **Emulator Monitoring List**: ADB serials, current missions, steps, and last errors.
- **Active Missions**: Live progress tracking for all running missions across the fleet.

### Logging & Auditing UI
- Create `/admin/logs` with advanced filtering and search.
- **Categories**: Auth, Admin, Agent, Device, Emulator, Mission, Vision, AI Vision, Recovery, ADB, System.
- **Severities**: DEBUG, INFO, WARN, ERROR, CRITICAL (with visual color-coding).
- **Mission Timeline**: A new component to visualize the life of a mission run (e.g., Started -> Step 1 -> Screenshot -> Tap -> Step 2 -> Recovery -> Completed).

### User-Side Visibility
- Update `/dashboard` and `/farms` to show progress bars and last status for missions belonging to the user's farms.
- Strict RLS enforcement ensures users only see their own data.

### Agent-Side Observability
- Update Windows Agent to report more granular "DEBUG" and "INFO" events for the timeline.
- Heartbeat now includes system load/memory if available from `os` module.

## Technical Details

### Real-Time Infrastructure
- Use `supabase.channel()` to subscribe to `agent_commands`, `agent_events`, and `mission_runs` for live updates in the monitoring UI.

### Performance & Scaling
- Server-side pagination for logs using TanStack Query.
- Debounced search/filtering to prevent excessive database hits.

### Security
- All monitoring routes under `/admin` are protected by `has_role(auth.uid(), 'admin')`.
- Middleware to strip sensitive fields (tokens, secrets) from any client-returned log data.

## Verification Plan

### Automated & Manual Tests
1. **Heartbeat**: Verify Agent status flips to "OFFLINE" after 90s of no heartbeat.
2. **Multi-Instance**: Verify two missions running on the same machine appear as distinct entries.
3. **Mission Timeline**: Trigger a mission and verify every step appears in the timeline UI.
4. **Filtering**: Search logs by "ERROR" and specific "Agent ID".
5. **RLS**: Log in as a normal user and attempt to access `/admin/monitoring` (expect 403).
6. **Performance**: Verify log page loads quickly with 10,000+ mock events.
