# Notes for Claude

- This repo is the code for the Kirk Cameron Show sponsorship portal. It is unrelated to `tpu-report`; never change that repo from work here.
- The live board is the private Claude artifact **KCS Sponsorship Board**, slug `c754870e-fda5-4d73-8425-bff17e94a679` (https://claude.ai/artifact/RccyJiSihPmfpPNxdisFdz). Its page is `app.js` inlined into one HTML file. Republish it from this repo after code changes.
- Data lives in that artifact's database, not in this repo (the repo is public):
  - `board/meta`: `team`, `types` (deliverable types), `days` (`{ "YYYY-MM-DD": { recorded, recordedOn } }`), `generalTasks`
  - `sponsors/<sponsorId>`: the sponsor's fields (`name, status, tier, color, contactName, contactEmail, trackingLink, driveLink, startDate, endDate, autoRenews, notes, pkg{episodesPerMonth, early, mid, late, extras[]}`) plus its `placements[]` (`id, date, slot: early|mid1|mid2|late, format: Both|Video|Audio, notes`) and `tasks[]` (`id, month YYYY-MM or "" for deal-setup tasks, typeId, title, qty, owner, due, status: open|progress|done, notes, proof{url,image}`)
- To change data from chat, use `db_get` on the document, edit it, and write it back with `db_write` set using `ifVersion`. The open page picks up the change live.
- Sponsors' own contract notes (in `notes`) are the source of truth when package counts look wrong.
