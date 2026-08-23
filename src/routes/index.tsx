import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/*
'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            WARPATH — PHASE 04A

ADMIN DASHBOARD

Phase 03 database architecture is fully completed and validated.

Now implement ONLY Phase 04A.

Do not implement Phase 04B or any later phase.

==================================================

OBJECTIVE

==================================================

Build the main Admin Dashboard using the existing database.

Do NOT create new database architecture unless absolutely required to fix a confirmed issue.

Do NOT modify existing authentication or RLS.

==================================================

ADMIN DASHBOARD

==================================================

The route is:

/admin

Create a professional administrative dashboard.

Show summary cards for:

- Total Users

- Total Accounts

- Total Farms

- Total Fleets

- Total Missions

- Total Agents

- Total Devices

- Total Emulators

Show operational status cards:

- Online Agents

- Offline Agents

- Active Missions

- Failed Missions

Show a recent activity section using existing audit/event data where appropriate.

Show a system status section:

Database

Authentication

Agents

Devices

Missions

Use clear status indicators.

==================================================

NAVIGATION

==================================================

The Admin sidebar should contain:

Dashboard

Users

Accounts & Farms

Resources & Fleets

Missions

Agents & Devices

Vision

Recovery

Logs

Settings

For this phase:

ONLY Dashboard is functional.

The other navigation items may be placeholders.

Do not implement their functionality yet.

==================================================

SECURITY

==================================================

Only:

SUPER_ADMIN

ADMIN

may access /admin.

USER must remain blocked.

Do not weaken the existing RLS or authorization.

==================================================

IMPORTANT

==================================================

Do NOT implement:

- Windows Agent

- ADB

- MuMu control

- Image Recognition

- AI

- Mission Engine

- Watchdog

- Recovery execution

- User management functionality

- Farm management functionality

- Resource management functionality

Those belong to later phases.

Do not delete existing functionality.

Do not redesign the entire application.

Use the existing WARPATH design system.

==================================================

ACCEPTANCE TESTS

==================================================

1. ADMIN can open /admin.

2. SUPER_ADMIN can open /admin.

3. USER cannot open /admin.

4. Dashboard statistics load from the database.

5. No fake statistics are used when real database data is available.

6. Dashboard does not expose unauthorized information.

7. Existing authentication works.

8. Existing RLS works.

9. Application builds successfully.

Update:

/docs/PROJECT_STATUS.md

Set:

Phase 04A = COMPLETED

Next Phase = 04B

STOP AFTER PHASE 04A.
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

