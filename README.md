# VPS File Hub

A self-hosted file hosting and workspace management web application built with React, TypeScript, Express 5, and SQLite.

## Features

- **JWT & Google Authentication**: Register and sign in with email and password (minimum 8 characters, hashed with `bcryptjs`), or sign in / sign up with a Google account (`GOOGLE_CLIENT_ID`), persisted in SQLite.
- **Workspace Folders & Breadcrumbs**: Create folders and nested subfolders (up to depth 10), browse via accessible breadcrumb trails, rename or delete folders (files inside deleted folders are safely moved back to Root without breaking share links), upload directly into a target folder, and move files between folders.
- **Multi-File Upload**: Drag-and-drop or browse up to 10 files per batch (up to 15 MB per file) with destination folder selection, real-time upload progress, and cancellation support.
- **Server-Side File Validation**: Validates MIME types, extensions, and file signatures/content before storing files on disk (`server/uploads/`).
- **Private by Default**: Uploaded files are private (`is_public = 0`) and served only through authenticated endpoints (`/api/files/:id/content`), never exposed directly as static uploads.
- **Opt-In Public Sharing**: Enable or revoke public sharing links (`/f/:id`) per file from the workspace.
- **Search & Filter**: Scope searches inside the active folder subtree, filter files by type (`image`, `video`, `audio`, `document`), and preview images, video, and audio inline.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, React Dropzone, Lucide Icons
- **Backend**: Node.js, Express 5, SQLite3 (`server/data/database.sqlite` in WAL mode), Multer, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Helmet, `express-rate-limit`

## Prerequisites

- Node.js 20+ (18.11+ minimum; Node 20+ recommended)
- npm
- On Linux (if `sqlite3` prebuilt binaries are unavailable for your architecture): `build-essential` and `python3`

## Environment Configuration

Create `server/.env` from `server/.env.example`:

```env
PORT=3002
NODE_ENV=development
TRUST_PROXY=loopback
JWT_SECRET=replace-with-a-long-random-secret
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
GOOGLE_CLIENT_ID=
```

| Variable | Description |
| --- | --- |
| `PORT` | Port for the Express API server (default: `3002`). |
| `NODE_ENV` | `development` or `production`. |
| `TRUST_PROXY` | Proxy trust setting (`loopback` for local dev; `1` behind a single reverse proxy such as Nginx/OpenResty). |
| `JWT_SECRET` | **Required.** Long random secret used to sign JWT session tokens (generate with `openssl rand -hex 32`). |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed frontend origins (for example `https://files.example.com`). |
| `GOOGLE_CLIENT_ID` | Optional OAuth 2.0 Web Client ID for Google Sign-In. Leave empty to disable Google authentication. |

## Running Locally

> [!NOTE]
> Frontend (`npm run dev` on `:8080`) and backend (`server/` on `:3002`) run as two separate processes during development.

### 1. Start the Backend API (port `3002`)

```bash
cd server
npm install
npm run dev
```

*(If npm blocks native install scripts for `sqlite3`, review/approve with `npm install-scripts approve sqlite3` and re-run `npm install`. Never copy `node_modules` across different operating systems.)*

For production mode:

```bash
npm start
```

Health check endpoint: `GET http://localhost:3002/api/health`

### 2. Start the Frontend Dev Server (port `8080`)

In the project root:

```bash
npm install
npm run dev
```

Vite runs on `http://localhost:8080` and proxies `/api` requests to `http://localhost:3002`.

## Production Deployment (Ubuntu VPS + 1Panel / OpenResty)

Because the frontend uses relative API calls (`API_BASE = '/api'`) and Helmet sets `Cross-Origin-Resource-Policy: same-origin`, serve the built `dist/` bundle and proxy `/api` under the **same domain**.

### 1. Prepare Source & Build on the Server

Clone the repository into a persistent directory (for example `/opt/apps/cloud-file-manager`) and build directly on Ubuntu:

```bash
sudo mkdir -p /opt/apps
cd /opt/apps
git clone <YOUR_REPO_URL> cloud-file-manager
cd /opt/apps/cloud-file-manager

# Build frontend into dist/
npm ci
npm run build

# Install backend production dependencies (compiles/installs Linux sqlite3 bindings)
cd /opt/apps/cloud-file-manager/server
npm ci --omit=dev
```

Configure `/opt/apps/cloud-file-manager/server/.env`:

```env
PORT=3002
NODE_ENV=production
TRUST_PROXY=1
JWT_SECRET=<output-of-openssl-rand-hex-32>
ALLOWED_ORIGINS=https://files.example.com
GOOGLE_CLIENT_ID=<optional-google-client-id>
```

### 2. Run the Backend Process

Run the backend persistently with PM2 (or via **1Panel → Websites → Runtimes → Node.js**):

```bash
cd /opt/apps/cloud-file-manager/server
pm2 start index.js --name vps-file-hub-api
pm2 save
pm2 startup
```

Verify locally on the VPS:

```bash
curl http://127.0.0.1:3002/api/health
```

*(Do not expose port `3002` publicly in your VPS firewall; route traffic through OpenResty ports `80`/`443`.)*

### 3. Configure Website & Reverse Proxy in 1Panel (OpenResty)

1. Create a **Static Website** in 1Panel (**Websites → Create Website → Static Website**) for your domain (e.g., `files.example.com`).
2. Copy the contents of `dist/` into the site's document root (`index/`, not a symlink pointing outside OpenResty's mounted `/www` directory):

   ```bash
   sudo rsync -av --delete /opt/apps/cloud-file-manager/dist/ /opt/1panel/apps/openresty/openresty/www/sites/files.example.com/index/
   ```

3. In the website's **Reverse Proxy** tab, add a rule:
   - **Proxy Path**: `/api`
   - **Target URL**: `http://127.0.0.1:3002` *(without a trailing slash so `/api/...` paths are preserved; use the Docker bridge host IP such as `http://172.17.0.1:3002` if OpenResty runs in a bridge network and returns `502`)*
4. In the website's **Config** tab:
   - Set `client_max_body_size 160M;` (supports up to 10 × 15 MB batch uploads)
   - Add SPA fallback in `location /` (and remove `error_page 404 /404.html;`) so refreshing `/auth` or `/f/:id` works:

     ```nginx
     client_max_body_size 160M;
     proxy_set_header X-Forwarded-Proto $scheme;
     proxy_read_timeout 120s;
     proxy_request_buffering off;

     location / {
         try_files $uri $uri/ /index.html;
     }
     ```

5. Enable **Let's Encrypt SSL** and **HTTPS Redirect** in the **SSL** tab. If using Google Sign-In, add `https://files.example.com` to **Authorized JavaScript origins** in Google Cloud Console.

### 4. Persistent Data & Updating

Back up and never overwrite these paths in `server/`:
- `server/.env`
- `server/data/` (`database.sqlite`, `.sqlite-wal`, `.sqlite-shm`)
- `server/uploads/`

To deploy updates:

```bash
cd /opt/apps/cloud-file-manager
git pull
npm ci && npm run build
sudo rsync -av --delete dist/ /opt/1panel/apps/openresty/openresty/www/sites/files.example.com/index/

cd server
npm ci --omit=dev
pm2 restart vps-file-hub-api
```

## Verification Commands

Frontend checks (from project root):

```bash
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.node.json --noEmit
npm run build
```

Backend syntax checks (from `server/`):

```bash
node --check index.js
node --check database.js
node --check middleware/auth.js
node --check routes/auth.js
node --check routes/files.js
node --check routes/folders.js
```
