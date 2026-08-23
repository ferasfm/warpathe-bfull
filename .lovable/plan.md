# Phase 12: AI Vision Fallback Implementation

Implement an AI-powered vision fallback layer that triggers when deterministic template matching fails.

## User Review Required

> [!IMPORTANT]
> The AI Vision feature requires a valid LLM API key (e.g., OpenAI, Anthropic). By default, I will configure it to use the **Lovable AI Gateway**. Please ensure you have configured any required secrets in the backend if you intend to use specific external providers.

## Proposed Changes

### Database & Security
- Add `ai_vision_logs` table for full auditing of AI calls.
- Add AI configuration keys to `system_settings` (Enabled, Provider, Model, Thresholds, Limits).
- Securely handle API calls through the server, never exposing keys to the agent.

### Server-Side (TanStack Start)
- Create `src/lib/ai-vision.functions.ts` for AI processing.
- Implement `processAiVision` server function with:
    - Input validation (Zod).
    - Rate limiting (per device/mission).
    - Lovable AI Gateway integration for image analysis.
    - Strict JSON output validation (detected, confidence, coordinates).
    - Logging to `ai_vision_logs`.

### Windows Agent
- Update `agent/vision-service.js` to include the fallback logic.
- Update `agent/mission-engine.js` to trigger AI Vision if deterministic matching fails and AI is enabled.
- Implement timeout and retry logic for AI calls.

### Admin Dashboard
- Add an "AI Vision" configuration section to the Admin Settings page.
- Add an AI Vision logs viewer (optional, but good for diagnostics).

## Technical Details

### AI Vision API Contract
```typescript
interface AiVisionResult {
  detected: boolean;
  confidence: number;
  coordinates?: { x: number; y: number };
  objects: string[];
  error?: string;
}
```

### Safety Limits
- `AI_VISION_MAX_CALLS_PER_MISSION`: Default 10.
- `AI_VISION_MAX_CALLS_PER_DEVICE_HOUR`: Default 50.
- AI cannot execute commands; it only provides coordinates to the `MissionEngine`.
