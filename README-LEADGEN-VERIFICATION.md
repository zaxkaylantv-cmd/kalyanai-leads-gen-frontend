## Lead Gen – Verification Notes

### Architecture + deployment facts
- Frontend targets `BASE_URL="/leads-gen-api"`.
- Live UI served at `/leads-gen/`.
- Deploy: `npm run build` then `sudo rsync -a --delete dist/ /usr/share/nginx/leads-gen-frontend/`.

### Verified working today
- Prospects view toggles: Active / Archived / Suppressed all load correctly.
- Archive / restore flows enforced; delete allowed only when the prospect is in Archived.
- CSV import maps common header variants (company/contact/email/phone/website) and requires at least one identifier to accept a row.
- Import Report card appears post-import, showing counts and a vendor-quality hint without changing the response body.
- CSV export of the current view includes enrichment columns.

### Vendor-quality workflow (step-by-step)
1) Create a Source per vendor/list.
2) Import a 20–50 row sample first.
3) Read the Import Report and interpret:
   - High duplicate email → likely recycled list.
   - High invalid → missing fields/garbage.
   - Low inserted vs received → poor quality.
   - Suppressed count → overlaps do-not-contact.
4) Only then import the full list.
5) Run enrichment and export best-fit rows for outreach.

### Known limitations / gotchas
- Phone numbers may appear in scientific notation if the CSV was opened/saved in Excel.
- Import currently sends only basic fields (company, contact, email, phone, website).
- UI does not yet offer “download skipped rows”.

### Safety rules
- Work in small, safe steps; back out if unsure.
- Never share secrets in chat.
- Back up the DB before risky changes.
