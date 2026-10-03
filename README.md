# Coding With Bashir

A learner-first coding platform for **Coding With Bashir**. Learners sign up or sign in, study published courses with authored lesson curricula, save progress to their own account, and receive a personalized certificate on genuine course completion. The public catalog contains no seeded/demo courses; a private Learning Admin workspace manages course publishing.

> **Deployment model:** the Next.js frontend is designed for **Vercel**; the Express API is designed for **Render**; **MongoDB Atlas** is the durable database. `render.yaml` describes the API service. The app can also run locally with a JSON preview store, but that store is not appropriate for production persistence.

## Contents

- [Project at a glance](#project-at-a-glance)
- [Technology and architecture](#technology-and-architecture)
- [Features and routes](#features-and-routes)
- [Admin roles and permissions](#admin-roles-and-permissions)
- [API specification](#api-specification)
- [Data model and persistence](#data-model-and-persistence)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Deploy the API to Render](#deploy-the-api-to-render)
- [Deploy the frontend to Vercel](#deploy-the-frontend-to-vercel)
- [Verification and operations](#verification-and-operations)
- [Security notes and current limitations](#security-notes-and-current-limitations)

## Project at a glance

| Area | Specification |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript, responsive CSS, Lucide icons |
| Backend | Node.js 22+, Express 5, Mongoose |
| Database | MongoDB Atlas or local MongoDB; local JSON fallback for development/preview |
| Frontend hosting | Vercel project rooted at `client/` |
| API hosting | Render Node web service rooted at `server/` |
| API prefix | `/api` |
| Public frontend-to-API path | Relative `/api/*`, proxied by the Next.js rewrite to `API_INTERNAL_URL` |
| Admin session | Signed 8-hour JWT in an HttpOnly, SameSite=Lax cookie; Secure in production |
| Admin password storage | Scrypt password hashes; plaintext passwords are not stored in MongoDB or returned by the API |
| Primary languages | TypeScript/TSX on the frontend; JavaScript ES modules on the backend |

## Technology and architecture

```text
Browser
  │  same-origin page and /api/* requests
  ▼
Vercel: Next.js app (client/)
  │  Next.js rewrite: /api/* → API_INTERNAL_URL/api/*
  ▼
Render: Express API (server/)
  │  Mongoose
  ▼
MongoDB Atlas
```

The browser uses relative API paths, so it does not need to know a private backend address. `client/next.config.ts` proxies those paths to the configured Render service. For local development, the rewrite target defaults to `http://127.0.0.1:4000`. On Vercel, the build deliberately fails if `API_INTERNAL_URL` is missing instead of silently producing a site pointed at localhost.

### Repository layout

```text
client/
  src/app/                 Next.js routes and metadata
  src/components/          Learning, admin, and shared UI
  src/lib/data.ts          Empty client-side collections; public learning content comes from the API
  src/lib/use-portfolio-collection.ts  API-backed content collection loader
  public/                  Hero art and downloadable resume
server/
  src/index.js             API entry point, startup, and graceful shutdown
  src/env.js               Loads server/.env before application modules
  src/app.js               Express app, public API, CORS, security headers
  src/admin.js             Admin API, validation, audit, RBAC
  src/admin-auth.js        Password hashing, JWT cookie, bootstrap owner
  src/models.js            Mongoose schemas
  src/storage.js           MongoDB and local preview persistence adapters
  src/data.js              Empty starter collections; no fabricated course content
  test/                    Node test-runner API and access-control tests
render.yaml               Render Blueprint for the API service
```

## Features and routes

### Learning platform routes

| Route | Purpose |
| --- | --- |
| `/` | Learning homepage with real course-catalog and learner-account states |
| `/courses` | Catalog of published courses that contain authored lessons |
| `/learn/[slug]` | Account-protected reader for the course author's actual lesson content |
| `/certificates` | Account-protected list of certificates earned by the signed-in learner |
| `/certificates/[slug]` | Private certificate detail with the learner's name, course mark, award date, and certificate ID |
| `/verify/[number]` | Public verification page for a real certificate award |
| `/dashboard` | Account-protected view of the learner's saved course progress |
| `/profile` | Private learner profile and profile-photo upload |
| `/login`, `/signup` | Learner account sign-in and registration |
| `/admin` | Private Learning Admin for course authoring and administration |

Legacy portfolio routes (`/about`, `/services`, `/resources`, `/projects`, `/blog`, `/contact`, and `/assistant`) redirect to `/courses`.

### Learning and publishing behaviour

- New visitors see a learning-platform homepage, not a prefilled Bashir learner account. Learners must sign up or log in before opening course lessons, their dashboard, profile, or earned certificates.
- Course progress is private and stored per learner. Completing every authored lesson awards one account-linked certificate that can be revisited, downloaded as PDF, and publicly verified by its real certificate ID.
- Certificate artwork follows the supplied parchment-and-navy reference with a geometric gold frame. It displays the learner's account name, actual course title and vector mark, award date, and certificate ID; it invents no instructor signature or placeholder details.
- The seeded/demo course catalog, sample portfolio projects/articles/testimonials, and sample certificates have been removed. A one-time MongoDB migration deletes the known demo rows and associated fake course progress; the local preview store filters these legacy examples too.
- Only courses with a nonempty authored curriculum appear in the learner catalog. Learning Admin requires 1–120 lesson blocks, each with a title and at least 20 characters of substantive lesson content. Lesson count and course-completion threshold come from that curriculum.
- Learner lesson pages render the saved course author's lesson content. They do not invent lesson titles, durations, player states, examples, or discussion copy.
- Profile-photo upload is available only from the signed-in Profile page. The admin course form stores vector icon names; it does not require downloaded course artwork.
- The app can run locally with an empty JSON preview store. MongoDB is required for durable production storage.

## Admin roles and permissions

There is **no public admin registration**. The first owner is bootstrapped from server environment variables. Owners can create additional team accounts from the admin workspace. Every protected admin API route independently checks the session and role; hiding a button in the UI is not used as an authorization control.

| Role | Dashboard | Read content | Edit content | Contact inbox | Manage team/roles | Audit trail |
| --- | --- | --- | --- | --- | --- | --- |
| `owner` | Yes | Yes | Yes | Yes | Yes | Yes |
| `admin` | Yes | Yes | Yes | Yes | No | Yes |
| `editor` | Yes | Yes | Yes | No | No | No |
| `support` | Yes | No | No | Yes | No | No |
| `viewer` | Yes | Yes | No | No | No | No |

The bootstrap owner is marked as environment-managed and cannot be demoted or disabled through the team UI. Change its email/password through Render environment variables. The API also prevents removing the last active owner. Admin events—including successful sign-ins, content changes, inbox status changes, and role updates—are written to the audit trail. Dashboard responses are role-filtered too: editors and viewers do not receive inbox counts or messages, and only owner/admin roles receive audit events.

### Admin workflow

1. Set `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` on the API host.
2. Start/redeploy the API. It creates or refreshes the environment-managed owner account.
3. Open `/admin` on the frontend and sign in with that account.
4. Use **Course management** to add a title, metadata, and the authored curriculum. The form requires 1–120 lessons, each with a title and at least 20 characters of content.
5. Use **Inbox** to review messages and move them through `new`, `read`, `replied`, or `archived`.
6. Use **Team & roles** to create accounts with a minimum 12-character password and least-privilege role. Accounts can be deactivated rather than deleted.

## API specification

All endpoints return JSON. Errors use `{ "error": "..." }`; field-validation errors may include a `fields` object. The API binds to `0.0.0.0` and honours the host-provided `PORT` value.

### Public endpoints

| Method | Path | Access | Behaviour |
| --- | --- | --- | --- |
| `GET` | `/api` | Public | API name, version, route summary |
| `GET` | `/api/health` | Public | Health, environment, and database mode; use for Render health checks |
| `GET` | `/api/projects` | Public | Project list; optional `?category=Web%20App&limit=20` |
| `GET` | `/api/courses` | Public | Course list; optional category/limit |
| `GET` | `/api/certificates` | Public | Certificate list; optional category/limit |
| `GET` | `/api/articles` | Public | Journal list; optional category/limit |
| `GET` | `/api/testimonials` | Public | Testimonial list; optional category/limit |
| `GET` | `/api/:collection/:slug` | Public | Single item lookup for a supported collection |
| `POST` | `/api/contact` | Public, rate-limited | Validates and stores a contact message |

Public list responses use `{ items, source }`, with source `mongodb` or `preview`. Course responses include the authored `curriculum` and accurate lesson count. The public `/api/certificates` collection is retained only for backward-compatible API consumers and is not used to show learner awards; learner certificates are generated and returned through the protected endpoints below. Contact input fields are `name`, `email`, `subject`, and `message`; the endpoint applies length limits, basic email validation, and an 8-submission/15-minute IP limit.

### Learner endpoints

The session cookie is HttpOnly, SameSite=Lax, Secure in production, and expires after 14 days. Signup requires a name, valid email, and password of at least 12 characters. Course progress and certificates are scoped to the signed-in learner.

| Method | Path | Access | Behaviour |
| --- | --- | --- | --- |
| `GET` | `/api/auth/session` | Public | Returns the safe learner session state |
| `POST` | `/api/auth/signup` | Public, rate-limited | Creates a learner account and signs it in |
| `POST` | `/api/auth/login` | Public, rate-limited | Verifies credentials and sets the HttpOnly learner cookie |
| `POST` | `/api/auth/logout` | Optional session | Clears the learner cookie |
| `GET` | `/api/learner/progress` | Learner | Lists only that learner’s course progress |
| `POST` | `/api/learner/courses/:slug/lessons/:lessonIndex/complete` | Learner | Saves a lesson completion; awards a unique certificate on course completion |
| `GET` | `/api/learner/certificates` | Learner | Lists certificates actually awarded to that learner |
| `GET` | `/api/learner/certificates/:identifier` | Learner | Returns the learner’s own certificate only |
| `GET` | `/api/verify/certificates/:certificateNumber` | Public | Confirms a real certificate number and returns only public award details |

### Admin endpoints

All endpoints except `/session`, `/login`, and `/logout` require a valid signed session cookie.

| Method | Path | Permission | Behaviour |
| --- | --- | --- | --- |
| `GET` | `/api/admin/session` | Public | Returns setup/authenticated state and the safe current-user profile |
| `POST` | `/api/admin/login` | Public, rate-limited | Verifies credentials and sets the HttpOnly session cookie |
| `POST` | `/api/admin/logout` | Optional session | Clears the session cookie and records sign-out when possible |
| `GET` | `/api/admin/overview` | Any signed-in role | Collection/message counts, weekly activity, recent inbox/activity |
| `GET` | `/api/admin/content/:collection` | Owner, admin, editor, viewer | Reads one content collection |
| `POST` | `/api/admin/content/:collection` | Owner, admin, editor | Creates a validated item |
| `PATCH` | `/api/admin/content/:collection/:id` | Owner, admin, editor | Updates an item by stable ID (or slug fallback) |
| `DELETE` | `/api/admin/content/:collection/:id` | Owner, admin, editor | Deletes an item |
| `GET` | `/api/admin/messages?status=new` | Owner, admin, support | Reads inbox messages; `status` supports `all`, `new`, `read`, `replied`, `archived` |
| `PATCH` | `/api/admin/messages/:id` | Owner, admin, support | Updates a message status |
| `GET` | `/api/admin/users` | Owner | Lists safe user fields and supported role names |
| `POST` | `/api/admin/users` | Owner | Creates a team account; body: `name`, `email`, `password`, `role` |
| `PATCH` | `/api/admin/users/:id` | Owner | Updates `name`, `role`, or `active` state |
| `GET` | `/api/admin/activity?limit=100` | Owner, admin | Reads recent audit events |

Legacy admin API collection names remain allowlisted for compatibility, but the Learning Admin interface exposes course management only. Course publishing requires 1–120 authored lessons; every lesson needs a title and at least 20 characters of content, and the API derives the lesson count from that curriculum. Slugs and field lengths are validated server-side, and Mongoose validators also run when MongoDB is active.

## Data model and persistence

Mongoose collections:

- **Project:** name, slug, category, short label, description, stack, visual variant/color, featured flag.
- **Course:** title, slug, category, level, lesson count (1–120), duration, description, icon/color.
- **Legacy portfolio certificate content (`Certificate`):** title, slug, category, issue date, level, code, color, description; it is not used as a learner award.
- **Learner:** unique normalized email, scrypt password hash, active state, last login.
- **LearnerProgress:** learner, course slug/title, completed lesson indexes, completion timestamp, awarded certificate reference; unique per learner/course.
- **LearnerCertificate:** learner, course and recipient snapshot, completed lesson count, unique certificate number, issue timestamp; unique per learner/course.
- **Article:** title, slug, category, display date, reading time, excerpt, optional plain-text article body, artwork variant.
- **Testimonial:** name, role, quote, initials, color.
- **ContactMessage:** name, email, subject, message, status (`new`, `read`, `replied`, `archived`).
- **AdminUser:** name, unique lower-case email, scrypt password hash, role, active state, creator, last login.
- **AdminAudit:** actor, action, entity, summary, safe metadata, timestamp.
- **SiteSetting:** small operational settings, including a one-time starter-content initialization marker.

There are no demo portfolio or course rows in the seed collections. The server records a one-time migration that removes known legacy demo courses, associated progress and sample certificate records, and portfolio-only demo collections. The local preview adapter stores content, messages, users, and audit entries in the ignored `server/data/store.json`, using atomic writes and a serialized mutation queue. `LOCAL_STORE_PATH` can point tests to an isolated temporary file.

Use MongoDB for any persistent deployment. The included Render Blueprint selects the paid `starter` web-service plan so the API does not spin down while idle; Render charges for paid compute, so review the current plan price before syncing or upgrading an existing service. The Blueprint setting does not change an already-created Render service until you sync/apply it. Free Render services can spin down, and the local filesystem is not durable storage. In development, the API remains usable with local preview data. In production, the health endpoint returns `503` and data routes fail closed until MongoDB is connected; no contact or learning-content writes are accepted into an ephemeral local file.

## Local setup

### Requirements

- Node.js **22 LTS** (Node 20.19+ is the minimum practical version for this dependency set; Node 22 is recommended).
- npm 10+.
- MongoDB is optional for a local visual preview; a local MongoDB or Atlas URI enables database persistence and admin-managed collections.

### Install and run

```bash
# From the repository root
npm ci
npm ci --prefix client
npm ci --prefix server

cp server/.env.example server/.env
cp client/.env.example client/.env.local
# Edit server/.env. Leave admin values blank to keep the admin workspace disabled.

npm run dev
```

- Next.js: `http://localhost:3000`
- Express API: `http://localhost:4000`
- API health: `http://localhost:4000/api/health`
- Admin route: `http://localhost:3000/admin`

To enable a local owner account, set a unique `JWT_SECRET` (at least 32 bytes), `ADMIN_EMAIL`, and a unique `ADMIN_PASSWORD` (at least 12 characters) in `server/.env`, then restart the API. Never copy real production secrets into a committed file.

## Environment variables

### API (`server/.env`, Render service)

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | Host supplies it on Render | Local default is `4000`; Render injects its own port |
| `NODE_ENV` | No | Use `production` on Render; enables Secure admin/learner cookies and disables localhost CORS origins |
| `MONGODB_URI` | Required in production | MongoDB connection string. `MONGO_URI` is accepted as a legacy alias |
| `FRONTEND_ORIGINS` | For direct cross-origin browser access | Comma-separated exact origins, e.g. `https://your-site.vercel.app,https://your-domain.example` |
| `CLIENT_ORIGIN` | Optional legacy alias | One exact allowed browser origin; `FRONTEND_ORIGINS` is preferred |
| `JWT_SECRET` | Required for learner and admin sessions | Random secret of at least 32 bytes. Keep private; rotating it signs both account types out |
| `ADMIN_EMAIL` | Required to bootstrap first owner | Owner email; changing it on the host updates the environment-managed owner at next start |
| `ADMIN_PASSWORD` | Required to bootstrap first owner | Unique 12+ character passphrase; changing it resets the bootstrap owner’s password on next start |
| `ADMIN_NAME` | No | Display name for the bootstrap owner |
| `LOCAL_STORE_PATH` | No | Local/testing JSON store path; do not rely on it for production persistence |

### Frontend (`client/.env.local`, Vercel project)

| Variable | Required | Description |
| --- | --- | --- |
| `API_INTERNAL_URL` | Optional on Vercel | Public HTTPS base URL for the Render API, without a trailing slash. Defaults to `https://coding-with-bashir-api.onrender.com` when building/running on Vercel; set this to override that service URL. |

`API_INTERNAL_URL` is read by Next.js server configuration and is not a `NEXT_PUBLIC_*` browser variable. It is no longer required to build on Vercel. In local development it defaults to `http://127.0.0.1:4000`.

## Deploy the API to Render

1. **Create MongoDB first.** Create a MongoDB Atlas database and a database user with access only to this app’s database. Configure Atlas network access for the Render service according to your plan/security policy.
2. **Create the Render service.** Connect the GitHub repository and use the included `render.yaml` Blueprint, or create a Node web service manually with root directory `server/`, build command `npm ci && npm run build`, start command `npm start`, health-check path `/api/health`, and a paid always-on plan. The Blueprint uses paid `starter` compute to stay awake without periodic wake-up requests. If you already have a free service, syncing the Blueprint or changing its plan is a separate deployment action and can incur charges; confirm Render's current pricing and the service plan before applying it. A free plan cannot guarantee always-on availability without inbound traffic.
3. **Set service secrets.** Provide `MONGODB_URI`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. `render.yaml` generates `JWT_SECRET`; keep the generated secret private. Set `ADMIN_PASSWORD` to a unique password with at least 12 characters.
4. **Set CORS origins.** Set `FRONTEND_ORIGINS` to the exact Vercel production origin(s), comma-separated if needed. Add exact preview origins only if you call the API directly from those browser origins. Do not use `*` with credentialed admin sessions.
5. **Deploy and inspect health.** `GET https://<render-service>.onrender.com/api/health` should return `ok: true` and `database: "mongodb"`. A `503` means persistent storage is not ready; check `MONGODB_URI`, Atlas network rules, and service logs before serving the frontend.
6. **Confirm admin bootstrap.** Render logs should report a connected database and a ready bootstrap owner. Admin registration is intentionally not public.

`server/src/index.js` listens on `0.0.0.0` and `process.env.PORT`, which Render requires. The listener starts while the required MongoDB connection is checked; production health and API routes remain unavailable until persistent storage is ready.

## Deploy the frontend to Vercel

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `client` and keep the Next.js framework preset. Build command: `npm run build`; install command: `npm ci`.
3. Optionally set `API_INTERNAL_URL` in Vercel to override the configured default Render API URL. The production build succeeds without this variable; on Vercel the rewrite defaults to `https://coding-with-bashir-api.onrender.com`.
4. Deploy. The Next.js rewrite proxies `/api/*` through Vercel to Render; browser code continues to use same-origin `/api` URLs. Do not hardcode `localhost`, a Render private address, or an API secret into client-side code.
5. Add the final Vercel domain to Render’s `FRONTEND_ORIGINS` if direct browser-to-API calls are introduced. The current UI uses the same-origin rewrite; exact CORS origins still provide the safe configuration for future direct calls.
6. Verify the Vercel site, `/api/health` through the Vercel domain, `/courses`. Publish an authored course from `/admin`, create a learner account, complete its lessons, and verify the progress and awarded certificate remain after signing out/in and after a redeploy. Also verify the bootstrap owner can sign in at `/admin`.

### Manual Vercel environment example

```text
API_INTERNAL_URL=https://coding-with-bashir-api.onrender.com
```

### Manual Render environment example

```text
NODE_ENV=production
MONGODB_URI=<private Atlas connection string>
FRONTEND_ORIGINS=https://your-vercel-project.vercel.app
JWT_SECRET=<random secret, 32+ bytes>
ADMIN_EMAIL=<private owner email>
ADMIN_PASSWORD=<unique 12+ character passphrase>
ADMIN_NAME=<owner display name>
```

Do not add real values to `.env.example`, `render.yaml`, README snippets, frontend variables prefixed with `NEXT_PUBLIC_`, or source control.

## Verification and operations

```bash
npm run build       # optimized Next.js production build
npm run typecheck   # TypeScript check
npm test            # API, learner-auth/progress/certificate, and admin/RBAC tests
npm --prefix server run build  # Render API syntax/build validation
npm run dev          # local API and frontend together
npm start            # local production server pair (build first)
```

The API test suite uses a temporary local store and does not write synthetic submissions into the normal preview data file. Useful production smoke checks:

```bash
curl -fsS https://<render-service>.onrender.com/api/health
curl -fsS https://<vercel-domain>/api/health
curl -i https://<vercel-domain>/api/admin/session
```

An unauthenticated admin session check should return a JSON setup/authentication state, not protected user data. Admin login attempts are rate limited. Contact submissions have a separate rate limit. MongoDB and API connection failures are visible in service logs.

## Security notes and current limitations

- Admin access is disabled until a valid `JWT_SECRET` and bootstrap owner credentials are configured.
- Learner and admin passwords use Node’s scrypt implementation with per-password random salts. Separate HttpOnly, SameSite=Lax cookies are Secure in production; learner sessions expire after 14 days and admin sessions after eight hours.
- There is no public admin signup, no wildcard credentialed CORS, and no role-only frontend security; API authorization is enforced server-side.
- The local JSON store is a development/preview fallback only. Production data routes return `503` until MongoDB is connected, rather than accepting writes to an ephemeral Render filesystem.
- Learner registration, sign-in, per-account course progress, and account-linked course-completion certificates are implemented. Course certificates carry the learner’s account name and a vector course mark; legacy awards resolve their mark from the course record. Learners can upload or remove a cropped profile photo only from the Profile page; photos are resized to JPEG before being stored privately on the account. Course lessons are authored through Learning Admin; no video player or AI assistant is presented as real course material. There is no hosted video backend, payment flow, or external AI provider.
- Learning Admin focuses on course metadata and authored curriculum. Large media uploads, email delivery, password-reset emails, and MFA/SSO are not included in this release.
- Before public production launch, configure real contact/social details, a custom domain, strong unique secrets, database backups, and a privacy/retention policy for contact messages.
