"""
Rebuild Updated_185_Count_Sheet_BEK_v2.xlsx

KEY RULES:
  1. CASE unit  → PRICE PER UNIT = BEK case price (no division; case IS the unit)
     non-CASE   → PRICE PER UNIT = BEK_case_price / (first number in pack size)
  2. PRICE CHANGE: compare new per-unit vs old per-unit (normalised)
  3. Eggs special case:  1/30 DZN  = 12 flats of 30 eggs  → per flat = price/12
  4. Rows with no BEK item number → dark stop-sign red
  5. Rows with BEK# not found in current PDF → re-match by name; if still no match → orange-red
"""

import re, openpyxl, fitz
from difflib import SequenceMatcher
from openpyxl import load_workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from openpyxl.utils import get_column_letter

PDF = "/root/.claude/uploads/b9ac3eaa-92f5-51b0-89b4-9426ae4e7ffd/99af206d-Shared_List_2.pdf"
SRC = "/root/.claude/uploads/b9ac3eaa-92f5-51b0-89b4-9426ae4e7ffd/db3c619f-Updated_185_Count_Sheet_BEK.xlsx"
OUT = "/home/user/Keith-s-Superdeli/Updated_185_Count_Sheet_BEK_v2.xlsx"

# ── PARSE BEK PDF ──────────────────────────────────────────────────────────────
def parse_bek_pdf(pdf_path):
    """Returns dict: item_num -> {name, pack, price}"""
    items = {}
    with fitz.open(pdf_path) as pdf:
        full_text = "\n".join(page.get_text() for page in pdf)
    lines = [l.strip() for l in full_text.split('\n') if l.strip()]
    i = 0
    while i < len(lines):
        if re.fullmatch(r'\d{5,7}', lines[i]):
            item_num = lines[i]
            name_parts, j = [], i + 1
            while j < len(lines):
                ln = lines[j]
                if re.fullmatch(r'\d{5,7}', ln): break
                if re.match(r'^\d+\s*/\s*\d', ln): break
                if re.match(r'^\$[\d,]+\.\d{2}', ln): break
                if ln.startswith('BEK Entrée:') or ln in ('Item','Name','Brand'): break
                name_parts.append(ln)
                j += 1
            price, pack = None, None
            for k in range(i+1, min(i+12, len(lines))):
                if re.match(r'^\$[\d,]+\.\d{2}', lines[k]):
                    try: price = float(lines[k].replace('$','').split()[0].replace(',',''))
                    except: pass
                if pack is None and re.match(r'^\d+\s*/\s*\d', lines[k]):
                    pack = lines[k]
            name = ' '.join(name_parts[:2]).strip()
            items[item_num] = {'name': name, 'pack': pack, 'price': price}
            i = j
        else:
            i += 1
    return items

BEK = parse_bek_pdf(PDF)
print(f"Loaded {len(BEK)} BEK items from PDF")

def _norm(s):
    return re.sub(r'[^a-z0-9 ]', '', str(s).lower().strip())

def _name_sim(a, b):
    """Name similarity: max of sequence ratio and sorted-token ratio."""
    na, nb = _norm(a), _norm(b)
    seq = SequenceMatcher(None, na, nb).ratio()
    # sorted-token: handles "Salt Garlic" vs "Garlic Salt"
    ta = ' '.join(sorted(na.split()))
    tb = ' '.join(sorted(nb.split()))
    tok = SequenceMatcher(None, ta, tb).ratio()
    # word-overlap: fraction of sheet words found in PDF name
    words_a = set(na.split())
    words_b = set(nb.split())
    if words_a:
        overlap = len(words_a & words_b) / len(words_a)
    else:
        overlap = 0.0
    return max(seq, tok, overlap)

def fix_leading_zeros(bek_str):
    """If bek_str is all-digits, try zero-padded variants to find PDF match."""
    if re.fullmatch(r'\d+', bek_str):
        for width in (5, 6, 7):
            padded = bek_str.zfill(width)
            if padded in BEK:
                return padded
    return None

def find_best_bek_match(name):
    """Find best BEK item by name similarity. Returns (item_num, score) or (None, 0)."""
    n = _norm(name)
    best_num, best_score = None, 0.0
    for num, info in BEK.items():
        score = SequenceMatcher(None, n, _norm(info['name'])).ratio()
        if score > best_score:
            best_score, best_num = score, num
    return (best_num, best_score) if best_score >= 0.72 else (None, 0.0)

# ── STYLES ────────────────────────────────────────────────────────────────────
YELLOW    = PatternFill("solid", fgColor="FFFF00")
RED_BG    = PatternFill("solid", fgColor="FFC7CE")
GREEN     = PatternFill("solid", fgColor="C6EFCE")
GRAY      = PatternFill("solid", fgColor="D9D9D9")
BLUE      = PatternFill("solid", fgColor="4472C4")
MISMATCH   = PatternFill("solid", fgColor="FFCC0000")   # stop-sign red — no BEK match
white_bold = Font(bold=True, color="FFFFFF")

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
    CASE unit → price IS the case price (no division).
    Other units → case_price / first_n(pack_size).
    """
    if case_price is None:
        return None, "see label"
    ps  = str(pack_size).strip().upper() if pack_size else ""
    unt = str(unit_col).strip().upper()  if unit_col  else "CASE"

    # CASE unit: the BEK case price is the per-unit price — no division
    if unt in ("CASE", ""):
        return case_price, f"per Case ({pack_size})"

    # Eggs: 1/30 DZN = 12 flats per case
    if "DZN" in ps or ("DZ" in ps and re.search(r'/30', ps)):
        return case_price / 12.0, "per Flat (12 flats/case)"

    n = first_n(pack_size) if pack_size else 1.0
    if n <= 0: n = 1.0

    per = case_price / n
    return per, f"per {unt.title()} ({pack_size})"


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
    CASE unit: pu_new = case_price, compare directly to old_price (also per case).
    Other units: pu_new = case_price / n; old normalised via detect_old_mode.
    """
    if case_price is None or old_price is None or old_price == 0:
        return None, None

    unt = str(unit_col).strip().upper() if unit_col else "CASE"
    n   = first_n(pack_size) if pack_size else 1.0
    if n <= 0: n = 1.0

    # Eggs override
    ps = str(pack_size).strip().upper() if pack_size else ""
    if "DZN" in ps or ("DZ" in ps and re.search(r'/30', ps)):
        pu_new = case_price / 12.0
        pu_old = old_price          # old was already per flat
        chg = pu_new - pu_old
        return chg, chg / pu_old

    # CASE unit: pu_new = full case price (no division).
    # Still use ratio test to normalise old_price to case scale.
    if unt in ("CASE", ""):
        pu_new = case_price
        mode   = detect_old_mode(unit_col, pack_size, case_price, old_price)
        # "per_unit" means old was per-sub-unit → scale up to case
        pu_old = old_price * n if mode == "per_unit" and n > 1 else old_price
        chg = pu_new - pu_old
        pct = chg / pu_old
        return chg, pct

    # Non-CASE: pu_new = case_price / n
    pu_new = case_price / n
    mode   = detect_old_mode(unit_col, pack_size, case_price, old_price)
    pu_old = old_price if mode == "per_unit" else old_price / n

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
in_imperial = False   # tracks whether we've passed the Imperial divider

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

    # ── Imperial section divider: row where bek_num == 'Imperial' ────────────
    if str(bek_num).strip() == "Imperial":
        in_imperial = True
        c = ws.cell(row=dr, column=1,
                    value="─── IMPERIAL / LOCAL VENDORS (prices not in BEK) ───")
        c.font = Font(bold=True, color="FFFFFF")
        c.fill = BLUE; c.alignment = ctr; c.border = BDR
        ws.merge_cells(start_row=dr, start_column=1,
                       end_row=dr, end_column=len(COLS))
        ws.row_dimensions[dr].height = 18
        dr += 1
        continue

    # ── Re-match BEK item number if missing or not in PDF ────────────────────
    bek_str   = str(bek_num).strip() if bek_num else ""
    no_bek    = bek_str == ""
    in_pdf    = bek_str in BEK
    rematched = False

    name_mismatch = False  # flagged when BEK# found but name/price don't match

    if not in_imperial and not no_bek and not in_pdf:
        # 1. Try zero-padding fix (e.g. 19275 → 019275)
        padded = fix_leading_zeros(bek_str)
        if padded:
            bek_num    = padded; bek_str = padded
            case_price = BEK[padded]['price']
            pack_size  = BEK[padded]['pack'] or pack_size
            in_pdf = True; rematched = True
        else:
            # 2. Try high-confidence name match
            match_num, score = find_best_bek_match(bek_name or old_desc or "")
            if match_num:
                bek_num    = match_num; bek_str = match_num
                bek_name   = BEK[match_num]['name']
                case_price = BEK[match_num]['price']
                pack_size  = BEK[match_num]['pack'] or pack_size
                in_pdf = True; rematched = True

    # ── For confirmed BEK# matches: verify name AND use PDF price ────────────
    if not in_imperial and in_pdf and bek_str in BEK:
        pdf_info   = BEK[bek_str]
        sheet_name = str(bek_name or old_desc or "").strip()
        pdf_name   = pdf_info['name']
        name_sim   = _name_sim(sheet_name, pdf_name)
        if name_sim < 0.45:
            # Item number is in PDF but points to a completely different product
            name_mismatch = True
            in_pdf = False
        else:
            # Confirmed match — always use BEK PDF price and pack
            case_price = pdf_info['price']
            if pdf_info['pack']:
                pack_size = pdf_info['pack']

    # ── Numeric cleanup ───────────────────────────────────────────────────────
    try:    cp = float(case_price) if case_price not in (None, "") else None
    except: cp = None
    try:    op = float(old_price)  if old_price  not in (None, "") else None
    except: op = None

    pu_price, pu_label = calc_per_unit(unit, pack_size, cp)
    chg_d, chg_pct     = price_change(unit, pack_size, cp, op)

    # Color priority:
    #   Imperial items → no red (price-change colors only)
    #   Before Imperial: no BEK# or BEK# not in PDF or name mismatch → RED
    #   Before Imperial: valid BEK# with matching name → price-change colors
    if in_imperial:
        fill = fill_color(chg_d, chg_pct)
        needs_red = False
    elif no_bek or not in_pdf or name_mismatch:
        fill = MISMATCH      # bright red — needs BEK item number / name verification
        needs_red = True
    else:
        fill = fill_color(chg_d, chg_pct)
        needs_red = False

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
        if fill:
            c.fill = fill
            if needs_red:
                c.font = white_bold

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
    (MISMATCH, "RED    — No matching BEK item number (needs manual lookup)", True),
    (RED_BG,   "PINK   — Price UP ≥ 10% or ≥ $2.00/unit",                  False),
    (YELLOW,   "YELLOW — Price increased (under threshold)",                False),
    (GREEN,    "GREEN  — Price decreased",                                  False),
    (None,     "WHITE  — No change / BEK match confirmed",                  False),
]
for i, (f, lbl, wht) in enumerate(legend):
    r = dr + 1 + i
    c = ws.cell(row=r, column=1, value=lbl)
    if f: c.fill = f
    if wht: c.font = white_bold
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
