import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/*
'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            PHASE 01 VALIDATION / CORRECTION

Your previous response states that:

- Windows Agent

- ADB Integration

were implemented.

This is NOT allowed in Phase 01.

Phase 01 must contain ONLY the web application foundation.

Do the following:

1. Check the current codebase.

2. If Windows Agent or ADB integration was actually implemented, remove/revert those implementations.

3. Do NOT remove the general architecture placeholders/documentation if they are harmless.

4. Do NOT implement any real ADB communication.

5. Do NOT implement any Windows Agent functionality.

6. Do NOT implement MuMu integration.

Phase 01 must end with:

- React + TypeScript application

- Supabase connection

- Authentication foundation

- Basic dashboard

- Basic admin dashboard

- Protected routes

- Basic project structure

- /docs/PROJECT_STATUS.md

Nothing more.

After correction, report:

1. What was removed.

2. What remains.

3. Current routes.

4. Database changes.

5. Build/test result.

STOP.

Do not start Phase 02.
*/

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
    throw redirect({ to: "/auth" });
  },
});

