# Phase 16: Full System Integration & Hardening Plan

This phase focuses on auditing, testing, and hardening the end-to-end WARPATH platform. No new major features will be added.

## 1. End-to-End Flow Validation
- **Audit Agent Communication**: Ensure `agentHeartbeat` and `registerAgent` correctly handle reconnects and invalid tokens.
- **Audit Mission Execution**: Verify the flow from `triggerMissionExecution` (server) -> `EXECUTE_MISSION` (agent) -> `reportStepProgress`/`reportMissionEvent` (agent) -> `mission_events` table (backend).
- **Audit Multiple Device Isolation**: Verify that `adbSerial` is strictly enforced in all `AdbService` calls and `WatchdogService` monitoring.

## 2. Security Hardening
- **Server Functions**: Audit all `createServerFn` to ensure `requireSupabaseAuth` middleware is present where needed.
- **ADB Safety**: Audit `agent/adb-service.js` to ensure the command allowlist is strictly enforced and target serials are always present for interactive commands.
- **RBAC & RLS**: 
    - Verify `profiles`, `farms`, `mission_runs` RLS policies.
    - Ensure `farm_users` correctly controls access for standard Users.
- **AI Security**: Verify that `processAiVision` and `generateMissionFromDescription` perform strict schema validation and audit logging.

## 3. Resilience & Failure Handling
- **Watchdog Recovery**: Verify `WatchdogService` max recovery attempts and timeout logic.
- **Idempotency**: Ensure `upsert` is used for discovery events to prevent duplicate records.
- **Graceful Failures**: Ensure the agent reports `MISSION_FAILED` when recovery fails, and the backend updates `mission_runs.status`.

## 4. Operational Observability
- **Monitoring UI**: Audit `/admin/monitoring` to ensure it distinguishes between multiple simultaneous missions.
- **Audit Logs**: Ensure PII and secrets (tokens, keys) are NEVER logged to `audit_logs` or `mission_events`.

## 5. Agent Packaging
- **Agent Build**: Prepare the agent for binary distribution (verifying `agent/dist/warpath-agent.exe` logic).

## 6. Project Status Update
- Update `docs/PROJECT_STATUS.md` to reflect Phase 16 completion and set the stage for Phase 17.

## Technical Tasks
- [Hardening] Add strict serial check to `MuMuService`.
- [Hardening] Add `REVOKE EXECUTE` or equivalent checks for Security Definer functions if any remain public.
- [Hardenign] Ensure `processAiVision` screenshot data is not stored in logs (only metadata).
- [Documentation] Update `docs/PROJECT_STATUS.md`.
