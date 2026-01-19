#!/usr/bin/env python3
from pathlib import Path

YEAR = 2027  # CHANGE THIS MANUALLY

ROOT = Path(".")
YEAR_DIR = ROOT / str(YEAR)
YEAR_DIR.mkdir(exist_ok=True)

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

      mark {{
        background: none;
        color: inherit;
        padding: 0 2px;
        background-image: linear-gradient(
          transparent 62%,
          var(--mark-light) 62%
        );
      }}

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

HTML_FOOT = """
</pre>
  </body>
</html>
"""

def write_file(path: Path, content: str):
    path.write_text(content, encoding="utf-8")

# YEARLY ARCHIVE (EMPTY)
yearly_content = (
    HTML_HEAD.format(title=f"/{YEAR}/Full Archive")
    + f"<mark>/{YEAR}/Full Archive</mark>\n"
    + f"↳ <a href=\"../index.html\">back to index</a>\n\n"
    + HTML_FOOT
)

write_file(YEAR_DIR / f"{YEAR}_full-archive.html", yearly_content)

# MONTHLY ARCHIVES (EMPTY)
for month in range(1, 13):
    mm = f"{month:02d}"

    monthly_content = (
        HTML_HEAD.format(title=f"/{YEAR}/{mm}/Archive")
        + f"<mark>/{YEAR}/{mm}/Archive</mark>\n"
        + f"↳ <a href=\"{YEAR}_full-archive.html\">back to full archive</a>\n"
        + f"↳ <a href=\"../index.html\">back to index</a>\n\n"
        + HTML_FOOT
    )

    write_file(YEAR_DIR / f"{YEAR}{mm}_archive.html", monthly_content)

print(f"Archives for {YEAR} generated (EMPTY, ready for update_daily_note.py).")
