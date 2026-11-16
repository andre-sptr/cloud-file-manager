# VPS File Hub

A self-hosted file hosting and sharing web application built with React, TypeScript, Express 5, and SQLite.

## Features

- **JWT Authentication**: Register and sign in with email and password (minimum 8 characters, hashed with `bcryptjs`), or sign in/up with a Google account (`GOOGLE_CLIENT_ID`), persisted in SQLite.
- **Multi-File Upload**: Drag-and-drop or browse up to 10 files per batch (up to 15 MB per file) with real-time upload progress and cancellation support.
- **Server-Side File Validation**: Validates MIME types, extensions, and file signatures/content before storing files on disk (`server/uploads/`).
- **Private by Default**: Uploaded files are private (`is_public = 0`) and served only through authenticated endpoints (`/api/files/:id/content`), never exposed as static uploads.
- **Opt-In Public Sharing**: Enable or revoke public sharing links (`/f/:id`) per file from the dashboard.
- **Search & Filter**: Filter files by type (`image`, `video`, `audio`, `document`) or search by filename in the gallery, with inline preview for images, video, and audio.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, React Dropzone
- **Backend**: Node.js, Express 5, SQLite3 (`server/data/database.sqlite`), Multer, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, Helmet, `express-rate-limit`

## Prerequisites

- Node.js 18.11+ (Node 20+ recommended)
- npm

## Environment Configuration

Create `server/.env` from `server/.env.example`:

```env
PORT=3002
NODE_ENV=development
TRUST_PROXY=loopback
JWT_SECRET=replace-with-a-long-random-secret
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173
GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

## Running Locally

### 1. Start the Backend API (port `3002`)

```bash
cd server
npm install
npm run dev
```

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

In production, serve the built frontend (`dist/`) and proxy `/api` to the backend on the same origin (for example via Nginx or Caddy) so `Cross-Origin-Resource-Policy: same-origin` allows inline media previews cleanly.

## Verification Commands

```bash
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npm run build
```
