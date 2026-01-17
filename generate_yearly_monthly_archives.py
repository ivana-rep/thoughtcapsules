import os
from datetime import datetime
from collections import defaultdict

# =========================
# CONFIG — YOU EDIT THIS
# =========================
YEAR = 2026
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
YEAR_DIR = os.path.join(BASE_DIR, str(YEAR))

# =========================
# HTML TEMPLATES (FROZEN)
# =========================

HTML_HEAD = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>{title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light dark">
    <link rel="icon" type="image/jpeg" href="/thoughtcapsules/tcfavicon.jpg">

    <style>
      :root {{
        --bg: #ffffff;
        --fg: #111111;
        --link: #005bff;

        --mark-light: rgba(255, 241, 118, 0.9);
        --mark-dark: rgba(255, 235, 59, 0.9);
      }}

      @media (prefers-color-scheme: dark) {{
        :root {{
          --bg: #000000;
          --fg: #ffffff;
          --link: #8fc9ed;
        }}
      }}

      html, body {{ height: 100%; }}

      body {{
        margin: 0;
        background: var(--bg);
        color: var(--fg);
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
        line-height: 1.35;
        -webkit-font-smoothing: antialiased;
        padding: 16px;
      }}

      a, a:visited {{
        color: var(--link);
        text-decoration: none;
      }}

      a:hover {{ text-decoration: underline; }}

      pre {{
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
      }}

      /* LIGHT MODE — marker behind text (EXACTLY like index.html) */
      mark {{
        background: none;
        color: inherit;
        padding: 0 2px;
        background-image: linear-gradient(
          transparent 62%,
          var(--mark-light) 62%
        );
      }}

      /* DARK MODE — underline (EXACTLY like index.html) */
      @media (prefers-color-scheme: dark) {{
        mark {{
          background: none;
          padding: 0;
          color: var(--fg);
          text-decoration: underline;
          text-decoration-thickness: 2px;
          text-underline-offset: 0.15em;
          text-decoration-color: var(--mark-dark);
        }}
      }}
    </style>
  </head>

  <body>
<pre>
"""

HTML_FOOT = """</pre>
  </body>
</html>
"""

# =========================
# HELPERS
# =========================

def read_title(txt_path):
    with open(txt_path, "r", encoding="utf-8") as f:
        first = f.readline().strip()
    if "|" in first:
        return first.split("|", 1)[1].strip()
    return first


# =========================
# COLLECT NOTES
# =========================

notes_by_month = defaultdict(list)

for file in os.listdir(YEAR_DIR):
    if not file.endswith(".txt"):
        continue

    try:
        date = datetime.strptime(file[:8], "%Y%m%d")
    except ValueError:
        continue

    title = read_title(os.path.join(YEAR_DIR, file))
    notes_by_month[date.month].append((date, file, title))

# sort newest → oldest
for month in notes_by_month:
    notes_by_month[month].sort(reverse=True)

# =========================
# YEARLY ARCHIVE
# =========================

year_lines = []
year_lines.append(f"<mark>/{YEAR}/Full Archive</mark>")
year_lines.append("↳ <a href=\"../index.html\">back to index</a>\n")

for month in sorted(notes_by_month.keys(), reverse=True):
    for date, file, title in notes_by_month[month]:
        year_lines.append(
            f"↳ {date.strftime('%Y-%m-%d')} "
            f"<a href=\"../post.html?p={YEAR}/{file}\">{title}</a>"
        )
    year_lines.append("")  # blank line between months

year_html = (
    HTML_HEAD.format(title=f"/{YEAR}/Full Archive")
    + "\n".join(year_lines).rstrip()
    + "\n"
    + HTML_FOOT
)

with open(os.path.join(YEAR_DIR, f"{YEAR}_full-archive.html"), "w", encoding="utf-8") as f:
    f.write(year_html)

# =========================
# MONTHLY ARCHIVES
# =========================

for month in range(1, 13):
    lines = []
    lines.append(f"<mark>/{YEAR}/{month:02d}/Archive</mark>")
    lines.append(f"↳ <a href=\"{YEAR}_full-archive.html\">back to full archive</a>")
    lines.append("↳ <a href=\"../index.html\">back to index</a>\n")

    for date, file, title in notes_by_month.get(month, []):
        lines.append(
            f"↳ {date.strftime('%Y-%m-%d')} "
            f"<a href=\"../post.html?p={YEAR}/{file}\">{title}</a>"
        )

    html = (
        HTML_HEAD.format(title=f"/{YEAR}/{month:02d}/Archive")
        + "\n".join(lines)
        + "\n"
        + HTML_FOOT
    )

    with open(
        os.path.join(YEAR_DIR, f"{YEAR}{month:02d}_archive.html"),
        "w",
        encoding="utf-8",
    ) as f:
        f.write(html)

print(f"✓ Archives regenerated for {YEAR}")