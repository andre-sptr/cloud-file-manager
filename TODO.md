# Task: Update .gitignore for server/.env & remove from GitHub

## Steps:
- [x] Update .gitignore to add `server/.env`
- [x] Provide Git commands to remove server/.env from tracking if committed  
- [x] Verify changes
- [x] Mark complete

**Completed!** Run these commands to finalize:

```bash
git rm --cached server/.env 2>/dev/null || true
git add .gitignore
git commit -m "chore: ignore server/.env & remove from tracking"
git push origin main --force-with-lease
