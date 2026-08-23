import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/*
'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            WARPATH — PHASE 03B

MISSION DATABASE

Phase 03A is completed.

Implement ONLY the Mission database structure.

Create these tables:

1. missions

Fields:

- id

- name

- description

- status

- version

- created_at

- updated_at

2. mission_templates

Fields:

- id

- mission_id

- version

- description

- status

- created_at

- updated_at

3. mission_steps

Fields:

- id

- mission_template_id

- step_order

- name

- step_type

- configuration

- timeout_ms

- retry_count

- created_at

- updated_at

The configuration field must support structured JSON.

4. mission_runs

Fields:

- id

- mission_id

- farm_id

- status

- started_at

- completed_at

- error_message

- created_at

Relationships:

Mission

↓

Mission Template

↓

Mission Steps

Mission

↓

Mission Runs

↓

Farm

Requirements:

- Add foreign keys.

- Add useful indexes.

- Prevent duplicate step_order inside the same mission template.

- Preserve existing Phase 02 security.

- Apply appropriate RLS.

- Normal users must only access mission data they are authorized to use.

- Admins can manage mission definitions.

Do NOT implement:

- Mission Engine

- ADB

- MuMu

- Windows Agent

- Image Recognition

- AI

- Watchdog

- Recovery

- Mission execution

Do NOT build UI in this phase.

Do NOT modify existing working functionality.

Test the database migration and constraints.

Update:

/docs/PROJECT_STATUS.md

Set the current progress to:

Phase 03B completed.

STOP after Phase 03B.
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

