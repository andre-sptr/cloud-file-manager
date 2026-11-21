# Cloud File Manager (VPS File Hub)

## Architecture & Runtime
- Vite + React + shadcn/ui frontend + Node Express API (`server/index.js`).
- API managed via PM2 (`vps-file-hub-api`) bound to `127.0.0.1:3002`.
- Static frontend served via OpenResty (`https://cloud.andresptr.site`) from `/opt/1panel/apps/openresty/openresty/www/sites/cloud.andresptr.site/index`.

## Verification Commands
- Lint frontend: `npm run lint`
- Build frontend: `npm run build`
- Syntax-check API: `node --check server/index.js`

## Guardrails
- Keep API bound strictly to `127.0.0.1:3002`.
- Never commit secrets or credentials.
- Deploy built static `dist/` cleanly to the 1Panel site directory (`/opt/1panel/apps/openresty/openresty/www/sites/cloud.andresptr.site/index`).
