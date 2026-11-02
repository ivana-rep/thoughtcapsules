# thoughtcapsules — Claude Code instructions

## Project structure
```
index.html                      ← homepage: sidebar + tiles, then the current year's list (data block)
post.html                       ← single-note viewer (loads .txt via ?p= param)
archive.html                    ← the one archive page: year / month / topic filters (no data of its own)
tc.css, tc.js                   ← shared style and renderer for every page
assets/                         ← pixel tiles and avatar (tree)
yearly-archives.html            ← data only: one link per year (the search reads it); redirects to archive.html
topics.html                     ← data only: list of topic pages; redirects to archive.html#topics
topics/*.html                   ← data only: entries per topic; redirect to archive.html#<topic>
about.txt                       ← kept but no longer linked; post.html?p=about.txt redirects to index.html
YYYY/
  YYYY_full-archive.html        ← data only: all entries for the year; redirects to archive.html#YYYY
  YYYYmm_archive.html × 12     ← data only: per-month entries; redirect to archive.html#YYYY-MM
  YYYYMMDD.txt × 365            ← daily notes
```

## Page layout (since the November 2026 redesign)
- Every HTML file keeps its entry lines, in the same format as before, inside a hidden `<pre id="data" hidden>` … `</pre>` block. `tc.js` reads that block and builds the page. Nothing outside the block may contain a line starting with `↳ <a href="…post.html?p=`, so `update_daily_note.py` and the insertion rule below keep working unchanged.
- The archive, topic, month and year files are data files: opened in a browser they redirect to the matching view of `archive.html`, but they are still where entries get written.
- `index.html`'s data block still holds the month bar with `<mark>` on the current month and the `<span id="MM"></span>` anchors: the renderer reads the current month from the `<mark>`.
- Pages link `tc.css?v=N` / `tc.js?v=N` and the images use `?v=N`: raise N (in every page, and in `tc.css` for the images) when those files change, so browsers don't keep old copies.
- Design decisions: palette "ink and sage", the tiles and the tree avatar were made for this site; same fonts and structure as soul.

## Daily note file format
```
YYYY_MM_DD | Title
↳ [back to full archive](YYYY/YYYY_full-archive.html)
↳ [back to index](index.html)

Content here.

[N/365]

< [prev](post.html?p=YYYY/YYYYMMDD.txt) | [next](post.html?p=YYYY/YYYYMMDD.txt) >
```
- First line is always `YYYY_MM_DD | Title` — this is what the indexing scripts read
- Nav lines are always the two lines shown above, immediately after the title
- `!!text!!` → highlight (use at most once per note, for the single key idea)
- `\ text` → blockquote line (each line of a quote gets its own `\ `)
- `[text](post.html?p=YYYY/YYYYMMDD.txt)` → internal link to another note
- Last lines: blank line + `[N/365]` + blank line + `< [prev](...) | [next](...) >`
  - prev/next link to the calendar-adjacent days (files in YYYY/ dirs)
  - If no adjacent file exists, use plain text: `prev` or `next`

## Writing style
- Short entries: one sentence to a small paragraph. No padding.
- Every sentence earns its place. Cut anything that repeats or dilutes.
- Short, punchy sentences. Fragments are fine.
- Philosophical and introspective, direct without being preachy.
- Universal "you" for general truths; first person when personal.
- No hedging ("perhaps", "maybe", "one might say").
- No explicit conclusions or summaries — end when the idea is complete.
- No em-dashes mid-sentence. Slightly formal but not academic.
- Contrast and paradox are common structural devices.
- Do not add emphasis or highlights not present in the original intent.
- Final reader has no access to the source, so don't be too vague. Add context if necessary, link external trusted sources to provide additional possibility to go deeper.

## Entry link formats (for HTML indexing)
- In `index.html`: `↳ <a href="post.html?p=YYYY/YYYYMMDD.txt">YYYY-MM-DD</a> Title <span class="counter">[N/365]</span>`
- In archive files: `↳ <a href="../post.html?p=YYYY/YYYYMMDD.txt">YYYY-MM-DD</a> Title <span class="counter">[N/365]</span>`
- The link wraps the date, not the title.
- The `<span class="counter">` suffix is required on every entry (index, full-archive, month-archive, topics) — don't insert entries without it.

## Insertion rule (all HTML files)
Insert before the first line starting with `↳ <a href="` that points to a `post.html?p=` entry (i.e. the first daily-entry line, not a "back to..." nav line), in the relevant section.
If no such line exists yet (empty section), insert after the invisible anchor `<span id="MM"></span>`, with one blank line above the new entry.
In `YYYY_full-archive.html` and `index.html`, add a blank line between months.

## Helper scripts
- `update_daily_note.py YYYYMMDD` — reads `YYYY/YYYYMMDD.txt` (must already exist with its title line) and inserts the corresponding entry into `index.html`, `YYYY/YYYY_full-archive.html`, and `YYYY/YYYYmm_archive.html` in one call. It does **not** add the `<span class="counter">` suffix and does **not** touch `topics/*.html` — both still need to be done by hand (see Step 3 below).
- `add_counters.py` — a one-off backfill for old files that predate the counter convention; it scans the *entire* site (all years, all HTML including topics) for entries/files missing a counter and adds one. It is safe to re-run (idempotent) but **do not run it as part of the normal weekly publishing flow** — the counter is added manually/inline while writing each note and entry, not by running this script. Only run it deliberately, and review the diff before committing, since it can touch hundreds of files at once.
- `convert_pages.py` — moves a page's `<pre>` lines into the hidden data block and gives it the new layout (or the redirect, for archive/topic pages). Pages already converted are skipped. Run it after `generate_yearly_monthly_archives.py` creates a new year, since that script still writes pages in the old format. A new topic page must also be converted (or copied from an existing one) and listed in `topics.html`.

---

## PROCESS 1 — Register note(s)

### Start of session
User specifies the date range. Read all candidate entries from `/Users/amministrazioneviandante/Library/Mobile Documents/iCloud~md~obsidian/Documents/Ivana_Notes/capture/==writing-notes.md`.

### Step 1 — Present all drafts at once
For all notes in the range, present complete `.txt` files in final publication format in a single message:
- Edited content (see Writing style)
- Title: short, concrete, a handle for the idea
- Internal links embedded in the content
- Day-of-year counter `[N/365]`
- Nav prev/next links

Internal links: scan existing `.txt` files, embed the best genuine connections directly in the draft. Do not force links. Present all drafts together — no per-note approval steps.

Before drafting, run the values check described in `CLAUDE.local.md` (private, not in the repo).

Show the drafts as one simple HTML page in the scratchpad, opened with `open file.html`, not in the terminal: every `[text](url)` becomes `<a target="_blank">`, and site-relative links (e.g. `YYYY/YYYYMMDD.txt`, `post.html?p=...`) become absolute URLs on `https://thinkingcapsules.github.io/`.

Wait for approval or corrections before writing.

### Step 2 — Write files
After approval, write all `YYYY/YYYYMMDD.txt` files.
Format:
```
YYYY_MM_DD | Title
↳ [back to full archive](YYYY/YYYY_full-archive.html)
↳ [back to index](index.html)

Content.

[N/365]

< [prev](post.html?p=...) | [next](post.html?p=...) >
```

### Step 3 — Update HTML indexes
For each date, run `python3 update_daily_note.py YYYYMMDD` (oldest date first, so newest ends up on top) — it inserts the entry into `index.html`, `YYYY/YYYY_full-archive.html`, and `YYYY/YYYYmm_archive.html` in one call. Then, still per date:
  a. Add the `<span class="counter">[N/365]</span>` suffix by hand to the entry just inserted in all three files (the script doesn't add it)
  b. `topics/*.html` — insert into every relevant theme page, with the counter span included (NEVER skip)

**New month detection (for index.html)**
If adding the first entry of a new month:
  - Move the `<mark>` in the nav to the new month number
  - Add `<a href="#" class="top-link">[↳ top]</a>` to the now-closed month's anchor line
  - The current month never has `[↳ top]`

### Step 4 — Mark sources and push
  a. Mark used entries in `==writing-notes.md` as `- [x]`
  b. `git add` relevant files, commit, `git push`
  Commit message: `update daily notes YYYYMMDD` or `update daily notes YYYYMMDD-YYYYMMDD`
