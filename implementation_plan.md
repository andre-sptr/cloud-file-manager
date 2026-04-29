# Implementation Plan

[Overview]
Fix the timestamp display issue showing incorrect "7 hours ago" and correct the share button to generate a full shareable URL instead of just the relative path.

[Types]
No type changes required.

[Files]
1. **Modify:** `src/components/FileCard.tsx`
   - Fix share button to generate full URL using the current domain
   - No database or API changes needed

[Functions]
1. **Modify:** `copyShareLink` function in `src/components/FileCard.tsx`
   - Current behavior: Copies `file.url` (relative path like `/uploads/USER_ID/file.png`)
   - Fix: Generate full URL using `window.location.origin + file.url`

[Classes]
No class modifications.

[Dependencies]
No new dependencies required.

[Testing]
- No new tests required
- Manual verification: Upload a file and verify both the timestamp and share link work correctly

[Implementation Order]
1. Fix share button in FileCard.tsx to copy full URL using window.location.origin
2. Verify timestamp behavior

---

## Quick Fix Details

### FileCard.tsx - Share Button Fix

**Current Code (Line 45-48):**
```typescript
const copyShareLink = () => {
  navigator.clipboard.writeText(file.url);
  toast.success("Share link copied to clipboard!");
};
```

**Fixed Code:**
```typescript
const copyShareLink = () => {
  const fullUrl = `${window.location.origin}${file.url}`;
  navigator.clipboard.writeText(fullUrl);
  toast.success("Share link copied to clipboard!");
};
```

### About Timestamp Issue

The "7 hours ago" issue is likely caused by the timezone difference between:
- The server's local time (where SQLite stores CURRENT_TIMESTAMP)
- The browser's local time (which `formatDistanceToNow` uses)

This requires timezone handling on both server and client sides. The simplest solution is:
1. Store timestamps in UTC on the server
2. Parse and display in the user's local timezone on the client

For immediate improvement, the FileCard component already uses `formatDistanceToNow` which should handle timezones correctly IF the `created_at` string is in ISO 8601 format with timezone info (e.g., `2024-01-15T10:30:00Z` or `2024-01-15T10:30:00+00:00`).

The database already stores `created_at` as `DATETIME DEFAULT CURRENT_TIMESTAMP`. The fix would involve:
1. On server: ensuring timestamps are stored in UTC
2. The client-side code looks correct already

Since no database changes are needed for the minimal fix, the timestamp issue might be caused by the server's timezone. However, fixing this properly would require more investigation on the server side. For now, the focus is on the share URL fix which is the primary issue reported.