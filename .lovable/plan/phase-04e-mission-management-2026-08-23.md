# Phase 04E: Mission Management

Implementation of the Admin interface for managing Mission definitions, including versioning and an ordered step builder.

## User Review Required

> [!IMPORTANT]
> - This phase focuses on **configuration only**. No mission execution or AI vision logic will be implemented.
> - Mission steps are ordered and stored with their type, configuration (JSON), and retry logic.
> - Only one version of a mission template can be active at a time.

## Proposed Changes

### Server Functions
- **src/lib/mission.functions.ts** (New):
    - CRUD for `missions`.
    - Version management for `mission_templates`.
    - Ordered CRUD for `mission_steps`.
    - Fetch `mission_runs` history.
    - Server-side validation for mission hierarchy and admin roles.

### UI Components
- **Mission Management UI** (`/admin/missions`):
    - List view of all missions with search and status filters.
    - Dialog for creating/editing basic mission info.
- **Mission Builder UI** (`/admin/missions/:id`):
    - Version selector/creator.
    - Step list with drag-and-drop or manual reordering.
    - Step configuration forms for initial types (DETECT_IMAGE, TAP_TARGET, etc.).
    - Timeout and retry count configuration per step.
- **Mission Run History**:
    - Table view showing historical runs, farm references, and error logs.

### Security & RLS
- Enforce `checkAdmin` role checks in all mission management functions.
- Ensure RLS policies on `missions`, `mission_templates`, and `mission_steps` allow ADMIN/SUPER_ADMIN full access and restrict USER access.

## Technical Details

### Step Types
Initial definitions for:
- DETECT_IMAGE
- TAP_TARGET
- WAIT
- SWIPE
- VERIFY
- SELECT_RESOURCE
- SELECT_FLEET
- SEND_FLEET
- RECOVERY
- COMPLETE

### File Structure
- `src/lib/mission.functions.ts` (New)
- `src/routes/_authenticated/admin/missions/index.tsx` (New)
- `src/routes/_authenticated/admin/missions/.tsx` (New)
- `src/components/admin/MissionStepDialog.tsx` (New)
- `src/components/admin/MissionTemplateSelector.tsx` (New)

