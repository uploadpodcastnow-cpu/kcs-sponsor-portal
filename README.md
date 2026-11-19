# KCS Sponsor Portal

The Kirk Cameron Show sponsorship board, embedded in Kirk's Assembly portal. It replaces Caleb's "Sponsorship Traffic Board" Claude artifact, which stays untouched.
This repo is separate from `tpu-report`.

## What's in it

| File | What it does |
|---|---|
| `app.js` | The whole portal: Month overview, Sponsors, Calendar, Tasks. Change the portal here; everyone gets the change the next time they open it. |
| `index.html` | Hosts `app.js` as a standalone page (GitHub Pages), for embedding by URL. |
| `apps-script/Code.gs` | The shared data store for the Assembly version: a Google Apps Script web app (in the uploadpodcastnow Google account) that keeps the board in the script's own storage plus the previous version. It needs no Drive access, so Google doesn't block it. Proof screenshots are added as links. |

There is **no sponsor data in this repo**. The data lives in the TPU Google Drive.

## Views (from the 11/18 Caleb + Miranda meeting)

- **Month**: one row per sponsor showing episodes, early, mid and late placements booked vs. bought, other deliverables, and task progress.
- **Sponsors**: a single "+ New sponsor" button that offers **Guided setup** or **Import from contract**. The detail view puts the **master tracking link** at the top, then this month's status, then "What they bought" (flexible, custom-friendly), then contacts. **+ Add booking** lets you pick the booking type and the person assigned, and optionally applies the package.
- **Calendar**: Monday to Friday only, with legends listing only the sponsors that month. Recorded episodes are marked ✱ with the date they were recorded, distinct from sponsor slots.
- **Tasks**: monthly, filtered by person, with overdue flags. Marking a task done asks for proof: a link, or a screenshot (pasting works).
- The header's **overdue** and **ending soon** counts are clickable.
- Inventory page removed. "Team" renamed to Tasks; team members are edited from the footer.

## Bringing over the old board

Footer → **Backup & import** → choose the backup downloaded from the old board. Everything carries over: sponsors, deals, contacts, colors, every placement with slot and format, recorded dates, bookings, all tasks with status, owner, due date and notes, the team, and deliverable types. The original backup file is also stored inside the portal (`archive`).

## Where the live board runs

The live board is the private Claude artifact **KCS Sponsorship Board**. Its data is in that artifact's shared database, already filled with everything from the old board. Share it with the TPU team from its Share menu. Changes can also be made by asking Claude in the TPU Sponsorship Acquisition project (see `CLAUDE.md`).

The Google Apps Script setup below is only needed if the board must run inside Assembly instead.

## Setup for Assembly (optional)

1. **Data store.** Signed in to the TPU Google account, go to script.google.com → New project and paste in `apps-script/Code.gs`. Run `setup` once and allow access. The log prints a key. Then Deploy → New deployment → Web app, set *Execute as: Me* and *Who has access: Anyone*, and copy the URL.
2. **Assembly.** Add a custom app or embed with:

```html
<div id="kcs-portal"></div>
<script>
  window.KCS_API_URL = "https://script.google.com/macros/s/…/exec";
  window.KCS_API_KEY = "…key from setup…";
</script>
<script src="https://cdn.jsdelivr.net/gh/uploadpodcastnow-cpu/kcs-sponsor-portal@main/app.js"></script>
```

If Assembly only takes a URL, turn on GitHub Pages for this repo and use
`https://uploadpodcastnow-cpu.github.io/kcs-sponsor-portal/#api=<URL>&key=<KEY>`

3. Open it, go to **Backup & import**, and import the old board's backup.

jsDelivr caches `@main` for up to 12 hours. After pushing a change, open
`https://purge.jsdelivr.net/gh/uploadpodcastnow-cpu/kcs-sponsor-portal@main/app.js` to update it right away.

Without `KCS_API_URL`, the portal runs in "this browser only" mode, which is useful for previews.
