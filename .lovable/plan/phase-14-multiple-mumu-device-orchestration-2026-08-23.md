# Phase 14: Multiple MuMu / Device Orchestration

Extend the Windows Agent to manage multiple MuMu instances simultaneously, ensuring complete isolation and stable identity mapping.

## User Review Required

> [!IMPORTANT]
> The system will now treat each MuMu instance as a distinct target. Ensure your MuMu instances have stable ADB ports (e.g., 7555, 7556) or serials for reliable mapping.

## Proposed Changes

### Database Schema Updates
- Update `public.emulators` table:
    - Add `adb_serial` (TEXT) to store the direct ADB identifier.
    - Add `instance_name` (TEXT) to store the MuMu-specific name (e.g., "MuMuPlayer-1").
    - Add `last_error` (TEXT) for monitoring.
    - Add `is_busy` (BOOLEAN) default `false`.
- Update `public.devices` table:
    - Ensure `device_id` is unique per agent to prevent duplicate records during discovery.

### Windows Agent Enhancements
- **AdbService**: 
    - Enforce mandatory `-s <serial>` for all interactive commands (tap, screenshot, etc.).
- **MuMuService**:
    - Implement multi-instance discovery logic.
    - Map MuMu instances to ADB ports automatically (7555, 7556, etc.).
- **WarpathAgent (Main)**:
    - Discovery loop: Report all detected MuMu instances with their serials.
    - Command Routing: Verify target serial exists and is ONLINE before executing mission steps.
- **MissionEngine**:
    - Maintain strict isolation using the `emulator_id` for all ADB/Vision calls.
    - Support concurrent execution of different missions on different emulators.
- **WatchdogService**:
    - Isolate recovery state per `mission_run_id` and `emulator_id`.
    - Prevent recovery on one emulator from affecting others.

### Admin UI Enhancements
- **Emulators Page**:
    - Show ADB Serial and Instance Name.
    - Show real-time `is_busy` status and current mission info.
    - Display `last_error` for troubleshooting.

### Security
- ADB commands restricted to resolved serials only.
- No global state for screenshots or vision results.

## Technical Details

### Command Payload Change
Commands like `EXECUTE_MISSION` will now explicitly include:
```json
{
  "emulator_id": "UUID",
  "adb_serial": "127.0.0.1:7555",
  "mission_id": "UUID"
}
```

### Discovery Event
`EMULATOR_DISCOVERED` will now be handled as an upsert based on `(agent_id, adb_serial)` to maintain stable identity.

## Verification Plan

### Automated Tests
- **Concurrent Missions**: Trigger missions on two different emulators and verify simultaneous execution via logs.
- **Isolation Test**: Simulate a crash/disconnect on Emulator A and verify Emulator B continues Mission B.
- **Discovery Test**: Verify multiple MuMu ports are detected and reported as separate entities.
- **Security Check**: Verify ADB commands fail if no serial is provided.

### Manual Verification
- Check Admin Dashboard to see multiple emulators linked to one agent.
- Verify status changes (ONLINE/OFFLINE/BUSY) update correctly for each instance.
