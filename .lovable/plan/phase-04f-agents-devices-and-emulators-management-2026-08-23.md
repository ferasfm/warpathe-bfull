# Phase 04F: Agents, Devices and Emulators Management

Build the Admin interface for managing Windows Agents, Devices, and MuMu Emulator instances.

## Objectives
- Create a unified management interface for the infrastructure layer.
- Allow Admins to view Agents and Devices status.
- Provide CRUD operations for MuMu Emulator records and their Farm assignments.
- Enforce strict resolution (1012x800) and DPI (200) configuration requirements for emulators.

## Technical Details

### Backend Changes
- **Server Functions**:
    - `src/lib/agent.functions.ts`: Fetching Agents and Devices; CRUD for Emulators.
- **RLS & Security**:
    - Preserve existing RLS policies on `agents`, `devices`, and `emulators`.
    - Enforce Admin/Super Admin roles in all write operations.

### Frontend Changes
- **New Routes**:
    - `/admin/agents`: List of registered agents with status, version, and heartbeat.
    - `/admin/devices`: List of devices linked to agents.
    - `/admin/emulators`: Management of emulator records, including farm assignment.
- **Components**:
    - `AgentTable`: Display agent metrics.
    - `DeviceTable`: Display device-agent relationships.
    - `EmulatorDialog`: Form for creating/editing emulator records with farm selection.

### Validation Rules
- Emulator resolution must be `1012x800`.
- Emulator DPI must be `200`.
- An emulator must be associated with an Agent and Device.
- An emulator can be optionally assigned to a single Farm.

## User Interface
- Standard Admin UI using `Table`, `Dialog`, `Button`, and `Badge` components.
- Status indicators for Agents (Online/Offline/Unknown) based on database values.
- Search and filtering for agents and emulators.
