import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/*
'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            WARPATH — PHASE 03D

VISION, RECOVERY, COMMANDS AND LOGS DATABASE

Phase 03A, 03B and 03C are completed.

Implement ONLY the remaining database structures required for Vision, Recovery, Agent Commands, Agent Events and Audit Logs.

CREATE THESE TABLES:

1. vision_assets

Fields:

- id

- name

- asset_type

- storage_path

- version

- active

- created_at

- updated_at

2. vision_rules

Fields:

- id

- name

- asset_id

- configuration

- confidence_threshold

- active

- created_at

- updated_at

3. recovery_rules

Fields:

- id

- name

- trigger_type

- configuration

- priority

- active

- created_at

- updated_at

4. agent_commands

Fields:

- id

- agent_id

- device_id

- command_type

- payload

- status

- created_at

- started_at

- completed_at

- error_message

5. agent_events

Fields:

- id

- agent_id

- device_id

- event_type

- payload

- created_at

6. audit_logs

Fields:

- id

- user_id

- action

- entity_type

- entity_id

- metadata

- created_at

RELATIONSHIPS:

vision_assets

↓

vision_rules

agents

↓

agent_commands

↓

devices

agents

↓

agent_events

↓

devices

users

↓

audit_logs

REQUIREMENTS:

- Add proper foreign keys.

- Add useful indexes.

- Add appropriate unique constraints.

- Use JSON/JSONB for configuration and payload fields where appropriate.

- Add timestamps.

- Preserve existing database structure.

- Do not modify working Phase 01, Phase 02, 03A, 03B or 03C functionality.

SECURITY:

Preserve the existing authorization model.

SUPER_ADMIN:

Full access.

ADMIN:

Administrative access.

USER:

No access to Agent management, Vision configuration, Recovery configuration or Audit Logs unless explicitly authorized by existing security rules.

Apply appropriate RLS.

IMPORTANT:

This is DATABASE ONLY.

Do NOT implement:

- Windows Agent

- ADB

- MuMu

- Image Recognition

- AI

- Mission Engine

- Watchdog

- Recovery execution

- Command execution

- Screenshot

- UI

Do not create fake data except what is necessary for database validation.

TEST:

1. Migrations succeed.

2. Foreign keys work.

3. RLS works.

4. JSON fields work.

5. Existing database functionality remains intact.

6. Existing authentication and authorization remain intact.

7. Application builds successfully.

Update:

/docs/PROJECT_STATUS.md

Mark:

Phase 03D = COMPLETED

STOP after Phase 03D.
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

