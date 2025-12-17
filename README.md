## Lead Generation Engine — Frontend

Central UI for the outreach workflow: manage sources, prospects, campaigns, and social posts, plus CSV imports.

### Architecture / API
- Frontend: this repo (Vite/React/TS).
- Backend: `/home/zax/apps/kalyanai-leads-gen-backend` (not modified here).
- API base path (from `src/api.ts`): `BASE_URL = "/leads-gen-api"`.
- Requirement: Nginx must proxy `/leads-gen-api/*` to the backend service (port/config handled outside this repo).

### Key API calls observed
- Sources: `GET/POST /sources`, `PATCH /sources/:id`, `POST /sources/:sourceId/prospects/bulk`.
- Prospects: `GET /prospects`, `GET /prospects/:id`, `POST /prospects`, `PATCH /prospects/:id`, notes (`GET/POST /prospects/:id/notes`), status updates, LeadDesk push.
- Campaigns & social posts: `GET /campaigns`, social posts CRUD/status, AI suggestions (`/ai/campaigns/:id/suggest-posts`).
- AI enrichment preview: `/ai/sources/:id/enrich-preview`.
- Health check assumed at `/health` (align with backend standard endpoints).

### CSV import (minimum viable fields)
- **Required:** company website/domain, work email.
- **Recommended:** company name, first name, last name, job title.
- **Optional:** LinkedIn URL, phone, size band/employee count, location (UK), industry/sub-industry.
- Column mapping note: current DB fields seen in use — `companyName`, `contactName`, `role`, `email`, `phone`, `website`, `tags`, `status`, `ownerName`.

### Safety
- Do not paste or commit secrets (.env contains sensitive values).
- Do not modify other apps or paths outside this repo.

### Roadmap (requested)
- Archive/restore flows and delete-from-archive.
- De-dupe by email/domain + suppression list.
- Confirm CSV import + ICP application + website checking flow.
