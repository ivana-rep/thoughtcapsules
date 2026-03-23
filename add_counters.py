#!/usr/bin/env python3
"""Add day-of-year counters to all notes and HTML indexes."""

import os
import re
from datetime import date

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def is_leap_year(y):
    return (y % 4 == 0 and y % 100 != 0) or (y % 400 == 0)


def total_days(y):
    return 366 if is_leap_year(y) else 365


def day_of_year(yyyymmdd):
    y, m, d = int(yyyymmdd[:4]), int(yyyymmdd[4:6]), int(yyyymmdd[6:8])
    return date(y, m, d).timetuple().tm_yday


# --- 1. Update .txt files ---

for year in [2026, 2027]:
    year_dir = os.path.join(BASE_DIR, str(year))
    if not os.path.isdir(year_dir):
        continue
    total = total_days(year)
    for fname in sorted(os.listdir(year_dir)):
        if not re.match(r'\d{8}\.txt$', fname):
            continue
        if int(fname[:4]) != year:
            continue
        filepath = os.path.join(year_dir, fname)
        with open(filepath, 'r') as f:
            content = f.read()
        # Skip empty stubs
        if not content.strip():
            continue
        day = day_of_year(fname[:8])
        counter = f"{day}/{total}"
        # Skip if counter already present at end
        if content.rstrip('\n').endswith(counter):
            continue
        # Append blank line + counter
        content = content.rstrip('\n') + f"\n\n[{counter}]\n"
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"  txt: {fname}  →  {counter}")


# --- 2. Update HTML files ---
# Match: ↳ YYYY-MM-DD <a href="...YYYYMMDD.txt...">Title</a>
# Add:   [N/365] after </a>, only if not already present

ENTRY_RE = re.compile(
    r'(↳ \d{4}-\d{2}-\d{2} <a href="[^"]*(\d{8})\.txt[^"]*">[^<]*</a>)(?!\s*\[)'
)


def replace_entry(m):
    full = m.group(1)
    datestr = m.group(2)
    year = int(datestr[:4])
    day = day_of_year(datestr)
    total = total_days(year)
    return f"{full} [{day}/{total}]"


html_files = [
    os.path.join(BASE_DIR, "index.html"),
]
for year in [2026, 2027]:
    year_dir = os.path.join(BASE_DIR, str(year))
    if not os.path.isdir(year_dir):
        continue
    for fname in os.listdir(year_dir):
        if fname.endswith('.html'):
            html_files.append(os.path.join(year_dir, fname))
topics_dir = os.path.join(BASE_DIR, "topics")
if os.path.isdir(topics_dir):
    for fname in os.listdir(topics_dir):
        if fname.endswith('.html'):
            html_files.append(os.path.join(topics_dir, fname))

for filepath in sorted(html_files):
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r') as f:
        content = f.read()
    new_content = ENTRY_RE.sub(replace_entry, content)
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"  html: {os.path.relpath(filepath, BASE_DIR)}")

print("Done.")
