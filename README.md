# MrSuper Modern — New Node.js backend + original React design

**Status: source deliverable / local testing candidate; not production-certified.** This is a new directory; it does **not** overwrite or delete your old Laravel project, MySQL production data or Render deployment.

## What is included
- **Preserved:** old React 19 / Vite / Tailwind design, routes, customer dashboard and Admin views.
- **Replaced:** Laravel runtime with Fastify 5 / Node 22 and `mysql2` parameterized SQL.
- **Email:** mandatory 6-digit email code for newly registered users, hashed codes, 10-minute expiry, 5 tries, 60-second resend cooldown, real SMTP in production and Mailpit in local Docker.
- **Payments:** offline/manual HesabPay transfer, screenshot stored **privately**, manual Admin approve/reject, transactional entitlement grant, Join Telegram URL only returned for verified entitlements. Payment screenshots do **not** automatically verify money transfers.
- **Performance:** non-user-specific home/site-config cached for 30 seconds; one query for all course entitlements; bounded MySQL connection pool; no eight-second artificial retry delay in React. Deployment still requires a well-located DB / adequately provisioned server.
- **Access:** public course catalog remains public before and after login; `My Courses` shows purchased courses only, with browse link.
- **CMS:** courses, instructors, categories, bank accounts, banners, sections, theme, navigation, user management, support, receipt review, reports.

## Windows local quick-start
Requires Docker Desktop running, Docker Compose and an available `8089` and `8025` port.

1. Extract this ZIP to a **new** folder, e.g. `K:\projects\MrSuper-Modern`. **Do not extract over the old project.**
2. PowerShell inside this new folder:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
   ```
3. To create a login for an Admin, run this in an **interactive console**:
   ```powershell
   docker compose exec -it api node src/create-admin.js admin@example.com
   ```
   The command prompts for your password (it will be visible in the console; do not screen-share). Use a new email or a previously configured admin email.
4. For a **fake LOCAL** course and fake HesabPay receiving account:
   ```powershell
   docker compose exec -e ALLOW_LOCAL_DEMO=true api node src/seed-demo.js
   ```
5. Public site: http://localhost:8089  — Mailpit test email inbox: http://localhost:8025
6. Testing:
   ```powershell
   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check.ps1
   node .\tests\smoke.mjs
   ```
   If you don't have host Node 22 installed, use `docker compose exec api node --version` for version checking; the test is a **host-side** script since it contacts localhost ports.

## Essential functional acceptance
- Open `/courses` anonymously and when logged in. Both must list all published courses.
- Register: code arrives via Mailpit; unverified login is rejected; verify and confirm normal login.
- Select a paid course: `/api/public/courses/:slug` must **not** expose `join_url` before payment.
- Upload fake screenshot to fake HesabPay account, see `pending`; Admin verifies and approves; reload course, Join should now open Telegram. Test rejection and no access as well.
- Update course price/title and theme in Admin; verify public pages update after ~30 seconds.
- Profile, notifications, admin role security, reports, short video previews, support, password reset, logout, mobile RTL/English.

## Important production deployment checklist
1. Configure **real verified SMTP** (`SMTP_HOST/PORT/USER/PASSWORD/FROM`). Local Mailpit inbox is NOT an internet email provider.
2. Put **database and API in the same/near region**, enable TLS to database, use a paid/non-sleeping service for predictable response times. Cache does not solve distant DB latency by itself.
3. Run `node src/init-db.js` once on a staging DB: the script creates tables if missing; it does not drop/overwrite existing rows. Always BACK UP real DB before applying or migrating.
4. Do **not** use `seed-demo.js` against real data. Add the true receiving HesabPay account using Admin. Verify payment arrival independently from the uploaded screenshot.
5. Configure `COOKIE_SECURE=true`, `COOKIE_DOMAIN=.mrsuper1398.com` (if using separate subdomains), `CORS_ORIGINS=https://mrsuper1398.com`, `FRONTEND_URL=https://mrsuper1398.com`, a long random `SESSION_SECRET` and `OTP_SECRET`. Route `/api/`, `/sanctum/`, `/storage/` through HTTPS reverse proxy, or point Vite API origin to HTTPS backend.
6. Storage needs persistent disk/object storage. Transfer existing Laravel public media from `storage/app/public` to `storage/public`, and private receipts from `storage/app/private/receipts` to `storage/private/receipts` if preserving old data. Database content alone does not contain files or images.
7. Database old production users and their bcrypt hashes are supported; legacy accounts without an OTP pending record are not locked out. New registrations require email code.
8. Do not copy or publish development `.env`, test accounts, SMTP secrets, real receipts, existing backups, or API keys.
9. This archive was syntactically checked in the authoring environment; **Docker, MySQL and a real SMTP end-to-end run could not be completed here**. Complete the supplied local acceptance tests and staging load/security tests before production. Avoid switching production traffic until all checks pass.
10. A regular Telegram invite link can be shared by an enrolled learner; the site cannot revoke that independently. For strict control use limited/approved Telegram joins and admin moderation.

## Compatibility notes
- The old Laravel queue and webhook gateway are NOT included. Payments use **manual HesabPay transfer** only, as requested.
- No real production DB export, no files under the old Laravel storage volumes, and no SMTP credentials were present in the supplied ZIP. They must be migrated/configured separately.
- When moving into separate hosting, ensure frontend `VITE_API_ORIGIN` points at the correct API if not proxied same-origin. `frontend/src/api/client.js` already supports it.
- The old public homepage has 30-second cache; edits from other API instances may take up to 30 seconds to appear unless using shared Redis invalidation.
