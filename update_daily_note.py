from pathlib import Path
import sys
import re

# ---------- CONFIG ----------
YEAR = "2026"
INDEX_FILE = Path("index.html")
FULL_ARCHIVE = Path("2026/2026_full-archive.html")
# ----------------------------

def fail(msg):
    print(f"ERROR: {msg}")
    sys.exit(1)

def extract_title(txt_path):
    for line in txt_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            m = re.match(r"(\d{4})_(\d{2})_(\d{2})\s+\|\s+(.+)", line)
            if not m:
                fail("Title line must be 'YYYY_MM_DD | Title'")
            return m.groups()
    fail("No title line found")

def make_entry(y, m, d, title, prefix):
    return (
        f'↳ {y}-{m}-{d} '
        f'<a href="{prefix}post.html?p=2026/{y}{m}{d}.txt">{title}</a>'
    )

def insert_after_anchor(path, entry):
    lines = path.read_text(encoding="utf-8").splitlines()

    if any(entry in line for line in lines):
        fail(f"Entry already exists in {path}")

    for i in range(len(lines) - 1):
        # Insert after a blank line, before the first date entry
        if lines[i].strip() == "" and lines[i + 1].startswith("↳ 20"):
            lines.insert(i + 1, entry)
            path.write_text("\n".join(lines), encoding="utf-8")
            return

    fail(f"Could not find insertion point in {path}")

def main():
    if len(sys.argv) != 2:
        fail("Usage: python3 update_daily_note.py YYYYMMDD")

    ymd = sys.argv[1]
    if not re.fullmatch(r"\d{8}", ymd):
        fail("Date must be YYYYMMDD")

    txt_path = Path(f"2026/{ymd}.txt")
    if not txt_path.exists():
        fail(f"{txt_path} not found")

    y, m, d, title = extract_title(txt_path)

    index_entry = make_entry(y, m, d, title, "")
    archive_entry = make_entry(y, m, d, title, "../")

    month_archive = Path(f"2026/{y}{m}_archive.html")

    if not month_archive.exists():
        fail(f"{month_archive} not found")

    insert_after_anchor(INDEX_FILE, index_entry)
    insert_after_anchor(FULL_ARCHIVE, archive_entry)
    insert_after_anchor(month_archive, archive_entry)

    print("Daily note updated successfully.")

if __name__ == "__main__":
    main()