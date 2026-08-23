import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/*
'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            WARPATH — PHASE 03C

AGENTS, DEVICES AND EMULATORS DATABASE

Phase 03A and Phase 03B are completed.

Implement ONLY the database structure for Windows Agents, devices, and MuMu emulator instances.

Create these tables:

1. agents

Fields:

- id

- name

- status

- version

- hostname

- last_heartbeat

- created_at

- updated_at

2. devices

Fields:

- id

- agent_id

- device_id

- name

- status

- created_at

- updated_at

3. emulators

Fields:

- id

- agent_id

- device_id

- name

- status

- resolution

- dpi

- assigned_farm_id

- created_at

- updated_at

Relationships:

Agent

↓

Devices

Agent

↓

Emulators

Farm

↓

Emulator

Requirements:

- Every device belongs to an Agent.

- Every emulator belongs to an Agent.

- An emulator may optionally be assigned to a Farm.

- device_id must identify the device correctly.

- Prevent invalid duplicate device relationships.

- Add foreign keys.

- Add useful indexes.

- Add appropriate unique constraints.

- Add created_at and updated_at.

Default MuMu configuration:

Resolution:

1012x800

DPI:

200

Store these values in the emulator records.

SECURITY:

Preserve the existing Phase 02 authorization.

SUPER_ADMIN:

Full access.

ADMIN:

Administrative access.

USER:

Must not access Agent, Device, or Emulator management data unless explicitly authorized later.

Apply appropriate RLS.

IMPORTANT:

This phase creates DATABASE STRUCTURE ONLY.

Do NOT implement:

- Windows Agent

- ADB

- MuMu integration

- ADB commands

- Device discovery

- Screenshot

- Image Recognition

- Mission Engine

- Watchdog

- Recovery

- AI

Do NOT create UI.

Do NOT modify existing working functionality.

Test:

1. Migration succeeds.

2. Foreign keys work.

3. Unique constraints work.

4. RLS works.

5. Existing Phase 01 and Phase 02 functionality still works.

6. Application builds successfully.

Update:

/docs/PROJECT_STATUS.md

Mark Phase 03C as completed.

STOP after Phase 03C.
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

