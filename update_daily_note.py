from pathlib import Path
import sys
import re

# -------- CONFIG --------
YEAR = "2026"
INDEX_FILE = Path("index.html")
FULL_ARCHIVE = Path("2026/2026_full-archive.html")
MONTH_ARCHIVE = None  # inferred from filename
# ------------------------

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

def make_entry(y, m, d, title):
    return f'↳ {y}-{m}-{d} <a href="post.html?p=2026/{y}{m}{d}.txt">{title}</a>'

def insert_after_anchor(path, entry):
    text = path.read_text(encoding="utf-8").splitlines()
    if any(entry in line for line in text):
        fail(f"Entry already exists in {path}")

    for i in range(len(text) - 1):
        if text[i].strip() == "" and text[i+1].startswith("↳ 20"):
            text.insert(i+1, entry)
            path.write_text("\n".join(text), encoding="utf-8")
            return

    fail(f"Could not find insertion point in {path}")

def main():
    if len(sys.argv) != 2:
        fail("Usage: python3 update_daily_note.py YYYYMMDD")

    ymd = sys.argv[1]
    if not re.match(r"\d{8}", ymd):
        fail("Date must be YYYYMMDD")

    txt_path = Path(f"2026/{ymd}.txt")
    if not txt_path.exists():
        fail(f"{txt_path} not found")

    y, m, d, title = extract_title(txt_path)
    entry = make_entry(y, m, d, title)

    month_archive = Path(f"2026/{y}{m}_archive.html")

    for p in [INDEX_FILE, FULL_ARCHIVE, month_archive]:
        if not p.exists():
            fail(f"{p} not found")
        insert_after_anchor(p, entry)

    print("Daily note updated successfully.")

if __name__ == "__main__":
    main()