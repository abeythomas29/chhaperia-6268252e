
# Plan — Production Workflow Expansion

Below is what I understood from your three handwritten notes. Please confirm before I build.

---

## 1) Rope Production — multi-thickness in one entry

**Current**: Production entry sends only one thickness, for one client at a time, unit fixed.

**Changes**:
- In Production Entry (worker panel), when product category = **Rope**, allow entering **multiple thickness rows in a single submission** (each row = thickness + rolls + quantity-per-roll).
- Keep client = single client per entry (as today).
- Add **Unit selector** (manual): kg, sqmtr, mtr, pcs, ltr, box/bundle.
- On save → create one `production_entries` row per thickness row, all sharing the same client/date/product.

---

## 2) Copper Woven Semi-Cond Water Blocking Tape — optional Lab Report & Raw Material flags

This product has 3 stages: Fiber-glass tape → Coated with SC material → Lab report.

Sometimes the fiber-glass tape arrives pre-made (bought), sometimes it's made in-house. Same for lab reports.

**Changes**:
- On the Production Entry form for this product, add **two checkboxes**:
  - ☐ Raw material prepared here
  - ☐ Lab report prepared here
- When **Raw material** is checked → show fields to record the in-house fiber-glass tape production (thickness, rolls, qty, etc.).
- When **Lab report** is checked → show fields to attach/record lab report values (swelling speed, swelling height, tensile strength, elongation, surface resistance — already in `production_entries`).
- When unchecked → those sections are hidden; entry only records the SC-coating step.

---

## 3) Slitting Panel — split into 3 tabs

Today slitting has **one** entry form. Split it into **3 tabs**:

### Tab 1 — Slitting Entry (new production-style)
Keep all current fields, but rename/restructure:
- Product Code
- **Source Quantity** (manual) + **Unit selector** (sqmtr, mtr, kg, pcs, ltr, box/bundle)
- **Roll Width (mm)** — fixed unit (renamed from "Cut Width")
- **Produced Roll Length (mtr)** — per roll (renamed from "Cut Material Produced")
- **No. of Rolls Produced**
- **Thickness (mm)** + **GSM** (new)
- **Auto-calculated Total Production** shown in a read-only tab:
  - Formula: `(Roll Width × Roll Length / 1000) × No. of Rolls` → sqm
  - Or, when GSM is available but length isn't: `(1000 / GSM) × Total kg = sqm`

Remove the "Remaining Returned" field — it moves to Tab 2.

### Tab 2 — Material Return Entry
Used after the 1–2 day order completes, when leftover material is returned.

- Pick from a **list of past Slitting Entries** (shows product name, source qty, unit, date).
- Display **Total Bought** (auto-pulled from the source entry).
- **Returned Quantity** (manual) + Unit.
- Auto-display **Used = Total Bought − Returned**.
- Comparison badge:
  - **Green** when `Total Used == Total Production from Tab 1`
  - **Red** when mismatched
- Saves a `slitting_return` row linked to the slitting entry.

### Tab 3 — 36 Head Production
New panel for the next downstream step (takes rolls from slitting → produces on 36-head machine).

Fields:
- **Total Rolls Taken from Slitting** (pick from slitting outputs)
- **Total Rolls Produced in 36 Head**
- **Width of Roll/Tape**
- **Length per Tape**
- **Thickness + GSM**
- **Unit selector** (same options as above)
- **Auto-calculated Total Production tab** using the same formulae as slitting.

---

## 4) Cross-cutting additions

- **GSM** field added alongside Thickness at **every production level**: Production Entry, Slitting, 36 Head.
- **Unit selector** added everywhere quantities are entered (sqmtr, mtr, kg, pcs, ltr, box/bundle).
- **Auto-calculated Total Production** tab shown in Slitting and 36 Head panels (read-only, recomputed live).

---

## Technical section (DB + UI)

**Schema changes**:
- `production_entries`: add `gsm numeric`, ensure `unit` selector covers new options. For Rope multi-thickness, no schema change — just multi-row insert client-side.
- `production_entries`: add nullable `lab_report_included boolean default false`, `raw_material_included boolean default false` (for the Copper Tape product gating).
- `slitting_entries`: add `gsm numeric`, drop `remaining_returned` usage from this table (kept for backward-compat) → returns now live in new table.
- New table `slitting_returns`: `id, slitting_entry_id (fk), returned_quantity, unit, date, returned_by, notes`.
- New table `head36_entries`: `id, slitting_entry_id (fk, nullable), rolls_taken, rolls_produced, roll_width_mm, roll_length_mtr, thickness_mm, gsm, unit, total_quantity (generated), date, operator_id, notes`. RLS mirroring slitting.

**UI files**:
- `src/pages/worker/ProductionEntry.tsx` — rope multi-thickness rows, copper-tape conditional sections, unit selector, GSM field.
- `src/pages/slitting/SlittingEntry.tsx` — convert to 3-tab layout (Tabs component).
- New `src/pages/slitting/MaterialReturn.tsx` and `src/pages/slitting/Head36Entry.tsx` mounted as tabs inside SlittingEntry, or as sibling routes.
- `src/layouts/SlittingManagerLayout.tsx` — adjust nav if tabs are routes instead.
- History pages updated to show new fields.

---

## Open questions (please answer before I build)

1. **Rope multi-thickness**: should each thickness row save as a separate `production_entries` record (easier for stock math), or one record with a nested JSON list?
2. **36 Head Production** — who operates it? Same Slitting Manager role, or a new role?
3. **Material Return**: should returned material **add back** to a raw-material stock balance, or just be recorded for the used/produced reconciliation?
4. **GSM** — required field everywhere, or optional?
