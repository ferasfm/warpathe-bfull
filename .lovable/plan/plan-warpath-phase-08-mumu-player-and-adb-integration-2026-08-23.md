# Plan: WARPATH Phase 08 - MuMu Player and ADB Integration

Integrate the Windows Agent with MuMu Player and ADB to enable physical automation infrastructure.

## User Review Required
> [!IMPORTANT]
> - The Agent requires `adb` to be available on the system. It will look for a configured path or attempt to find it in common locations.
> - MuMu Player discovery relies on checking running processes and specific MuMu-related registry keys/file paths.

## Proposed Changes

### Database & Backend
- **Audit Logs**: Ensure all Agent-initiated device discovery is logged.
- **API Extension**:
  - Update `agentHeartbeat` to accept device/emulator telemetry.
  - Extend `submitAgentEvent` to handle `DEVICE_DISCOVERED` and `EMULATOR_DISCOVERED` events.

### Windows Agent (`/agent`)
- **ADB Service**:
  - Implement `AdbService` to wrap `adb` CLI commands.
  - Commands: `adb devices`, `adb get-state`, `adb shell wm size`, `adb shell wm density`.
  - Secure validation allowlist for commands.
- **MuMu Service**:
  - Implement `MuMuService` for instance discovery (running/stopped).
  - Detect instance names, identifiers, and ADB endpoints.
  - Map ADB devices to MuMu instances.
- **Command Dispatcher**:
  - Implement new command handlers: `ADB_DEVICES`, `ADB_GET_STATE`, `ADB_GET_SCREEN_SIZE`, `ADB_GET_DENSITY`.
- **Telemetry**:
  - Automatic background discovery of devices and emulators.
  - Reporting of Model, Android Version, Resolution, and DPI.

### Admin UI
- **Agents Page**: Display last reported MuMu/ADB status.
- **Devices Page**: Show real-time data from Agents (Serial, Model, State).
- **Emulators Page**: Show MuMu specific data (Instance Name, Resolution, DPI).

## Technical Details
- Use `child_process` to execute `adb` safely.
- Implement a configuration system in the Agent for custom MuMu/ADB paths.
- Parse `adb shell wm size` output (e.g., "Physical size: 1012x800").
- Parse `adb shell wm density` output (e.g., "Physical density: 200").
- Scoped database updates to avoid duplicates (using unique device/emulator identifiers).

## Security Measures
- **Command Allowlist**: Only predefined ADB commands are allowed.
- **Input Sanitization**: No raw shell strings accepted from the backend.
- **Agent Auth**: Separate from user auth, verified via token hashing.
