# Deployment configuration

Deploy the API before the browser client. The server routes are served under
`/api/v1`, including `POST /api/v1/auth/login` and `GET /api/v1/health`.

The client is a Vite single-page application using React Router. `vercel.json`
rewrites browser routes such as `/login` to `index.html`; keep this rewrite for
direct navigation and page refreshes on client-side routes.

## Server environment

Set these values on the API host:

```text
NODE_ENV=production
DATABASE_URL=<pooled PostgreSQL URL>
JWT_SECRET=<unique value with at least 32 characters>
CORS_ORIGINS=https://your-client.example.com
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
```

`CORS_ORIGINS` must contain the exact deployed client origin. Use a comma to
separate additional approved origins. The browser client and API use separate
origins, so production cookies require `SameSite=None; Secure`.

After deployment, verify the API with:

```text
GET https://your-api.example.com/api/v1/health
```

The expected response is `{ "status": "ok" }`.

## Client environment

Set this build-time value on the client host:

```text
VITE_API_URL=https://your-api.example.com
```

Do not set `VITE_API_BASE_URL=/api/v1` for a separately hosted client unless
that host has a reverse proxy for `/api`. The client appends `/api/v1` to
`VITE_API_URL`, so login requests reach the API at
`/api/v1/auth/login`.

## Password recovery

Password recovery is not deployed. The current server has no email provider or
password-reset token workflow, and the client directs users to their IT
administrator. Configure an approved email provider and add the reset-token
workflow before advertising self-service password resets.
