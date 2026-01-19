import os
from datetime import date, timedelta

# =========================
# CONFIG — YOU EDIT THIS
# =========================
YEAR = 2027
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
YEAR_DIR = os.path.join(BASE_DIR, str(YEAR))

# =========================
# SETUP
# =========================

os.makedirs(YEAR_DIR, exist_ok=True)

start = date(YEAR, 1, 1)
end = date(YEAR, 12, 31)
one_day = timedelta(days=1)

current = start

# =========================
# GENERATE FILES
# =========================

created = 0
skipped = 0

while current <= end:
    filename = current.strftime("%Y%m%d.txt")
    path = os.path.join(YEAR_DIR, filename)

    if os.path.exists(path):
        skipped += 1
    else:
        with open(path, "w", encoding="utf-8") as f:
            # minimal, neutral header — you own the content
            f.write(f"{current.strftime('%Y-%m-%d')} |\n\n")
        created += 1

    current += one_day

print(f"✓ Year {YEAR}: {created} files created, {skipped} already existed")