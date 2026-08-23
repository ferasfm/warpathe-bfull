# Plan: Link Windows Agent to Production Backend

We will modify the Windows Agent to use a configurable Backend URL, defaulting to the production environment, while maintaining security and core functionality.

## User Summary
The Windows Agent currently tries to connect to `localhost:8080`, which fails on external machines. We will update it to connect to your live production URL by default and allow you to override it via an environment variable.

## Proposed Changes

### Windows Agent (Node.js)
- **Environment Variable**: `WARPATH_API_URL`
- **Default Value**: `https://warpathe-bfull.lovable.app/api/public/agent`
- **Location**: `agent/index.js`
- **Changes**:
    1. Update `WarpathAgent` constructor to use the production URL when `WARPATH_API_URL` is not set.
    2. Ensure `axios` requests use this URL for registration, heartbeats, and command polling.
    3. Rebuild the standalone executable `agent/dist/warpath-agent.exe`.

## Technical Details
- The environment variable `WARPATH_API_URL` will be read using `process.env.WARPATH_API_URL`.
- The production URL will be hardcoded as the fallback.
- No Supabase keys will be added to the agent; it continues to use its own hashed token system for authentication.
- The build process uses `pkg` as defined in `agent/package.json`.

## Success Criteria
- Agent source code uses the production URL by default.
- Agent successfully reads `WARPATH_API_URL` if provided.
- `warpath-agent.exe` is updated and ready for download.
