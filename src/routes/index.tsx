import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/*
'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            WARPATH — PHASE 03A

DATABASE CORE

Phase 01 and Phase 02 are completed.

Implement ONLY the database core for Phase 03.

Do not modify existing authentication or authorization.

Create these tables:

1. accounts

- id

- name

- status

- notes

- created_at

- updated_at

2. farms

- id

- account_id

- name

- status

- notes

- created_at

- updated_at

3. farm_users

- id

- farm_id

- user_id

- created_at

4. resources

- id

- name

- code

- status

- created_at

- updated_at

5. resource_assets

- id

- resource_id

- name

- storage_path

- version

- active

- created_at

- updated_at

6. fleets

- id

- farm_id

- fleet_number

- name

- status

- created_at

- updated_at

7. fleet_assignments

- id

- farm_id

- fleet_id

- resource_id

- enabled

- created_at

- updated_at

Create proper foreign keys and useful indexes.

Rules:

- A user can have multiple farms.

- A farm belongs to an account.

- A farm can have multiple fleets.

- A fleet can be assigned to a resource.

- Resource code must be unique.

- Fleet number must be unique within its farm.

- Duplicate farm-user assignments must be prevented.

Create initial resource records:

WHEAT

IRON

STEEL

Apply appropriate RLS without weakening the existing Phase 02 security.

Normal users may only access farms assigned to them.

Do NOT create UI for these tables yet.

Do NOT implement:

- Windows Agent

- ADB

- MuMu

- Vision

- AI

- Missions

- Watchdog

- Recovery

Do not delete existing functionality.

Test the migration and database constraints.

Update /docs/PROJECT_STATUS.md with the current progress.

STOP after Phase 03A.
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

