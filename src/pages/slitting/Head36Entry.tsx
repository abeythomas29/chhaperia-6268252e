import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Layers } from "lucide-react";
import { UNIT_OPTIONS } from "@/lib/units";
import { format } from "date-fns";

interface SlittingRow {
  id: string;
  date: string;
  cut_quantity_produced: number;
  unit: string;
  product_codes: { code: string; id?: string } | null;
}

export default function Head36Entry() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [slittingEntries, setSlittingEntries] = useState<SlittingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    slitting_entry_id: "",
    rolls_taken: "",
    rolls_produced: "",
    roll_width_mm: "",
    length_per_tape_mtr: "",
    thickness_mm: "",
    gsm: "",
    unit: "meters",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("slitting_entries")
        .select("id, date, cut_quantity_produced, unit, product_codes(code, id)")
        .eq("slitting_manager_id", user.id)
        .order("date", { ascending: false })
        .limit(50);
      setSlittingEntries((data as unknown as SlittingRow[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const width = parseFloat(form.roll_width_mm) || 0;
  const length = parseFloat(form.length_per_tape_mtr) || 0;
  const rolls = parseFloat(form.rolls_produced) || 0;
  const gsm = parseFloat(form.gsm) || 0;

  const totalLength = length * rolls;
  const totalSqm = width && length && rolls ? (width * length / 1000) * rolls : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.rolls_produced) {
      toast({ title: "Missing fields", description: "Please enter rolls produced.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const source = slittingEntries.find((s) => s.id === form.slitting_entry_id);
    const { error } = await supabase.from("head36_entries" as any).insert({
      slitting_entry_id: form.slitting_entry_id || null,
      product_code_id: source?.product_codes?.id ?? null,
      rolls_taken: parseFloat(form.rolls_taken) || 0,
      rolls_produced: rolls,
      roll_width_mm: width || null,
      length_per_tape_mtr: length || null,
      thickness_mm: form.thickness_mm ? parseFloat(form.thickness_mm) : null,
      gsm: gsm || null,
      unit: form.unit,
      notes: form.notes || null,
      operator_id: user.id,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "36 Head entry saved" });
      setForm({ ...form, rolls_taken: "", rolls_produced: "", roll_width_mm: "", length_per_tape_mtr: "", thickness_mm: "", gsm: "", notes: "" });
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> 36 Head Production Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Source Slitting Entry (optional)</Label>
            <Select value={form.slitting_entry_id} onValueChange={(v) => setForm({ ...form, slitting_entry_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose source rolls" /></SelectTrigger>
              <SelectContent>
                {slittingEntries.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {format(new Date(e.date), "dd/MM/yy")} — {e.product_codes?.code ?? "—"} — {e.cut_quantity_produced} {e.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Total Rolls Taken</Label>
              <Input type="number" step="any" value={form.rolls_taken}
                onChange={(e) => setForm({ ...form, rolls_taken: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Total Rolls Produced *</Label>
              <Input type="number" step="any" value={form.rolls_produced}
                onChange={(e) => setForm({ ...form, rolls_produced: e.target.value })} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Width of Tape (mm)</Label>
              <Input type="number" step="any" value={form.roll_width_mm}
                onChange={(e) => setForm({ ...form, roll_width_mm: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Length per Tape (mtr)</Label>
              <Input type="number" step="any" value={form.length_per_tape_mtr}
                onChange={(e) => setForm({ ...form, length_per_tape_mtr: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Thickness (mm)</Label>
              <Input type="number" step="any" value={form.thickness_mm}
                onChange={(e) => setForm({ ...form, thickness_mm: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>GSM</Label>
              <Input type="number" step="any" value={form.gsm}
                onChange={(e) => setForm({ ...form, gsm: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Length Produced</p>
              <p className="text-xl font-bold text-primary">{totalLength.toLocaleString()} <span className="text-sm font-normal">mtr</span></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Production (sqm)</p>
              <p className="text-xl font-bold text-primary">{totalSqm.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm font-normal">sqm</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save 36 Head Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
