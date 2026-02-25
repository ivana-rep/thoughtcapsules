# thoughtcapsules — Claude Code instructions

## Project structure
```
index.html                      ← homepage: nav + current-month entries (newest-first)
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
```
- First line is always `YYYY_MM_DD | Title` — this is what the indexing scripts read
- Nav lines are always the two lines shown above, immediately after the title
- `!!text!!` → highlight (use at most once per note, for the single key idea)
- `\ text` → blockquote line (each line of a quote gets its own `\ `)
- `[text](post.html?p=YYYY/YYYYMMDD.txt)` → internal link to another note

## Writing style (for editing raw text in step 2)
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

## Insertion rule (all three HTML files)
Insert before the first line starting with `↳ 20`.
If no such line exists yet (empty section), insert before `</pre>`, with one blank line above the new entry.
In `YYYY_full-archive.html`, add a blank line between months (between the last entry of one month and the first of the next).

---

## PROCESS 1 — Register note(s)

### Start of session
Ask: "Which date range are we working on?"
Work through notes one at a time, oldest to newest.

### For each note (steps 1–5)

**Step 1 — Raw text**
User provides the raw text.

**Step 2 — Edit**
Edit for clarity and style consistency (see Writing style above).
Present the edited version for review. Do not proceed until approved.

**Step 3 — Internal links**
Scan every `.txt` file across all years.
Identify notes whose topic genuinely connects to this one.
Propose specific link placements (word or phrase + target file) for approval.
Do not force links. If none are relevant, say so.

**Step 4 — Title**
Propose a title: short, concrete, not a summary — a handle for the idea.
Wait for approval or correction.

**Step 5 — Write file**
Write the final `YYYY/YYYYMMDD.txt` with:
- Header line: `YYYY_MM_DD | Approved title`
- Nav lines (two lines, exact format above)
- Blank line
- Final edited content

Then move to the next note.

### After all notes are written (steps 6–7)

**Step 6 — Update HTML indexes**
Notes are written ahead of time but published day by day.
- `YYYY_full-archive.html` and `YYYYmm_archive.html`: update immediately when notes are written.
- `index.html`: do NOT update here. It is updated separately each day as notes go live (see Daily index update below).

For full archive and monthly archive, process all dates oldest-to-newest:
  a. Insert entry into `YYYY/YYYY_full-archive.html` (add blank line between months)
  b. Insert entry into `YYYY/YYYYmm_archive.html`

**Daily index update (separate step, done on the day of publication)**
On the day a note goes live:
  a. **New month detection**: if this is the first note of a new month:
     - Remove all old month's `↳ YYYY-{old_MM}-` lines from the Current Month section
     - Check if the nav `<mark>` already points to the new month — move it if not
  b. Insert the day's entry into `index.html`
  c. Commit and push `index.html` alone.

**Step 7 — Review and push**
User reviews all changed files.
Then: `git add` relevant files, commit, `git push`.
Commit message: `update daily notes YYYYMMDD` or `update daily notes YYYYMMDD-YYYYMMDD` for a range.
