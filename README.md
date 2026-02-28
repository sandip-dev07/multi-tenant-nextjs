# Next.js Multi-Tenant Subdomain Web App

A multi-tenant, subdomain-based web application built with **Next.js v15+**, supporting isolated routing per subdomain with per-subdomain authentication.

---

## Live URLs

| URL | Route | Auth |
|-----|-------|------|
| `localhost:3000` | `app/main/` | ❌ Public |
| `app.localhost:3000` | `app/app/` | ✅ Required |
| `dash.localhost:3000` | `app/dash/` | ✅ Required |
| `acme.localhost:3000` | `app/tenant/[tenant]/` | Optional |

---

## Project Structure

```
├── app/
│   ├── app/                        # app.localhost:3000
│   │   ├── login/
│   │   │   └── page.tsx            # app.localhost:3000/login
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── dash/                       # dash.localhost:3000
│   │   ├── login/
│   │   │   └── page.tsx            # dash.localhost:3000/login
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── main/                       # localhost:3000 (public)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── tenant/
│   │   └── [tenant]/               # <anything>.localhost:3000
│   │       └── page.tsx
│   ├── globals.css
│   └── layout.tsx                  # Root layout
├── components/
│   └── SubdomainLink.tsx           # Cross-subdomain navigation
├── lib/
│   └── auth.ts                     # Auth utilities (swap for real auth)
├── proxy.ts                   # Subdomain router + auth guard
├── next.config.ts
└── .env.local
```

---

## How It Works

### 1. Subdomain Routing (proxy.ts)

Every request passes through `proxy.ts`, which reads the `host` header, extracts the subdomain, and **rewrites** the URL to the matching folder inside `app/`.

```
Request: app.localhost:3000/dashboard
  → extractSubdomain("app.localhost:3000") = "app"
  → rewrite to /app/dashboard
  → sets header x-subdomain = "app"
  → sets header x-pathname = "/dashboard"
```

```
Request: acme.localhost:3000/
  → extractSubdomain("acme.localhost:3000") = "acme"
  → rewrite to /tenant/acme/
  → sets header x-subdomain = "acme"
```

### 2. Auth Guard (proxy.ts)

Protected subdomains (`app`, `dash`) are checked on every request. If not authenticated, the middleware **rewrites** (not redirects) to that subdomain's own login page.

```
Request: app.localhost:3000/  (not authenticated)
  → PROTECTED.has("app") = true
  → isLoginPage("/") = false
  → rewrite to /app/login
  → x-pathname header set to "/login"
  → AppLayout sees x-pathname = "/login" → renders without sidebar
```

```
Request: app.localhost:3000/login  (not authenticated)
  → isLoginPage("/login") = true
  → passes through normally → login page renders
```

> **Rule:** Middleware is the single source of truth for auth. Layouts read `x-pathname` for display logic only — they never redirect.

### 3. Cross-Subdomain Navigation

`<Link>` from Next.js only works within the same origin. For cross-subdomain navigation (e.g. `localhost:3000` → `app.localhost:3000`), use the `SubdomainLink` component which:

- Prefetches the target page on mount
- Re-prefetches on hover / touch
- Shows a loading state on click

```tsx
import SubdomainLink from '@/components/SubdomainLink'

<SubdomainLink href="http://app.localhost:3000">
  Go to App
</SubdomainLink>
```

### 4. Reading Subdomain in Server Components

The middleware sets `x-subdomain` and `x-pathname` headers on every request, readable in any server component:

```tsx
import { headers } from 'next/headers'

export default async function Page() {
  const headersList = await headers()
  const subdomain = headersList.get('x-subdomain')  // "app" | "dash" | "acme" | "root"
  const pathname  = headersList.get('x-pathname')   // original path e.g. "/login"
}
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
# .env.local
NEXT_PUBLIC_ROOT_DOMAIN=example.com
```

### 3. Configure local subdomains

Add to `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):

```
127.0.0.1   app.localhost
127.0.0.1   dash.localhost
127.0.0.1   acme.localhost
127.0.0.1   nike.localhost
```

### 4. Run dev server

```bash
npm run dev
```

Visit:
- http://localhost:3000
- http://app.localhost:3000
- http://dash.localhost:3000

---

## Auth

Currently using a **demo auth stub** in `lib/auth.ts` for local development:

```ts
// lib/auth.ts
export const user = {
  session: {
    isAuthenticated: true,   // ← flip to false to test login redirect
    name: "Sandip",
    email: "xyz@gmail.com",
  },
}

export function getSession() {
  return user.session.isAuthenticated ? user.session : null
}
```

### Testing the auth redirect

1. Open `proxy.ts`
2. Change `const isAuthenticated = !!getSession()` to use a hardcoded `false`
3. Visit `http://app.localhost:3000` — you'll be redirected to the login page
4. The login page is at `http://app.localhost:3000/login`

### Swapping in real auth (Better Auth / NextAuth)

Replace `getSession()` in `lib/auth.ts` with your real session lookup. In `proxy.ts`, replace the `getSession()` call with a cookie/JWT check. The rest of the routing logic stays identical.

```ts
// proxy.ts — swap this line for real auth
const isAuthenticated = !!getSession()

// e.g. with Better Auth:
const session = await auth.api.getSession({ headers: req.headers })
const isAuthenticated = !!session
```

---

## Cross-Subdomain Cookie (Production)

For auth to work across all subdomains in production, set the cookie domain to the root domain with a leading dot:

```ts
cookies: {
  sessionToken: {
    options: {
      domain: `.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`, // .example.com
      // covers app.example.com, dash.example.com, etc.
    }
  }
}
```

In development, leave `domain` as `undefined` — cookies are scoped per-port automatically.

---

## Adding a New Subdomain

1. **Create the folder**

```
app/
└── newdomain/
    ├── login/
    │   └── page.tsx
    ├── layout.tsx
    └── page.tsx
```

2. **Add to middleware**

```ts
// proxy.ts
switch (subdomain) {
  case 'newdomain': rewriteBase = '/newdomain'; break  // ← add this
  ...
}
```

3. **Protect it (optional)**

```ts
const PROTECTED = new Set(['app', 'dash', 'newdomain'])  // ← add here
```

4. **Add to /etc/hosts**

```
127.0.0.1   newdomain.localhost
```

---

## Adding a New Tenant

Tenants are dynamic — no code changes needed. Just add the subdomain to `/etc/hosts` and it resolves to `app/tenant/[tenant]/page.tsx` automatically.

```
127.0.0.1   mynewclient.localhost
```

Visit `http://mynewclient.localhost:3000` — done.

To persist tenant data, update `getTenant()` in `app/tenant/[tenant]/page.tsx` with a real database lookup.

---

## Production Deployment (Vercel)

### DNS

Add a wildcard record in your DNS provider:

```
Type:  CNAME
Name:  *
Value: cname.vercel-dns.com
```

### Vercel Domains

In Vercel → Project → Settings → Domains, add:

```
example.com
*.example.com     ← wildcard covers all subdomains
```

### Environment Variables

Set in Vercel dashboard:

```
NEXT_PUBLIC_ROOT_DOMAIN = example.com
AUTH_SECRET             = <your-secret>
```

---

## Key Concepts Reference

| Concept | Location | Notes |
|---------|----------|-------|
| Subdomain extraction | `proxy.ts` → `extractSubdomain()` | Handles both dev and prod |
| URL rewriting | `proxy.ts` → `NextResponse.rewrite()` | Maps subdomain to app/ folder |
| Auth guard | `proxy.ts` → `PROTECTED` set | Add subdomain names here |
| Auth logic | `lib/auth.ts` → `getSession()` | Swap for real auth here |
| Subdomain in components | `headers().get('x-subdomain')` | Set by middleware |
| Cross-subdomain links | `components/SubdomainLink.tsx` | Never use `<Link>` across origins |
| next.config.ts | Image domains + env vars only | Routing belongs in middleware |

---

## FAQ

**Q: Why not use `<Link>` for cross-subdomain navigation?**  
Next.js `<Link>` only does client-side routing within the same origin. Across subdomains (different origins), it silently falls back to a full page navigation with zero prefetch benefit. Use `<SubdomainLink>` instead.

**Q: Why does middleware rewrite instead of redirect to `/login`?**  
A rewrite keeps the URL in the browser as `/` while rendering the login page — better UX. A redirect would visibly change the URL to `/login` and cost an extra round trip.

**Q: Why set `x-pathname` in middleware instead of reading `req.nextUrl.pathname` in the layout?**  
After a rewrite, `req.nextUrl.pathname` in the layout reflects the *rewritten* path (e.g. `/app/login`), not the original (e.g. `/login`). Middleware captures the original before rewriting.

**Q: Can I use `next.config.ts` rewrites instead of middleware?**  
Only for static, unconditional rules (e.g. proxying `/api/*` to an external service). Subdomain routing requires reading the `host` header at runtime, which `next.config.ts` rewrites cannot do.