"""
Rebuild Updated_185_Count_Sheet_BEK_v2.xlsx

KEY RULES:
  1. PRICE PER UNIT  = BEK_case_price  /  (first number in pack size)
  2. PRICE CHANGE comparison is ALWAYS per-unit vs per-unit:
       • For non-CASE units (BAG/TRAY/JUG/CAN/etc.)  → old price was already per-unit,
         so:  change = new_per_unit − old_price
       • For CASE units where old price ≈ case price   → old price was per-case;
         normalise:  old_per_unit = old_price / n,  change = (case_new − case_old) / n
       • For CASE units where old_price × n ≈ case_price → old was really per-unit
         (consistent with the sub-unit style), so:  change = new_per_unit − old_price
  3. Eggs special case:  1/30 DZN  = 12 flats of 30 eggs  → per flat = price/12
"""

import re, openpyxl
from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

SRC = "/root/.claude/uploads/b9ac3eaa-92f5-51b0-89b4-9426ae4e7ffd/db3c619f-Updated_185_Count_Sheet_BEK.xlsx"
OUT = "/home/user/Keith-s-Superdeli/Updated_185_Count_Sheet_BEK_v2.xlsx"

# ── STYLES ────────────────────────────────────────────────────────────────────
YELLOW = PatternFill("solid", fgColor="FFFF00")
RED_BG = PatternFill("solid", fgColor="FFC7CE")
GREEN  = PatternFill("solid", fgColor="C6EFCE")
GRAY   = PatternFill("solid", fgColor="D9D9D9")
BLUE   = PatternFill("solid", fgColor="4472C4")

thin = Side(border_style="thin", color="000000")
BDR  = Border(left=thin, right=thin, top=thin, bottom=thin)
bold = Font(bold=True)
ctr  = Alignment(horizontal="center", vertical="center", wrap_text=True)
lft  = Alignment(horizontal="left",   vertical="center", wrap_text=True)


# ── HELPERS ───────────────────────────────────────────────────────────────────
def first_n(pack_size):
    """Return the leading count from a pack string like '4/5 LB' → 4.0"""
    ps = str(pack_size).strip().upper()
    m  = re.match(r'^(\d+(?:\.\d+)?)\s*/', ps)
    if m:
        return float(m.group(1))
    m2 = re.match(r'^(\d+)', ps)
    return float(m2.group(1)) if m2 else 1.0


def calc_per_unit(unit_col, pack_size, case_price):
    """
    Returns (per_unit_price, label).
    Always = case_price / first_n(pack_size), with special cases for eggs.
    """
    if case_price is None:
        return None, "see label"
    ps  = str(pack_size).strip().upper() if pack_size else ""
    unt = str(unit_col).strip().title()  if unit_col  else "Case"

    # Eggs: 1/30 DZN = 12 flats per case
    if "DZN" in ps or ("DZ" in ps and re.search(r'/30', ps)):
        return case_price / 12.0, "per Flat (12 flats/case)"

    n = first_n(pack_size) if pack_size else 1.0
    if n <= 0: n = 1.0

    per = case_price / n
    return per, f"per {unt} ({pack_size})"


def detect_old_mode(unit_col, pack_size, case_price, old_price):
    """
    Returns 'per_unit' or 'per_case'.
    Uses ratio test for ALL unit types when n>1:
      - If old_price × n ≈ case_price → old was per-unit
      - If old_price ≈ case_price      → old was per-case
    Fallback: non-CASE → 'per_unit', CASE → 'per_case'
    """
    unt = str(unit_col).strip().upper() if unit_col else ""

    try:
        n = first_n(pack_size)
    except:
        n = 1.0

    if n <= 1:
        return "per_unit" if unt not in ("CASE", "") else "per_case"

    if old_price and case_price and old_price > 0 and case_price > 0:
        unit_diff = abs(old_price * n - case_price) / case_price
        case_diff = abs(old_price - case_price) / case_price
        if unit_diff < 0.15:   # old × n ≈ new_case → old was per-unit
            return "per_unit"
        if case_diff < 0.20:   # old ≈ new_case → old was per-case
            return "per_case"

    # fallback: non-CASE items were typically recorded per sub-unit
    fallback = "per_case" if unt in ("CASE", "") else "per_unit"

    # Sanity check for "per_unit" fallback: if pu_old would be implausibly large
    # relative to pu_new (> 5×), old price was probably per-case
    if fallback == "per_unit" and old_price and case_price and n > 1:
        pu_new = case_price / n
        if pu_new > 0 and old_price / pu_new > 5:
            return "per_case"

    return fallback


def price_change(unit_col, pack_size, case_price, old_price):
    """
    Returns (chg_dollar_per_unit, chg_pct) using normalised per-unit comparison.
    """
    if case_price is None or old_price is None or old_price == 0:
        return None, None

    n   = first_n(pack_size) if pack_size else 1.0
    pu_new = case_price / n if n > 0 else case_price

    mode = detect_old_mode(unit_col, pack_size, case_price, old_price)
    if mode == "per_unit":
        pu_old = old_price
    else:
        pu_old = old_price / n if n > 0 else old_price

    # Eggs override
    ps = str(pack_size).strip().upper() if pack_size else ""
    if "DZN" in ps or ("DZ" in ps and re.search(r'/30', ps)):
        pu_new = case_price / 12.0
        pu_old = old_price          # old was already per flat

    chg = pu_new - pu_old
    pct = chg / pu_old
    return chg, pct


def fill_color(chg, pct):
    if chg is None: return None
    if chg >  0.03:
        return RED_BG if (pct >= 0.10 or chg >= 2.00) else YELLOW
    if chg < -0.03:
        return GREEN
    return None


# ── LOAD SOURCE ───────────────────────────────────────────────────────────────
wb_src = load_workbook(SRC)
ws_src = wb_src["DELI COUNT"]
src_rows = [list(r) for r in ws_src.iter_rows(min_row=2, values_only=True)]

IDX = dict(UNIT=0, BEK_NUM=1, BEK_NAME=2, OLD_DESC=3, PACK=4, PAR=5,
           CASE_PRICE=6, OLD_PRICE=7, ON_HAND=12, TOTAL=13)

SKIP = {"LEGEND:", "PRICE INCREASE > $5.00", "PRICE INCREASE",
        "PRICE DECREASED", "NO CHANGE / NOT IN BEK LIST"}


# ── BUILD WORKBOOK ────────────────────────────────────────────────────────────
wb = openpyxl.Workbook()
ws = wb.active
ws.title = "DELI COUNT"

COLS = [
    ("UNIT",                         8),
    ("BEK ITEM #",                  10),
    ("PRODUCT DESCRIPTION\n(BEK NAME)", 42),
    ("OLD DESCRIPTION",             36),
    ("PACK / SIZE",                 14),
    ("PAR",                          5),
    ("BEK\nCASE PRICE",             13),
    ("OLD PRICE\n(per unit)",       13),
    ("PRICE CHG $\n(per unit)",     12),
    ("PRICE CHG %\n(per unit)",     11),
    ("PRICE PER UNIT\n(÷ pack qty)",14),
    ("UNIT LABEL",                  28),
    ("ON HAND",                     10),
    ("TOTAL",                       12),
    ("INV/ORD 1", 10), ("INV/ORD 2", 10),
    ("INV/ORD 3", 10), ("INV/ORD 4", 10), ("INV/ORD 5", 10),
]
for ci, (h, w) in enumerate(COLS, 1):
    c = ws.cell(row=1, column=ci, value=h)
    c.fill = GRAY; c.font = bold; c.alignment = ctr; c.border = BDR
    ws.column_dimensions[get_column_letter(ci)].width = w
ws.row_dimensions[1].height = 42
ws.freeze_panes = "A2"

dr = 2   # data row

for src in src_rows:
    unit       = src[IDX["UNIT"]]
    bek_num    = src[IDX["BEK_NUM"]]
    bek_name   = src[IDX["BEK_NAME"]]
    old_desc   = src[IDX["OLD_DESC"]]
    pack_size  = src[IDX["PACK"]]
    par        = src[IDX["PAR"]]
    case_price = src[IDX["CASE_PRICE"]]
    old_price  = src[IDX["OLD_PRICE"]]

    # ── Skip legend / totally blank rows ─────────────────────────────────────
    all_vals = [str(v) for v in src[:14] if v is not None and str(v).strip()]
    if not all_vals:
        continue
    if any(str(x) in SKIP for x in [unit, bek_name, bek_num] if x):
        continue

    # ── Imperial section header ───────────────────────────────────────────────
    if str(bek_num) in ("Imperial", "") and str(unit) in ("Imperial", "") \
            and (str(bek_name) or "").startswith("─"):
        c = ws.cell(row=dr, column=1,
                    value="─── IMPERIAL / LOCAL VENDORS (prices not in BEK) ───")
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = BLUE; c.alignment = ctr; c.border = BDR
        ws.merge_cells(start_row=dr, start_column=1,
                       end_row=dr, end_column=len(COLS))
        ws.row_dimensions[dr].height = 18
        dr += 1
        continue

    # ── Numeric cleanup ───────────────────────────────────────────────────────
    try:    cp = float(case_price) if case_price not in (None, "") else None
    except: cp = None
    try:    op = float(old_price)  if old_price  not in (None, "") else None
    except: op = None

    pu_price, pu_label = calc_per_unit(unit, pack_size, cp)
    chg_d, chg_pct     = price_change(unit, pack_size, cp, op)
    fill               = fill_color(chg_d, chg_pct)

    vals = [
        unit, bek_num, bek_name, old_desc, pack_size, par,
        cp, op,
        chg_d, chg_pct if chg_pct is not None else None,
        pu_price, pu_label,
        None,  # ON HAND
        None,  # TOTAL formula
        None, None, None, None, None,
    ]

    for ci, val in enumerate(vals, 1):
        c = ws.cell(row=dr, column=ci, value=val)
        c.border = BDR
        c.alignment = lft if ci in (3, 4, 12) else ctr
        if fill: c.fill = fill

        if ci == 7:   c.number_format = '$#,##0.00'
        elif ci == 8: c.number_format = '$#,##0.0000'
        elif ci == 9: c.number_format = '+$#,##0.0000;-$#,##0.0000'
        elif ci == 10:
            c.number_format = '+0.00%;-0.00%'
        elif ci == 11: c.number_format = '$#,##0.0000'
        elif ci == 14:
            c.value = f"={get_column_letter(13)}{dr}*{get_column_letter(7)}{dr}"
            c.number_format = '$#,##0.00'

    dr += 1

# ── LEGEND ────────────────────────────────────────────────────────────────────
dr += 1
ws.cell(row=dr, column=1, value="COLOR LEGEND").font = bold
legend = [
    (RED_BG, "RED    — Per-unit price UP  ≥ 10%  or  ≥ $2.00/unit"),
    (YELLOW, "YELLOW — Per-unit price increased (under threshold)"),
    (GREEN,  "GREEN  — Per-unit price decreased"),
    (None,   "WHITE  — No change  /  no BEK match"),
]
for i, (f, lbl) in enumerate(legend):
    r = dr + 1 + i
    c = ws.cell(row=r, column=1, value=lbl)
    if f: c.fill = f
    c.border = BDR; c.alignment = lft
    for cc in range(2, 5): ws.cell(row=r, column=cc).border = BDR

# ── COPY FOUNTAIN COUNT ───────────────────────────────────────────────────────
from copy import copy as _copy
ws_f_src = wb_src["FOUNTAIN COUNT"]
ws_f = wb.create_sheet("FOUNTAIN COUNT")
for row in ws_f_src.iter_rows():
    for cell in row:
        nc = ws_f.cell(row=cell.row, column=cell.column, value=cell.value)
        if cell.has_style:
            nc.font      = _copy(cell.font)
            nc.fill      = _copy(cell.fill)
            nc.border    = _copy(cell.border)
            nc.alignment = _copy(cell.alignment)
            if cell.number_format:
                nc.number_format = cell.number_format
for col in ws_f_src.column_dimensions:
    ws_f.column_dimensions[col].width = ws_f_src.column_dimensions[col].width
ws_f.freeze_panes = "A2"

wb.save(OUT)
print(f"✓ Saved: {OUT}")

# ── PRINT SUMMARY ─────────────────────────────────────────────────────────────
wb2 = load_workbook(OUT)
ws2 = wb2["DELI COUNT"]
up, dn, nc = [], [], []
for row in ws2.iter_rows(min_row=2, values_only=True):
    name = row[2]; chg = row[8]; pu = row[10]; op = row[7]
    if name and chg is not None:
        if   chg >  0.03: up.append((name, op, pu, chg))
        elif chg < -0.03: dn.append((name, op, pu, chg))
        else:             nc.append(name)

print(f"\n{'='*65}")
print(f"  PRICE INCREASES per unit  ({len(up)} items)")
print(f"{'='*65}")
for n,o,p,d in sorted(up, key=lambda x:-x[3]):
    print(f"  +${d:7.4f}/unit  old ${o:.4f} → new ${p:.4f}   {n}")

print(f"\n{'='*65}")
print(f"  PRICE DECREASES per unit  ({len(dn)} items)")
print(f"{'='*65}")
for n,o,p,d in sorted(dn, key=lambda x:x[3]):
    print(f"  -${abs(d):7.4f}/unit  old ${o:.4f} → new ${p:.4f}   {n}")

print(f"\n  NO CHANGE: {len(nc)} items")
