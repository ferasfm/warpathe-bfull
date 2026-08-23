import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/*
'''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
                                        
                                            
                                            WARPATH — PHASE 04C

ADMIN ACCOUNTS AND FARMS MANAGEMENT

Phase 04A and Phase 04B are completed.

Implement ONLY Phase 04C.

Do not implement Phase 04D or any later phase.

==================================================

OBJECTIVE

==================================================

Build the Admin interface for managing:

- Game Accounts

- Farms

- Farm/User assignments

Use the existing database created in Phase 03A.

Do not redesign the database.

Do not replace authentication or RLS.

==================================================

ROUTES

==================================================

Create:

/admin/accounts

/admin/farms

==================================================

ACCOUNTS

==================================================

Admin must be able to:

- View accounts

- Create account

- Edit account

- Enable/disable account

- Delete account only when safe

- Search accounts

- Filter by status

Account fields:

- Name

- Status

- Notes

- Created date

- Updated date

Do NOT store passwords or sensitive game credentials in plaintext.

==================================================

FARMS

==================================================

Admin must be able to:

- View farms

- Create farm

- Edit farm

- Enable/disable farm

- Delete farm only when safe

- Search farms

- Filter by status

Farm fields:

- Name

- Account

- Status

- Notes

- Created date

- Updated date

A farm MUST belong to an account.

The UI must allow selecting the parent account.

==================================================

USER ASSIGNMENT

==================================================

Implement the ability for an authorized Admin to assign users to farms.

Show:

Farm

Assigned Users

Allow:

- Add user

- Remove user

- View assigned users

A normal USER must only see farms assigned to them.

An ADMIN/SUPER_ADMIN may see farms according to existing administrative permissions.

==================================================

VALIDATION

==================================================

Prevent:

- Farm without an account.

- Duplicate farm/user assignment.

- Invalid account references.

- Invalid user references.

- Accidental deletion of an account that still has dependent farms unless the system safely handles it.

Use confirmation dialogs for destructive actions.

==================================================

SECURITY

==================================================

Preserve existing RLS.

All administrative operations must be authorized server-side.

Do not rely only on hiding buttons.

USER:

- Cannot access /admin/accounts.

- Cannot access /admin/farms.

- Cannot create or modify accounts.

- Cannot assign users to farms.

ADMIN:

- Can manage accounts and farms.

- Can assign normal users to farms.

- Cannot modify SUPER_ADMIN privileges.

SUPER_ADMIN:

- Full administrative access.

==================================================

IMPORTANT

==================================================

Do NOT implement:

- Resources

- Fleets

- Missions

- Agents

- MuMu

- ADB

- Image Recognition

- AI

- Watchdog

- Recovery

Those belong to later phases.

Do not modify unrelated existing functionality.

==================================================

ACCEPTANCE TESTS

1. Admin can create an account.

2. Admin can edit an account.

3. Admin can enable/disable an account.

4. Admin can view accounts.

5. Admin can search/filter accounts.

6. Admin can create a farm.

7. Farm requires an account.

8. Admin can edit a farm.

9. Admin can enable/disable a farm.

10. Admin can view farms.

11. Admin can search/filter farms.

12. Admin can assign a USER to a farm.

13. Admin can remove a USER from a farm.

14. Duplicate assignments are prevented.

15. USER can only see assigned farms.

16. USER cannot access Admin pages.

17. Existing authentication remains functional.

18. Existing RLS remains functional.

19. Application builds successfully.

Update:

/docs/PROJECT_STATUS.md

Set:

Phase 04C = COMPLETED

Next Phase = 04D

STOP AFTER PHASE 04C.
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

