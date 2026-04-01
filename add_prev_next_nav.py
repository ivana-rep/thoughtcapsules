#!/usr/bin/env python3
"""Add < prev | next > navigation footer to written daily note txt files.

A file is considered "written" if it contains the back-to-archive nav line.
Stub files (future dates) are skipped.
Run again to update existing nav lines (idempotent).
"""

import re
from datetime import date, timedelta
from pathlib import Path

BASE_DIR = Path(__file__).parent
NAV_PATTERN = re.compile(r'< (?:\[prev\]\([^)]+\)|prev) \| (?:\[next\]\([^)]+\)|next) >')


def date_to_link_path(d):
    return f"{d.year}/{d.strftime('%Y%m%d')}.txt"


def date_to_file(d):
    return BASE_DIR / str(d.year) / f"{d.strftime('%Y%m%d')}.txt"


def make_nav_line(current_date):
    prev_date = current_date - timedelta(days=1)
    next_date = current_date + timedelta(days=1)

    prev_part = (
        f"[prev](post.html?p={date_to_link_path(prev_date)})"
        if date_to_file(prev_date).exists()
        else "prev"
    )
    next_part = (
        f"[next](post.html?p={date_to_link_path(next_date)})"
        if date_to_file(next_date).exists()
        else "next"
    )
    return f"< {prev_part} | {next_part} >"


def process_file(filepath, current_date):
    content = filepath.read_text(encoding="utf-8")

    if "↳ [back to full archive]" not in content:
        return "skipped"

    nav_line = make_nav_line(current_date)

    if NAV_PATTERN.search(content):
        new_content = NAV_PATTERN.sub(nav_line, content)
        if new_content != content:
            filepath.write_text(new_content, encoding="utf-8")
            return "updated"
        return "unchanged"

    new_content = content.rstrip("\n") + "\n\n" + nav_line + "\n"
    filepath.write_text(new_content, encoding="utf-8")
    return "added"


def main():
    date_re = re.compile(r"^(\d{4})(\d{2})(\d{2})\.txt$")

    files = []
    for year_dir in sorted(BASE_DIR.glob("[0-9][0-9][0-9][0-9]")):
        if not year_dir.is_dir():
            continue
        for f in sorted(year_dir.glob("[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9].txt")):
            m = date_re.match(f.name)
            if m:
                try:
                    d = date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
                    files.append((d, f))
                except ValueError:
                    pass

    files.sort(key=lambda x: x[0])

    counts = {"added": 0, "updated": 0, "skipped": 0, "unchanged": 0}
    for d, filepath in files:
        result = process_file(filepath, d)
        counts[result] += 1
        if result in ("added", "updated"):
            print(f"  {result}: {filepath.name}")

    print(
        f"\nDone: {counts['added']} added, {counts['updated']} updated, "
        f"{counts['skipped']} skipped (stubs), {counts['unchanged']} unchanged"
    )


if __name__ == "__main__":
    main()
