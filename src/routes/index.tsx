import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/*
'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            WARPATH — PHASE 04B

ADMIN USER MANAGEMENT

Phase 04A is completed.

Implement ONLY Phase 04B.

Do not implement Phase 04C or any later phase.

OBJECTIVE

Build the Admin Users management page.

Route:

/admin/users

Use the existing authentication, roles and RLS.

Do not replace the existing authorization system.

PAGE

Create a professional users table showing:

- User

- Email

- Role

- Status

- Created date

- Last activity if available

Add:

- Search

- Role filter

- Status filter

ROLE MANAGEMENT

Authorized administrators may manage normal USER accounts.

SUPER_ADMIN:

- Can manage ADMIN and USER roles.

- Can assign/remove ADMIN role.

- Can manage normal users.

ADMIN:

- Can manage USER accounts.

- Must NOT promote themselves.

- Must NOT create or assign SUPER_ADMIN.

- Must NOT modify SUPER_ADMIN.

USER:

- Cannot access this page.

SECURITY

All permission checks must be enforced server-side.

Do NOT rely only on hidden UI elements.

A user must not be able to manipulate requests to:

- change their own role

- promote themselves

- create SUPER_ADMIN

- modify unauthorized users

Preserve existing RLS.

USER STATUS

Allow authorized administrators to disable/enable normal USER accounts if supported safely by the existing authentication architecture.

Do not break Supabase authentication.

Do NOT implement:

- Accounts

- Farms

- Resources

- Fleets

- Missions

- Agents

- MuMu

- ADB

- Vision

- AI

- Recovery

Those belong to later phases.

Do not modify unrelated functionality.

ACCEPTANCE TESTS

1. Admin can open /admin/users.

2. User cannot open /admin/users.

3. Users are loaded from the database.

4. Search works.

5. Role filter works.

6. Status filter works.

7. SUPER_ADMIN can manage ADMIN and USER roles.

8. ADMIN can manage USER roles only.

9. ADMIN cannot promote themselves.

10. ADMIN cannot create SUPER_ADMIN.

11. USER cannot modify roles through API requests.

12. RLS remains functional.

13. Build succeeds.

Update:

/docs/PROJECT_STATUS.md

Set:

Phase 04B = COMPLETED

Next Phase = 04C

STOP AFTER PHASE 04B.
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

