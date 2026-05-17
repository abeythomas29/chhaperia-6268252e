
-- 1. Extend production_entries
ALTER TABLE public.production_entries
  ADD COLUMN IF NOT EXISTS gsm numeric,
  ADD COLUMN IF NOT EXISTS lab_report_included boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS raw_material_included boolean NOT NULL DEFAULT false;

-- 2. Extend slitting_entries
ALTER TABLE public.slitting_entries
  ADD COLUMN IF NOT EXISTS gsm numeric;

-- 3. slitting_returns
CREATE TABLE IF NOT EXISTS public.slitting_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slitting_entry_id uuid NOT NULL,
  returned_quantity numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'meters',
  date date NOT NULL DEFAULT CURRENT_DATE,
  returned_by uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.slitting_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage slitting returns"
  ON public.slitting_returns FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated can view slitting returns"
  ON public.slitting_returns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Slitting managers can insert own returns"
  ON public.slitting_returns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = returned_by AND has_role(auth.uid(), 'slitting_manager'));

CREATE POLICY "Slitting managers can update own returns"
  ON public.slitting_returns FOR UPDATE
  TO authenticated
  USING (auth.uid() = returned_by AND has_role(auth.uid(), 'slitting_manager'))
  WITH CHECK (auth.uid() = returned_by AND has_role(auth.uid(), 'slitting_manager'));

CREATE TRIGGER update_slitting_returns_updated_at
  BEFORE UPDATE ON public.slitting_returns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. head36_entries
CREATE TABLE IF NOT EXISTS public.head36_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slitting_entry_id uuid,
  product_code_id uuid,
  rolls_taken numeric NOT NULL DEFAULT 0,
  rolls_produced numeric NOT NULL DEFAULT 0,
  roll_width_mm numeric,
  length_per_tape_mtr numeric,
  thickness_mm numeric,
  gsm numeric,
  unit text NOT NULL DEFAULT 'meters',
  total_quantity numeric GENERATED ALWAYS AS (
    COALESCE(rolls_produced, 0) * COALESCE(length_per_tape_mtr, 0)
  ) STORED,
  date date NOT NULL DEFAULT CURRENT_DATE,
  operator_id uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.head36_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage head36 entries"
  ON public.head36_entries FOR ALL
  USING (is_admin(auth.uid()));

CREATE POLICY "Authenticated can view head36 entries"
  ON public.head36_entries FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Slitting managers can insert own head36 entries"
  ON public.head36_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = operator_id AND has_role(auth.uid(), 'slitting_manager'));

CREATE POLICY "Slitting managers can update own head36 entries"
  ON public.head36_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = operator_id AND has_role(auth.uid(), 'slitting_manager'))
  WITH CHECK (auth.uid() = operator_id AND has_role(auth.uid(), 'slitting_manager'));

CREATE TRIGGER update_head36_entries_updated_at
  BEFORE UPDATE ON public.head36_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
