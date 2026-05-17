import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PackageOpen } from "lucide-react";
import { UNIT_OPTIONS } from "@/lib/units";
import { format } from "date-fns";

interface SlittingRow {
  id: string;
  date: string;
  source_quantity: number;
  cut_quantity_produced: number;
  unit: string;
  product_codes: { code: string } | null;
}

export default function MaterialReturn() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<SlittingRow[]>([]);
  const [returns, setReturns] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ slitting_entry_id: "", returned_quantity: "", unit: "meters", notes: "" });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data: entryData } = await supabase
      .from("slitting_entries")
      .select("id, date, source_quantity, cut_quantity_produced, unit, product_codes(code)")
      .eq("slitting_manager_id", user.id)
      .order("date", { ascending: false })
      .limit(50);
    setEntries((entryData as unknown as SlittingRow[]) ?? []);

    const { data: retData } = await supabase
      .from("slitting_returns" as any)
      .select("slitting_entry_id, returned_quantity")
      .limit(2000);
    const sums: Record<string, number> = {};
    ((retData as any[]) ?? []).forEach((r) => {
      sums[r.slitting_entry_id] = (sums[r.slitting_entry_id] ?? 0) + Number(r.returned_quantity ?? 0);
    });
    setReturns(sums);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const selected = entries.find((e) => e.id === form.slitting_entry_id);
  const alreadyReturned = selected ? (returns[selected.id] ?? 0) : 0;
  const newReturn = parseFloat(form.returned_quantity) || 0;
  const totalReturned = alreadyReturned + newReturn;
  const used = selected ? Number(selected.source_quantity) - totalReturned : 0;
  const produced = selected ? Number(selected.cut_quantity_produced) : 0;
  const matched = selected && Math.abs(used - produced) < 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.slitting_entry_id || !newReturn) {
      toast({ title: "Missing fields", description: "Select an entry and enter returned quantity.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("slitting_returns" as any).insert({
      slitting_entry_id: form.slitting_entry_id,
      returned_quantity: newReturn,
      unit: form.unit,
      notes: form.notes || null,
      returned_by: user.id,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Return recorded" });
      setForm({ slitting_entry_id: "", returned_quantity: "", unit: "meters", notes: "" });
      await load();
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PackageOpen className="h-5 w-5" /> Material Return Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Slitting Entry *</Label>
            <Select value={form.slitting_entry_id} onValueChange={(v) => setForm({ ...form, slitting_entry_id: v })}>
              <SelectTrigger><SelectValue placeholder="Choose a slitting source" /></SelectTrigger>
              <SelectContent>
                {entries.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {format(new Date(e.date), "dd/MM/yy")} — {e.product_codes?.code ?? "—"} — {e.source_quantity} {e.unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="rounded-lg border p-3 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Total Bought: </span><b>{selected.source_quantity} {selected.unit}</b></div>
              <div><span className="text-muted-foreground">Already Returned: </span><b>{alreadyReturned}</b></div>
              <div><span className="text-muted-foreground">Total Production: </span><b>{produced}</b></div>
              <div className={matched ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>
                Used (auto) = {used.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Returned Quantity *</Label>
              <Input type="number" step="any" value={form.returned_quantity}
                onChange={(e) => setForm({ ...form, returned_quantity: e.target.value })} required />
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

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Return
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
