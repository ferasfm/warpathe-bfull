import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/*
'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            WARPATH — PHASE 03E

DATABASE FINAL VALIDATION

Phases 03A, 03B, 03C and 03D are completed.

Do NOT create new features.

Do NOT redesign the database.

This phase is ONLY for validation and fixing confirmed database problems.

CHECK THE COMPLETE DATABASE:

1. Authentication and user roles

2. Accounts

3. Farms

4. Farm users

5. Resources

6. Resource assets

7. Fleets

8. Fleet assignments

9. Missions

10. Mission templates

11. Mission steps

12. Mission runs

13. Agents

14. Devices

15. Emulators

16. Vision assets

17. Vision rules

18. Recovery rules

19. Agent commands

20. Agent events

21. Audit logs

CHECK:

- Foreign keys

- Primary keys

- Unique constraints

- NOT NULL constraints

- Indexes

- Relationships

- RLS policies

- Role permissions

- Data isolation

- Cascade behavior

- Migration consistency

SECURITY TESTS:

USER must not be able to:

- access another user's farms

- modify another user's farms

- modify roles

- access Agent administration

- access Vision administration

- access Recovery administration

- modify Audit Logs

- modify System configuration

ADMIN must have the intended administrative access.

SUPER_ADMIN must have full administrative access.

IMPORTANT:

Do NOT implement:

- Windows Agent

- ADB

- MuMu

- Image Recognition

- AI

- Mission Engine

- Watchdog

- Recovery execution

- UI features

Only fix confirmed database/security problems.

Do not change working functionality unnecessarily.

After validation report:

DATABASE STATUS:

PASS / FAIL

SECURITY STATUS:

PASS / FAIL

RLS STATUS:

PASS / FAIL

RELATIONSHIPS:

PASS / FAIL

MIGRATIONS:

PASS / FAIL

BUILD:

PASS / FAIL

FIXES MADE:

...

REMAINING ISSUES:

...

Update:

/docs/PROJECT_STATUS.md

Set:

Phase 03 = COMPLETED

Next Phase = 04

STOP AFTER PHASE 03E.
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

