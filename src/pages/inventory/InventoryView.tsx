import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Plus, Boxes, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  status: string;
}

interface FinishedProduct {
  product_code_id: string;
  code: string;
  unit: string;
  available: number;
}

export default function InventoryView() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<FinishedProduct[]>([]);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("kg");
  const [adding, setAdding] = useState(false);
  const [editTarget, setEditTarget] = useState<RawMaterial | null>(null);
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("kg");
  const [editStock, setEditStock] = useState("0");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RawMaterial | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMaterials = async () => {
    const { data } = await supabase.from("raw_materials").select("*").order("name");
    setMaterials(data ?? []);
  };

  const fetchProducts = async () => {
    const [{ data: prodData }, { data: issueData }, { data: salesData }, { data: codes }] = await Promise.all([
      supabase.from("production_entries").select("product_code_id, total_quantity, quantity_per_roll, rolls_count, unit").limit(2000),
      supabase.from("stock_issues").select("product_code_id, quantity").limit(2000),
      supabase.from("sales").select("product_code_id, quantity").eq("item_type", "finished_product").limit(2000),
      supabase.from("product_codes").select("id, code").eq("status", "active").order("code"),
    ]);

    const producedMap = new Map<string, { unit: string; produced: number }>();
    for (const p of (prodData ?? []) as any[]) {
      const qty = Number(p.total_quantity ?? (p.rolls_count * p.quantity_per_roll));
      const existing = producedMap.get(p.product_code_id);
      if (existing) existing.produced += qty;
      else producedMap.set(p.product_code_id, { unit: p.unit, produced: qty });
    }
    const issuedMap = new Map<string, number>();
    for (const i of (issueData ?? []) as any[]) {
      issuedMap.set(i.product_code_id, (issuedMap.get(i.product_code_id) ?? 0) + Number(i.quantity));
    }
    for (const s of (salesData ?? []) as any[]) {
      if (!s.product_code_id) continue;
      issuedMap.set(s.product_code_id, (issuedMap.get(s.product_code_id) ?? 0) + Number(s.quantity));
    }

    const list: FinishedProduct[] = (codes ?? []).map((c: any) => {
      const prod = producedMap.get(c.id);
      return {
        product_code_id: c.id,
        code: c.code,
        unit: prod?.unit ?? "meters",
        available: (prod?.produced ?? 0) - (issuedMap.get(c.id) ?? 0),
      };
    });
    setProducts(list);
  };

  useEffect(() => { fetchMaterials(); fetchProducts(); }, []);

  const addMaterial = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    const { error } = await supabase.from("raw_materials").insert({ name: newName.trim(), unit: newUnit });
    setAdding(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Material added" });
    setAddOpen(false);
    setNewName("");
    setNewUnit("kg");
    await fetchMaterials();
  };

  const openEdit = (m: RawMaterial) => {
    setEditTarget(m);
    setEditName(m.name);
    setEditUnit(m.unit);
  };

  const saveEdit = async () => {
    if (!editTarget || !editName.trim()) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from("raw_materials")
      .update({ name: editName.trim(), unit: editUnit })
      .eq("id", editTarget.id);
    setSavingEdit(false);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Material updated" });
    setEditTarget(null);
    await fetchMaterials();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { data: recipes } = await supabase
      .from("product_recipes")
      .select("id")
      .eq("raw_material_id", deleteTarget.id)
      .limit(1);
    if (recipes && recipes.length > 0) {
      toast({
        title: "Cannot delete",
        description: "This material is used in product recipes. Remove it from recipes first.",
        variant: "destructive",
      });
      setDeleting(false);
      setDeleteTarget(null);
      return;
    }
    const { error } = await supabase.from("raw_materials").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) { toast({ title: "Delete failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Material deleted" });
    await fetchMaterials();
  };

  const filtered = materials.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-secondary hover:bg-secondary/90">
              <Plus className="h-4 w-4 mr-1" /> Add Raw Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Raw Material</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. ALUMINIUM FOIL 009MIC" />
              </div>
              <div>
                <Label>Unit</Label>
                <Select value={newUnit} onValueChange={setNewUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                    <SelectItem value="rolls">Rolls</SelectItem>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="liters">Liters</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addMaterial} disabled={adding || !newName.trim()} className="w-full bg-secondary hover:bg-secondary/90">
                {adding ? "Adding…" : "Add Material"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search materials..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Raw Materials ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No materials found</TableCell></TableRow>
              ) : filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.unit}</TableCell>
                  <TableCell className="text-right font-mono">{m.current_stock.toLocaleString()}</TableCell>
                  <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(m)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(m)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5" />
            Finished Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Code</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Available Stock</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No products found</TableCell></TableRow>
              ) : filteredProducts.map((p) => (
                <TableRow key={p.product_code_id}>
                  <TableCell className="font-medium">{p.code}</TableCell>
                  <TableCell>{p.unit}</TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={p.available <= 0 ? "text-muted-foreground" : ""}>
                      {p.available.toLocaleString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={editTarget !== null} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Raw Material</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <Label>Unit</Label>
              <Select value={editUnit} onValueChange={setEditUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="meters">Meters</SelectItem>
                  <SelectItem value="rolls">Rolls</SelectItem>
                  <SelectItem value="pieces">Pieces</SelectItem>
                  <SelectItem value="liters">Liters</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveEdit} disabled={savingEdit || !editName.trim()} className="w-full bg-secondary hover:bg-secondary/90">
              {savingEdit ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete raw material?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold">{deleteTarget?.name}</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
