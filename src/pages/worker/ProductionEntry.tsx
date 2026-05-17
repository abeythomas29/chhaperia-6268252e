import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, CheckCircle, Loader2, Trash2, ChevronDown, Package, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { UNIT_OPTIONS } from "@/lib/units";

interface ThicknessRow { thickness_mm: string; rolls_count: string; quantity_per_roll: string; }

interface MaterialUsageRow {
  raw_material_id: string;
  quantity_used: string;
}

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
}

export default function ProductionEntry() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [productCodes, setProductCodes] = useState<{ id: string; code: string; category_id: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    product_code_id: "",
    client_id: "",
    rolls_count: "",
    quantity_per_roll: "",
    unit: "meters",
    thickness_mm: "",
    gsm: "",
    notes: "",
    swelling_speed: "",
    swelling_height: "",
    tensile_strength: "",
    elongation: "",
    surface_resistance: "",
    lab_report_included: false,
    raw_material_included: false,
  });

  // Rope multi-thickness rows (only used when category is Rope)
  const [thicknessRows, setThicknessRows] = useState<ThicknessRow[]>([]);

  const [newProductCode, setNewProductCode] = useState("");
  const [newProductCat, setNewProductCat] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Optional raw material usage
  const [materialUsage, setMaterialUsage] = useState<MaterialUsageRow[]>([]);
  const [materialsOpen, setMaterialsOpen] = useState(false);

  const fetchData = async () => {
    const [codesRes, catsRes, clientsRes, matsRes] = await Promise.all([
      supabase.from("product_codes").select("id, code, category_id").eq("status", "active").order("code"),
      supabase.from("product_categories").select("id, name").eq("status", "active").order("name"),
      supabase.from("company_clients").select("id, name").eq("status", "active").order("name"),
      supabase.from("raw_materials").select("id, name, unit, current_stock").eq("status", "active").order("name"),
    ]);
    setProductCodes(codesRes.data ?? []);
    setCategories(catsRes.data ?? []);
    setClients(clientsRes.data ?? []);
    setRawMaterials(matsRes.data ?? []);
  };

  useEffect(() => { fetchData(); }, []);

  const totalQuantity = (Number(form.rolls_count) || 0) * (Number(form.quantity_per_roll) || 0);

  const filteredProductCodes = selectedCategory
    ? productCodes.filter((p) => p.category_id === selectedCategory)
    : productCodes;

  const handleCategoryChange = (catId: string) => {
    setSelectedCategory(catId);
    if (form.product_code_id) {
      const current = productCodes.find((p) => p.id === form.product_code_id);
      if (current && current.category_id !== catId) {
        setForm((f) => ({ ...f, product_code_id: "" }));
      }
    }
  };

  // Material usage helpers
  const addMaterialRow = () => {
    setMaterialUsage((prev) => [...prev, { raw_material_id: "", quantity_used: "" }]);
  };

  const updateMaterialRow = (index: number, field: keyof MaterialUsageRow, value: string) => {
    setMaterialUsage((prev) => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
  };

  const removeMaterialRow = (index: number) => {
    setMaterialUsage((prev) => prev.filter((_, i) => i !== index));
  };

  const usedMaterialIds = materialUsage.map((r) => r.raw_material_id).filter(Boolean);
  const getAvailableMaterials = (currentId: string) =>
    rawMaterials.filter((m) => m.id === currentId || !usedMaterialIds.includes(m.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.product_code_id) return;

    const categoryName = categories.find((c) => c.id === selectedCategory)?.name?.toLowerCase() ?? "";
    const isRope = categoryName.includes("rope");
    const validRopeRows = thicknessRows.filter((r) => r.thickness_mm && r.rolls_count && r.quantity_per_roll);
    const useMultiThickness = isRope && validRopeRows.length > 0;

    if (!useMultiThickness && (!form.rolls_count || !form.quantity_per_roll)) return;

    setSubmitting(true);

    const baseExtras: Record<string, unknown> = { client_id: form.client_id || null };
    if (form.gsm) baseExtras.gsm = Number(form.gsm);
    if (form.notes.trim()) baseExtras.notes = form.notes.trim();
    if (form.swelling_speed) baseExtras.swelling_speed = Number(form.swelling_speed);
    if (form.swelling_height) baseExtras.swelling_height = Number(form.swelling_height);
    if (form.tensile_strength) baseExtras.tensile_strength = Number(form.tensile_strength);
    if (form.elongation) baseExtras.elongation = Number(form.elongation);
    if (form.surface_resistance) baseExtras.surface_resistance = Number(form.surface_resistance);
    baseExtras.lab_report_included = form.lab_report_included;
    baseExtras.raw_material_included = form.raw_material_included;

    const rowsToInsert = useMultiThickness
      ? validRopeRows.map((r) => ({
          product_code_id: form.product_code_id,
          date: form.date,
          worker_id: user.id,
          rolls_count: Number(r.rolls_count),
          quantity_per_roll: Number(r.quantity_per_roll),
          unit: form.unit,
          thickness_mm: Number(r.thickness_mm),
          ...baseExtras,
        }))
      : [{
          product_code_id: form.product_code_id,
          date: form.date,
          worker_id: user.id,
          rolls_count: Number(form.rolls_count),
          quantity_per_roll: Number(form.quantity_per_roll),
          unit: form.unit,
          ...(form.thickness_mm ? { thickness_mm: Number(form.thickness_mm) } : {}),
          ...baseExtras,
        }];

    const { data: entries, error } = await supabase
      .from("production_entries")
      .insert(rowsToInsert as any)
      .select("id");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }
    const entry = entries?.[0];
    if (!entry) {
      toast({ title: "Error", description: "Insert returned no rows", variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Insert optional raw material usage rows
    const validUsage = materialUsage.filter((r) => r.raw_material_id && Number(r.quantity_used) > 0);
    if (validUsage.length > 0) {
      const usageRows = validUsage.map((r) => ({
        production_entry_id: entry.id,
        raw_material_id: r.raw_material_id,
        quantity_used: Number(r.quantity_used),
      }));
      const { error: usageError } = await supabase.from("raw_material_usage").insert(usageRows);
      if (usageError) {
        toast({ title: "Warning", description: "Production saved but material usage failed: " + usageError.message, variant: "destructive" });
      }
    }

    setSubmitted(true);
    setTimeout(() => {
      setForm({ date: format(new Date(), "yyyy-MM-dd"), product_code_id: "", client_id: "", rolls_count: "", quantity_per_roll: "", unit: "meters", thickness_mm: "", gsm: "", notes: "", swelling_speed: "", swelling_height: "", tensile_strength: "", elongation: "", surface_resistance: "", lab_report_included: false, raw_material_included: false });
      setThicknessRows([]);
      setSelectedCategory("");
      setMaterialUsage([]);
      setMaterialsOpen(false);
      setSubmitted(false);
    }, 2000);
    setSubmitting(false);
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    const { data, error } = await supabase.from("product_categories").insert({ name: newCategoryName.trim() }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Category added" });
    setCategoryDialogOpen(false);
    setNewCategoryName("");
    await fetchData();
    if (data) { setNewProductCat(data.id); setSelectedCategory(data.id); }
  };

  const addProductCode = async () => {
    if (!newProductCode.trim() || !newProductCat) return;
    const { data, error } = await supabase.from("product_codes").insert({ code: newProductCode.trim(), category_id: newProductCat }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Product code added" });
    setProductDialogOpen(false);
    setNewProductCode("");
    setNewProductCat("");
    await fetchData();
    if (data) { setSelectedCategory(data.category_id); setForm((f) => ({ ...f, product_code_id: data.id })); }
  };

  const addClient = async () => {
    if (!newClientName.trim()) return;
    const { data, error } = await supabase.from("company_clients").insert({ name: newClientName.trim() }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Client added" });
    setClientDialogOpen(false);
    setNewClientName("");
    await fetchData();
    if (data) setForm((f) => ({ ...f, client_id: data.id }));
  };

  if (submitted) {
    return (
      <Card className="max-w-lg mx-auto mt-8">
        <CardContent className="flex flex-col items-center py-12">
          <CheckCircle className="h-16 w-16 text-secondary mb-4" />
          <h2 className="text-xl font-bold">Entry Submitted!</h2>
          <p className="text-muted-foreground mt-1">Production entry recorded successfully.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>New Production Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Category</Label>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-secondary"><Plus className="h-3 w-3 mr-1" /> Add New</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Product Category</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><Label>Category Name</Label><Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g. Semiconductor Woven Water Blocking Tape" /></div>
                    <Button type="button" onClick={addCategory} className="w-full bg-secondary hover:bg-secondary/90">Add</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Product Code</Label>
              <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-secondary"><Plus className="h-3 w-3 mr-1" /> Add New</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Product Code</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Category</Label>
                      <Select value={newProductCat} onValueChange={setNewProductCat}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div><Label>Code</Label><Input value={newProductCode} onChange={(e) => setNewProductCode(e.target.value)} placeholder="e.g. CHSCWWBT 18" /></div>
                    <Button type="button" onClick={addProductCode} className="w-full bg-secondary hover:bg-secondary/90">Add</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Select value={form.product_code_id} onValueChange={(v) => setForm({ ...form, product_code_id: v })}>
              <SelectTrigger><SelectValue placeholder={selectedCategory ? "Select product code" : "Select a category first"} /></SelectTrigger>
              <SelectContent>
                {filteredProductCodes.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    {selectedCategory ? "No products in this category" : "Select a category first"}
                  </div>
                ) : (
                  filteredProductCodes.map((p) => <SelectItem key={p.id} value={p.id}>{p.code}</SelectItem>)
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Number of Rolls</Label>
              <Input type="number" min="0" step="0.01" value={form.rolls_count} onChange={(e) => setForm({ ...form, rolls_count: e.target.value })} placeholder="0" />
            </div>
            <div>
              <Label>Quantity per Roll</Label>
              <Input type="number" min="0" step="0.01" value={form.quantity_per_roll} onChange={(e) => setForm({ ...form, quantity_per_roll: e.target.value })} placeholder="0" />
            </div>
          </div>

          <div>
            <Label>Thickness (mm)</Label>
            <Input type="number" min="0" step="0.01" value={form.thickness_mm} onChange={(e) => setForm({ ...form, thickness_mm: e.target.value })} placeholder="e.g. 0.25" />
          </div>

          <div>
            <Label>Unit</Label>
            <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="meters">Meters</SelectItem>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Quantity</p>
            <p className="text-3xl font-bold text-primary">{totalQuantity.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">{form.unit}</span></p>
          </div>

         <div>
           <Label>Notes / Remarks (Optional)</Label>
           <Input
             value={form.notes}
             onChange={(e) => setForm({ ...form, notes: e.target.value })}
             placeholder="e.g. Single coated, Double coated, etc."
           />
         </div>

          {/* Lab Report Data */}
          {selectedCategory && (() => {
            const catName = categories.find(c => c.id === selectedCategory)?.name?.toLowerCase() || "";
            const isWaterBlocking = catName.includes("water block");
            const selectedCode = productCodes.find(p => p.id === form.product_code_id)?.code?.toUpperCase() || "";
            const surfaceResistanceCodes = ["CHCNW", "CHCWSCWBT", "CHN-WS", "CHN-TDM", "CHN-TDMS", "CHDSW", "CHSCWWBT", "CHSMWBT-F"];
            const needsSurfaceResistance = surfaceResistanceCodes.some(c => selectedCode.startsWith(c));
            return (
              <div className="border border-border rounded-lg p-4 space-y-3">
                <Label className="text-sm font-semibold">Lab Report (Optional)</Label>
                {isWaterBlocking && !needsSurfaceResistance ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Tensile Strength</Label>
                      <Input type="number" min="0" step="0.01" value={form.tensile_strength} onChange={(e) => setForm({ ...form, tensile_strength: e.target.value })} placeholder="e.g. 45.0" />
                    </div>
                    <div>
                      <Label className="text-xs">Elongation</Label>
                      <Input type="number" min="0" step="0.01" value={form.elongation} onChange={(e) => setForm({ ...form, elongation: e.target.value })} placeholder="e.g. 15.0" />
                    </div>
                    <div>
                      <Label className="text-xs">Swelling Speed</Label>
                      <Input type="number" min="0" step="0.01" value={form.swelling_speed} onChange={(e) => setForm({ ...form, swelling_speed: e.target.value })} placeholder="e.g. 5.2" />
                    </div>
                    <div>
                      <Label className="text-xs">Swelling Height</Label>
                      <Input type="number" min="0" step="0.01" value={form.swelling_height} onChange={(e) => setForm({ ...form, swelling_height: e.target.value })} placeholder="e.g. 12.5" />
                    </div>
                  </div>
                ) : needsSurfaceResistance ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Tensile Strength</Label>
                      <Input type="number" min="0" step="0.01" value={form.tensile_strength} onChange={(e) => setForm({ ...form, tensile_strength: e.target.value })} placeholder="e.g. 45.0" />
                    </div>
                    <div>
                      <Label className="text-xs">Elongation</Label>
                      <Input type="number" min="0" step="0.01" value={form.elongation} onChange={(e) => setForm({ ...form, elongation: e.target.value })} placeholder="e.g. 15.0" />
                    </div>
                    {isWaterBlocking && (
                      <>
                        <div>
                          <Label className="text-xs">Swelling Speed</Label>
                          <Input type="number" min="0" step="0.01" value={form.swelling_speed} onChange={(e) => setForm({ ...form, swelling_speed: e.target.value })} placeholder="e.g. 5.2" />
                        </div>
                        <div>
                          <Label className="text-xs">Swelling Height</Label>
                          <Input type="number" min="0" step="0.01" value={form.swelling_height} onChange={(e) => setForm({ ...form, swelling_height: e.target.value })} placeholder="e.g. 12.5" />
                        </div>
                      </>
                    )}
                    <div className="col-span-2">
                      <Label className="text-xs">Surface Resistance (Ω)</Label>
                      <Input type="number" min="0" step="0.01" value={form.surface_resistance} onChange={(e) => setForm({ ...form, surface_resistance: e.target.value })} placeholder="e.g. 1000" />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Tensile Strength</Label>
                      <Input type="number" min="0" step="0.01" value={form.tensile_strength} onChange={(e) => setForm({ ...form, tensile_strength: e.target.value })} placeholder="e.g. 45.0" />
                    </div>
                    <div>
                      <Label className="text-xs">Elongation</Label>
                      <Input type="number" min="0" step="0.01" value={form.elongation} onChange={(e) => setForm({ ...form, elongation: e.target.value })} placeholder="e.g. 15.0" />
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Optional Raw Material Usage */}
          <Collapsible open={materialsOpen} onOpenChange={setMaterialsOpen}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Raw Materials Used (Optional)
                  {materialUsage.length > 0 && (
                    <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                      {materialUsage.length}
                    </span>
                  )}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${materialsOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3">
              {materialUsage.map((row, idx) => {
                const mat = rawMaterials.find((m) => m.id === row.raw_material_id);
                return (
                  <div key={idx} className="flex items-end gap-2">
                    <div className="flex-1">
                      {idx === 0 && <Label className="text-xs">Material</Label>}
                      <Select value={row.raw_material_id} onValueChange={(v) => updateMaterialRow(idx, "raw_material_id", v)}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select material" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableMaterials(row.raw_material_id).map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.name} ({m.unit})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {mat && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Stock: {mat.current_stock.toLocaleString()} {mat.unit}
                        </p>
                      )}
                    </div>
                    <div className="w-24">
                      {idx === 0 && <Label className="text-xs">Qty</Label>}
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        className="h-9 text-right"
                        value={row.quantity_used}
                        onChange={(e) => updateMaterialRow(idx, "quantity_used", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeMaterialRow(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={addMaterialRow} className="w-full">
                <Plus className="h-4 w-4 mr-1" /> Add Material
              </Button>
            </CollapsibleContent>
          </Collapsible>

          <Button type="submit" disabled={submitting} className="w-full bg-secondary hover:bg-secondary/90 text-lg py-6">
            {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Submit Entry
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
