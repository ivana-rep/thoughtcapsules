# moves each page's <pre> lines, unchanged, into <pre id="data" hidden> and gives the page the new layout.
# Safe to re-run: pages already converted are skipped. Run it after generate_yearly_monthly_archives.py
# creates a new year:  python3 convert_pages.py .
import re, sys
from pathlib import Path

SITE = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
DONE = 'id="data"'

HEAD = '''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <link rel="icon" type="image/png" href="/thoughtcapsules/tcfavicon.png?v=2" media="(prefers-color-scheme: light)">
  <link rel="icon" type="image/png" href="/thoughtcapsules/tcfavicon_dark.png?v=2" media="(prefers-color-scheme: dark)">
  <link rel="apple-touch-icon" sizes="180x180" href="/thoughtcapsules/apple-touch-icon.png?v=2">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="{pfx}tc.css?v=2">
  <script src="{pfx}tc.js?v=2"></script>
</head>
<body>
<main class="card{cls}" id="card"></main>
'''

def page(path, kind, cls='', data=None):
    s = path.read_text(encoding='utf-8')
    if DONE in s or 'TC.' in s:
        return
    title = re.search(r'<title>(.*?)</title>', s, re.S).group(1).strip()
    pfx = '../' * (len(path.relative_to(SITE).parts) - 1)
    out = HEAD.format(title=title, pfx=pfx, cls=cls)
    if data is None:
        inner = s[s.index('<pre>') + 5:s.index('</pre>')]
        data = inner.lstrip('\n')
    if data is not False:
        if not data.endswith('\n'):
            data += '\n'
        out += '<pre id="data" hidden>\n' + data + '</pre>\n'
    out += f'<script>TC.{kind}();</script>\n</body>\n</html>\n'
    path.write_text(out, encoding='utf-8')

# index: drop the old header and search lines, keep everything from the year link on
s = (SITE / 'index.html').read_text(encoding='utf-8')
if DONE not in s:
    inner = s[s.index('<pre>') + 5:s.index('</pre>')]
    start = re.search(r'^<a href="\d{4}/\d{4}_full-archive\.html">', inner, re.M).start()
    page(SITE / 'index.html', 'home', ' home', inner[start:])

REDIRECT = '''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{title}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <link rel="canonical" href="{target}">
  <script>location.replace('{target}');</script>
</head>
<body>
<p><a href="{target}">archive</a></p>
<!-- the lines below are still written by update_daily_note.py and read by archive.html -->
<pre id="data" hidden>
{data}</pre>
</body>
</html>
'''

def redirect(path, target):
    """keeps the entry lines as data and sends old links to the matching view of archive.html"""
    s = path.read_text(encoding='utf-8')
    if DONE in s:
        return
    title = re.search(r'<title>(.*?)</title>', s, re.S).group(1).strip()
    data = s[s.index('<pre>') + 5:s.index('</pre>')].lstrip('\n')
    if not data.endswith('\n'):
        data += '\n'
    path.write_text(REDIRECT.format(title=title, target=target, data=data), encoding='utf-8')

page(SITE / 'post.html', 'post', '', False)
if not (SITE / 'archive.html').exists():
    (SITE / 'archive.html').write_text(HEAD.format(title='archive · thinking capsules', pfx='', cls=' list') + '<script>TC.archive();</script>\n</body>\n</html>\n', encoding='utf-8')
redirect(SITE / 'topics.html', 'archive.html#topics')
redirect(SITE / 'yearly-archives.html', 'archive.html')
for p in sorted(SITE.glob('topics/*.html')):
    redirect(p, f'../archive.html#{p.stem}')
for p in sorted(SITE.glob('[0-9][0-9][0-9][0-9]/*_full-archive.html')):
    redirect(p, f'../archive.html#{p.parent.name}')
for p in sorted(SITE.glob('[0-9][0-9][0-9][0-9]/[0-9][0-9][0-9][0-9][0-9][0-9]_archive.html')):
    redirect(p, f'../archive.html#{p.stem[:4]}-{p.stem[4:6]}')
print('converted')
