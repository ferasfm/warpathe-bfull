# Plan: IP Blocking for Admin Access

Implement a security mechanism that blocks an IP address for 24 hours after 3 failed login attempts to the admin/manager pages.

## Database Changes

1.  **Create `public.login_attempts` table**:
    *   `id` (uuid, primary key)
    *   `ip_address` (text, not null)
    *   `attempt_time` (timestamp with time zone, default now())
    *   `is_successful` (boolean, default false)
2.  **Enable RLS** on `login_attempts`.
    *   `authenticated` and `anon` can `INSERT` (to record attempts).
    *   `service_role` has full access.
    *   Read access is restricted to `super_admin`.
3.  **Create a security function `check_ip_blocked(ip text)`**:
    *   Returns boolean.
    *   Checks if there are 3+ failed attempts from the given IP in the last 24 hours.

## Backend Changes

1.  **New Server Function `trackLoginAttempt`**:
    *   Records a failed or successful login attempt.
    *   Called from the client after `supabase.auth.signInWithPassword`.
2.  **New Server Function `checkIpStatus`**:
    *   Checks if the current request's IP is blocked.
    *   Uses `x-forwarded-for` or similar header to identify the client IP.

## Frontend Changes

1.  **Update `src/routes/auth.tsx`**:
    *   Before allowing the login form to submit, check if the IP is blocked.
    *   If blocked, show a clear message: "تم حظر هذا العنوان مؤقتاً بسبب محاولات دخول خاطئة متعددة. يرجى المحاولة بعد 24 ساعة."
    *   On failed login, call `trackLoginAttempt(ip, false)`.
    *   On successful login, call `trackLoginAttempt(ip, true)`.

## Technical Details

*   **IP Extraction**: In the server function handler, use `getRequest().headers.get('x-forwarded-for')` to get the client's IP.
*   **Database Grants**: Ensure `anon` can call the `check_ip_blocked` function or query the table for their own IP.
*   **Security**: Use `SECURITY DEFINER` for the database function to avoid permission issues when checking blocked status.

## Arabic Translation for UI
- Blocked message: "تم حظر الوصول من هذا الجهاز مؤقتاً لمدة 24 ساعة بسبب 3 محاولات دخول خاطئة."
