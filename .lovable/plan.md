# Plan: Phase 12 - AI Vision Fallback

Implement a secure, structured AI Vision fallback layer for the WARPATH platform. This adds an optional observation layer when deterministic matching fails, using an abstraction for AI providers while maintaining strict security boundaries.

## Proposed Changes

### Database & Security
- Create `ai_vision_logs` table for auditing AI requests and results.
- Add AI configuration fields to `system_settings` (e.g., `AI_VISION_ENABLED`, `AI_VISION_PROVIDER`, `AI_MIN_CONFIDENCE`).
- Define `app_role` permissions for managing AI settings.

### Platform (Backend)
- Implement `AiVisionProvider` abstraction in `src/lib/vision/`.
- Create a dedicated server function `processAiVisionFallback` that:
    - Validates AI provider secrets (server-side only).
    - Sends screenshots and context to the configured provider (e.g., OpenAI/Anthropic via Lovable AI Gateway).
    - Enforces strict JSON output schema validation using Zod.
    - Implements rate limiting and mission-level call budgets.

### Windows Agent
- Modify `agent/vision-service.js` to include `AiVisionFallback` logic.
- Update `agent/mission-engine.js` (`handleFindImage`):
    - Try deterministic `findTemplate` first.
    - If confidence is below threshold AND AI is enabled, request AI fallback from the platform.
    - Validate and consume AI structured observations.
- Implement short-lived caching for vision results in the agent.

### Admin UI
- Add "AI Vision" tab to the Admin Dashboard for global settings.
- Update Vision Diagnostic tool to show AI fallback results and confidence scores.

## Technical Details

- **Vision Result Schema**:
```json
{
  "detected": boolean,
  "confidence": number,
  "objects": [{ "label": "button", "center_x": 160, "center_y": 225, ... }]
}
```
- **Security**: AI never touches ADB. It only "sees" and "reports". The Agent decides what to do based on those reports.
- **Limits**: Configurable `MAX_AI_CALLS_PER_MISSION` (default: 10) and `AI_RATE_LIMIT_MS` (default: 5000ms).

## Acceptance Criteria
- [ ] Deterministic Vision remains the primary layer.
- [ ] AI fallback is only triggered when enabled and deterministic matching fails.
- [ ] AI results are schema-validated and rejected if malformed.
- [ ] Mission Engine continues mission based on AI observations.
- [ ] AI usage is fully audited with cost/performance tracking.
- [ ] Windows Agent re-builds successfully.
