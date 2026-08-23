# Phase 04D: Resources and Fleets Management

Implementation of the Admin interface for managing game resources, resource images, fleets, and fleet-resource assignments.

## User Review Required

> [!IMPORTANT]
> - This phase adds image storage to Supabase. Ensure the 'resource-assets' bucket is created in the backend (I will handle this via SQL if possible, otherwise it may need manual creation).
> - Fleet numbers must be unique within a farm.
> - Resources WHEAT, IRON, and STEEL will be initialized if they don't exist.

## Proposed Changes

### Database & Storage
- Initialize 'resource-assets' bucket in Supabase storage (via SQL migration).
- Seed default resources: WHEAT, IRON, STEEL.
- Ensure RLS for `resources`, `resource_assets`, `fleets`, and `fleet_assignments` allows ADMIN/SUPER_ADMIN full access and USER read-only access (restricted to assigned farms for fleets).

### Server Functions
- **src/lib/resource.functions.ts**:
    - CRUD for Resources.
    - Resource Asset management (Upload/Replace image in Supabase Storage).
- **src/lib/fleet.functions.ts**:
    - CRUD for Fleets (with unique fleet_number per farm validation).
    - CRUD for Fleet Assignments.
    - Fetch fleets with their current resource assignments.

### UI Components
- **Resource Management UI** (`/admin/resources`):
    - Table view of all resources.
    - Status toggle (Enable/Disable).
    - Image preview and upload/replace dialog.
- **Fleet Management UI** (`/admin/fleets`):
    - Farm selection dropdown.
    - Fleet list for the selected farm.
    - Fleet configuration: name, number, and resource assignment.
    - Validation for duplicate fleet numbers and duplicate assignments.

### Security & RLS
- Verify that server-side functions enforce `checkAdmin` role checks.
- Verify RLS policies on:
    - `resources`: Public read, Admin write.
    - `fleets`: Admin full access, User read (where farm_id in farm_users).
    - `fleet_assignments`: Admin full access, User read (where farm_id in farm_users).

## Technical Details

### Schema Check
- `resources`: id, name, enabled (bool), created_at, updated_at.
- `resource_assets`: id, resource_id, asset_url, created_at.
- `fleets`: id, farm_id, fleet_number (int), name, status, created_at, updated_at.
- `fleet_assignments`: id, fleet_id, farm_id, resource_id, enabled (bool), created_at, updated_at.

### File Structure
- `src/lib/resource.functions.ts` (New)
- `src/lib/fleet.functions.ts` (New)
- `src/routes/_authenticated/admin/resources.tsx` (New)
- `src/routes/_authenticated/admin/fleets.tsx` (New)
- `src/components/admin/ResourceDialog.tsx` (New)
- `src/components/admin/FleetDialog.tsx` (New)

