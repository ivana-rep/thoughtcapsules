from pathlib import Path
import sys
import re

# ---------- CONFIG ----------
YEAR = "2026"
INDEX_FILE = Path("index.html")
FULL_ARCHIVE = Path(f"{YEAR}/{YEAR}_full-archive.html")
# ----------------------------

def fail(msg: str):
    print(f"ERROR: {msg}")
    sys.exit(1)

def extract_title(txt_path: Path):
    """
    Expects first non-empty line like:
    YYYY_MM_DD | Title
    """
    for line in txt_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            m = re.match(r"(\d{4})_(\d{2})_(\d{2})\s+\|\s+(.+)", line)
            if not m:
                fail("Title line must be 'YYYY_MM_DD | Title'")
            return m.groups()
    fail("No title line found")

def make_entry(y: str, m: str, d: str, title: str, prefix: str):
    """
    prefix:
      - ""   for root files (index.html) -> href="post.html?p=2026/20260131.txt"
      - "../" for files inside /YEAR      -> href="../post.html?p=2026/20260131.txt"
    """
    return (
        f"↳ {y}-{m}-{d} "
        f'<a href="{prefix}post.html?p={YEAR}/{y}{m}{d}.txt">{title}</a>'
    )

def insert_entry(path: Path, entry: str):
    lines = path.read_text(encoding="utf-8").splitlines()

    if any(entry == line for line in lines):
        fail(f"Entry already exists in {path}")

    # 1) Normal case: insert before the first date line (keeps newest-first order)
    for i, line in enumerate(lines):
        if line.startswith("↳ 20"):
            # Ensure a blank line before the list if needed
            if i > 0 and lines[i - 1].strip() != "":
                lines.insert(i, "")
                i += 1
            lines.insert(i, entry)
            path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            return

    # 2) Empty monthly archive case: insert before </pre>
    for i, line in enumerate(lines):
        if line.strip().lower() == "</pre>":
            # Keep one blank line between header links and entries
            if i > 0 and lines[i - 1].strip() != "":
                lines.insert(i, "")
                i += 1
            lines.insert(i, entry)
            path.write_text("\n".join(lines) + "\n", encoding="utf-8")
            return

    fail(f"Could not find insertion point in {path}")

def main():
    if len(sys.argv) != 2:
        fail("Usage: python3 update_daily_note.py YYYYMMDD")

    ymd = sys.argv[1]
    if not re.fullmatch(r"\d{8}", ymd):
        fail("Date must be YYYYMMDD")

    txt_path = Path(f"{YEAR}/{ymd}.txt")
    if not txt_path.exists():
        fail(f"{txt_path} not found")

    y, m, d, title = extract_title(txt_path)

    index_entry = make_entry(y, m, d, title, "")
    archive_entry = make_entry(y, m, d, title, "../")

    month_archive = Path(f"{YEAR}/{y}{m}_archive.html")
    if not month_archive.exists():
        fail(f"{month_archive} not found")

    insert_entry(INDEX_FILE, index_entry)
    insert_entry(FULL_ARCHIVE, archive_entry)
    insert_entry(month_archive, archive_entry)

    print("Daily note updated successfully.")

if __name__ == "__main__":
    main()