import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Scissors } from "lucide-react";
import { UNIT_OPTIONS } from "@/lib/units";

interface ProductCode { id: string; code: string; category_id: string; }

export default function SlittingEntryForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [productCodes, setProductCodes] = useState<ProductCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    product_code_id: "",
    source_quantity: "",
    source_unit: "meters",
    roll_width_mm: "",
    roll_length_mtr: "",
    rolls_count: "",
    thickness_mm: "",
    gsm: "",
    unit: "meters",
    notes: "",
  });

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("product_codes")
        .select("id, code, category_id")
        .eq("status", "active")
        .order("code");
      setProductCodes(data ?? []);
      setLoading(false);
    })();
  }, []);

  const rollWidth = parseFloat(form.roll_width_mm) || 0;
  const rollLength = parseFloat(form.roll_length_mtr) || 0;
  const rollsCount = parseFloat(form.rolls_count) || 0;
  const gsm = parseFloat(form.gsm) || 0;
  const sourceQty = parseFloat(form.source_quantity) || 0;

  // (width × length / 1000) × rolls = sqm
  const totalSqm = rollWidth && rollLength && rollsCount
    ? (rollWidth * rollLength / 1000) * rollsCount
    : 0;
  // fallback: (1000/gsm) × kg = sqm
  const sqmFromGsm = !totalSqm && gsm > 0 && sourceQty > 0 && form.source_unit === "kg"
    ? (1000 / gsm) * sourceQty
    : 0;
  const totalProduction = totalSqm || sqmFromGsm;
  const totalLength = rollLength * rollsCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.product_code_id || !sourceQty || !rollsCount || !rollWidth) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("slitting_entries").insert({
      product_code_id: form.product_code_id,
      source_quantity: sourceQty,
      cut_quantity_produced: totalLength || rollsCount,
      cut_width_mm: rollWidth,
      remaining_returned: 0,
      thickness_mm: form.thickness_mm ? parseFloat(form.thickness_mm) : null,
      gsm: form.gsm ? gsm : null,
      unit: form.unit,
      notes: form.notes || null,
      slitting_manager_id: user.id,
    } as any);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Slitting entry saved!" });
      setForm({ ...form, source_quantity: "", roll_width_mm: "", roll_length_mtr: "", rolls_count: "", thickness_mm: "", gsm: "", notes: "" });
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Scissors className="h-5 w-5" /> New Slitting Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Product Code *</Label>
            <Select value={form.product_code_id} onValueChange={(v) => setForm({ ...form, product_code_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select product code" /></SelectTrigger>
              <SelectContent>
                {productCodes.map((pc) => <SelectItem key={pc.id} value={pc.id}>{pc.code}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Source Quantity Taken *</Label>
              <Input type="number" step="any" value={form.source_quantity}
                onChange={(e) => setForm({ ...form, source_quantity: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Source Unit</Label>
              <Select value={form.source_unit} onValueChange={(v) => setForm({ ...form, source_unit: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Roll Width (mm) *</Label>
              <Input type="number" step="any" value={form.roll_width_mm}
                onChange={(e) => setForm({ ...form, roll_width_mm: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Produced Roll Length (mtr)</Label>
              <Input type="number" step="any" value={form.roll_length_mtr}
                onChange={(e) => setForm({ ...form, roll_length_mtr: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>No. of Rolls Produced *</Label>
            <Input type="number" step="any" value={form.rolls_count}
              onChange={(e) => setForm({ ...form, rolls_count: e.target.value })} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
          </div>

          <div className="space-y-2">
            <Label>Output Unit</Label>
            <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((u) => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted rounded-lg p-4 grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Length Produced</p>
              <p className="text-xl font-bold text-primary">{totalLength.toLocaleString()} <span className="text-sm font-normal">mtr</span></p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Production (sqm)</p>
              <p className="text-xl font-bold text-primary">{totalProduction.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm font-normal">sqm</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes / Remarks</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Slitting Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
