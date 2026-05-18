# thoughtcapsules — Claude Code instructions

## Project structure
```
index.html                      ← homepage: full year index with month anchors (newest-first)
post.html                       ← single-post viewer (loads .txt via ?p= param)
yearly-archives.html            ← links to each year's archives
about.txt
YYYY/
  YYYY_full-archive.html        ← all entries for the year, newest-first
  YYYYmm_archive.html × 12     ← per-month entries, newest-first
  YYYYMMDD.txt × 365            ← daily notes
```

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

## Entry link formats (for HTML indexing)
- In `index.html`: `↳ YYYY-MM-DD <a href="post.html?p=YYYY/YYYYMMDD.txt">Title</a>`
- In archive files: `↳ YYYY-MM-DD <a href="../post.html?p=YYYY/YYYYMMDD.txt">Title</a>`

## Insertion rule (all HTML files)
Insert before the first line starting with `↳ 20` in the relevant section.
If no such line exists yet (empty section), insert after the invisible anchor `<span id="MM"></span>`, with one blank line above the new entry.
In `YYYY_full-archive.html` and `index.html`, add a blank line between months.

---

## PROCESS 1 — Register note(s)

### Start of session
User specifies the date range. Read all candidate entries from `==writing-notes.md` in Obsidian.

### Step 1 — Present all drafts at once
For all notes in the range, present complete `.txt` files in final publication format in a single message:
- Edited content (see Writing style)
- Title: short, concrete, a handle for the idea
- Internal links embedded in the content
- Day-of-year counter `[N/365]`
- Nav prev/next links

Internal links: scan existing `.txt` files, embed the best genuine connections directly in the draft. Do not force links. Present all drafts together — no per-note approval steps.

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
Update all at once:
  a. `YYYY/YYYY_full-archive.html` — insert all entries (blank line between months)
  b. `YYYY/YYYYmm_archive.html` — insert all entries
  c. `topics/*.html` — insert into every relevant theme page (NEVER skip)
  d. `index.html` — insert all entries (update immediately unless user says otherwise)

**New month detection (for index.html)**
If adding the first entry of a new month:
  - Move the `<mark>` in the nav to the new month number
  - Add `<a href="#" class="top-link">[↳ top]</a>` to the now-closed month's anchor line
  - The current month never has `[↳ top]`

### Step 4 — Mark sources and push
  a. Mark used entries in `==writing-notes.md` as `- [x]`
  b. `git add` relevant files, commit, `git push`
  Commit message: `update daily notes YYYYMMDD` or `update daily notes YYYYMMDD-YYYYMMDD`
