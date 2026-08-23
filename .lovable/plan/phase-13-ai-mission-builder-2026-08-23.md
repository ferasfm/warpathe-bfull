# Phase 13: AI Mission Builder

Implement a natural language mission builder that converts admin descriptions into structured mission definitions using the existing AI Gateway.

## User Review Required

> [!IMPORTANT]
> The AI Mission Builder will use the `LOVABLE_API_KEY`. Please ensure this is configured in the environment.

- **Confirmation**: Does the existing `mission_templates` and `mission_steps` schema fully satisfy the requirements, or should I add new tables for draft generation auditing? (Plan assumes adding an audit table `ai_mission_generation_logs`).

## Proposed Changes

### Database & Schema
- Create `public.ai_mission_generation_logs` table:
    - `id` (uuid, pk)
    - `admin_id` (uuid, fk to auth.users)
    - `prompt` (text)
    - `generated_json` (jsonb)
    - `provider` (text)
    - `model` (text)
    - `status` (text: success, failure)
    - `error_message` (text)
    - `created_at` (timestamp)
- Enable RLS and add `GRANT` for `authenticated` roles.

### Server Functions
- Create `src/lib/ai-mission-builder.functions.ts`:
    - `generateMissionFromDescription`:
        - Validates admin session.
        - Fetches `vision_assets` and `recovery_rules` to provide context.
        - Constructs a strict prompt for the AI Gateway.
        - Calls AI Gateway with `response_format: { type: "json_object" }`.
        - Validates the JSON structure using Zod against the `mission_steps` allowlist.
        - Logs the attempt in `ai_mission_generation_logs`.
        - Returns the validated mission structure.

### Admin UI
- Update `src/routes/_authenticated/admin/missions/$id.tsx`:
    - Add "AI Builder" section or tab.
    - Implement a textarea for mission description.
    - "Generate Steps" button with loading state.
    - Preview area for generated steps.
    - Integration with existing `upsertMissionStep` to save as a draft version.

### Safety & Security
- Strict allowlist for `step_type`: `WAIT`, `SCREENSHOT`, `FIND_IMAGE`, `TAP`, `CONDITION`, `END`.
- Explicitly reject any steps containing code or shell commands.
- Ensure all AI-generated content is saved as a "DRAFT" template first.

## Technical Details
- **AI Prompt**: Will include the list of available `vision_assets` IDs to minimize "REQUIRES_ASSET" responses.
- **Validation**: Zod schema will enforce `step_order`, `step_type`, and parameter constraints.
- **Rate Limiting**: Reuse existing rate limiting patterns if applicable, or implement simple mission-per-device/admin limits.

## Verification Plan
### Automated Tests
- Create a test script `src/lib/ai-mission-builder.test.ts` (or use a temporary test route) to:
    - Test valid/invalid descriptions.
    - Verify schema rejection for unknown actions.
    - Verify "REQUIRES_ASSET" handling.
- Run `bun run build` to ensure no regressions.

### Manual Verification
- Navigate to Mission Management.
- Use the AI Builder to generate a mission from a description.
- Review and edit the generated steps.
- Approve the draft and verify it becomes an active mission version.
