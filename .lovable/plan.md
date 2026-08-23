# Plan - Phase 09: Screenshot and Vision Foundation

Implement the Screenshot and Vision foundation inside the existing Windows Agent and Backend.

## User Review Required

> [!IMPORTANT]
> This phase implements **deterministic image matching** (template matching) and screenshot capture. It does **not** include AI vision, OCR, or automatic clicking.

- **Emulator Config**: Enforcing 1012x800 resolution and 200 DPI.
- **Security**: Diagnostic screenshots are restricted to Admins.
- **Vision Rules**: Reusing existing `vision_assets` and `vision_rules` tables.

## Proposed Changes

### Database & Backend
- Add `vision_results` table to store detection metadata (no images in DB).
- Update `agent-communication.functions.ts` to support diagnostic screenshot requests.

### Windows Agent (`/agent`)
- **ScreenshotService**: 
  - Add `ADB_SCREENSHOT` command to `AdbService`.
  - Implement `ScreenshotService.js` to handle capture and binary processing.
- **VisionService**:
  - Implement deterministic template matching using `jimp-compact` (faster, lightweight alternative to full OpenCV for Node).
  - Support multiple matches sorted by confidence.
  - Handle resolution validation (1012x800).
- **Command Dispatcher**:
  - Add `TAKE_SCREENSHOT` and `TEST_VISION_RULE` handlers.

### Admin UI
- Create `/admin/vision-test` or update `/admin/emulators` with a "Diagnostic" modal.
- Allow Admins to trigger a screenshot, select a rule, and see detection results visually.

## Technical Details

### Image Matching Logic
We will use a Pixel-based template matching approach:
1. Load screenshot and template via Jimp.
2. Iterate through pixels (optimized) to find the best match within the threshold.
3. Return bounding box and confidence score.

### Security
- Server-side validation that only Admins can emit `TAKE_SCREENSHOT` commands.
- Agent verifies that it only captures screenshots for devices assigned to it.

## Acceptance Criteria
- Screenshot capture works from MuMu.
- Resolution mismatch is detected.
- Template matching returns accurate coordinates.
- Multiple matches are correctly sorted.
- Admin diagnostic tool works as described.
