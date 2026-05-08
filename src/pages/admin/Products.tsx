import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, ChevronRight, ArrowLeft } from "lucide-react";
import { Layers, Hash } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  status: string;
}

interface ProductCode {
  id: string;
  code: string;
  category_id: string;
  status: string;
  product_categories: { name: string } | null;
}

export default function Products() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [codes, setCodes] = useState<ProductCode[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, { available: number; unit: string }>>({});
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newCode, setNewCode] = useState("");
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Edit state
  const [editCatDialogOpen, setEditCatDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState("");

  const [editCodeDialogOpen, setEditCodeDialogOpen] = useState(false);
  const [editCode, setEditCode] = useState<ProductCode | null>(null);
  const [editCodeValue, setEditCodeValue] = useState("");
  const [editCodeCat, setEditCodeCat] = useState("");

  // Delete state
  const [deleteCatOpen, setDeleteCatOpen] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [deleteCodeOpen, setDeleteCodeOpen] = useState(false);
  const [deleteCodeId, setDeleteCodeId] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchData = async () => {
    const [catRes, codeRes, prodRes, issueRes, saleRes] = await Promise.all([
      supabase.from("product_categories").select("*").order("name"),
      supabase.from("product_codes").select("*, product_categories(name)").order("code"),
      supabase.from("production_entries").select("product_code_id, total_quantity, rolls_count, quantity_per_roll, unit").limit(5000),
      supabase.from("stock_issues").select("product_code_id, quantity").limit(5000),
      supabase.from("sales").select("product_code_id, quantity").eq("item_type", "finished_product").limit(5000),
    ]);
    setCategories(catRes.data ?? []);
    setCodes((codeRes.data as unknown as ProductCode[]) ?? []);

    const map: Record<string, { available: number; unit: string }> = {};
    for (const p of (prodRes.data ?? []) as any[]) {
      const qty = Number(p.total_quantity ?? Number(p.rolls_count) * Number(p.quantity_per_roll));
      const cur = map[p.product_code_id] ?? { available: 0, unit: p.unit ?? "meters" };
      cur.available += Number.isFinite(qty) ? qty : 0;
      cur.unit = p.unit ?? cur.unit;
      map[p.product_code_id] = cur;
    }
    for (const i of (issueRes.data ?? []) as any[]) {
      const cur = map[i.product_code_id] ?? { available: 0, unit: "meters" };
      cur.available -= Number(i.quantity ?? 0);
      map[i.product_code_id] = cur;
    }
    for (const s of (saleRes.data ?? []) as any[]) {
      if (!s.product_code_id) continue;
      const cur = map[s.product_code_id] ?? { available: 0, unit: "meters" };
      cur.available -= Number(s.quantity ?? 0);
      map[s.product_code_id] = cur;
    }
    setStockMap(map);
  };

  useEffect(() => { fetchData(); }, []);

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const { error } = await supabase.from("product_categories").insert({ name: newCategory.trim() });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Category added" });
    setNewCategory("");
    setCatDialogOpen(false);
    fetchData();
  };

  const addCode = async () => {
    if (!newCode.trim() || !selectedCategory) return;
    const { error } = await supabase.from("product_codes").insert({ code: newCode.trim(), category_id: selectedCategory.id });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Product code added" });
    setNewCode("");
    setCodeDialogOpen(false);
    fetchData();
  };

  const toggleStatus = async (table: "product_categories" | "product_codes", id: string, current: string) => {
    const newStatus = current === "active" ? "inactive" : "active";
    await supabase.from(table).update({ status: newStatus }).eq("id", id);
    fetchData();
  };

  const openEditCategory = (cat: Category) => {
    setEditCat(cat);
    setEditCatName(cat.name);
    setEditCatDialogOpen(true);
  };

  const saveEditCategory = async () => {
    if (!editCat || !editCatName.trim()) return;
    const { error } = await supabase.from("product_categories").update({ name: editCatName.trim() }).eq("id", editCat.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Category updated" });
    setEditCatDialogOpen(false);
    fetchData();
  };

  const openEditCode = (code: ProductCode) => {
    setEditCode(code);
    setEditCodeValue(code.code);
    setEditCodeCat(code.category_id);
    setEditCodeDialogOpen(true);
  };

  const saveEditCode = async () => {
    if (!editCode || !editCodeValue.trim() || !editCodeCat) return;
    const { error } = await supabase.from("product_codes").update({ code: editCodeValue.trim(), category_id: editCodeCat }).eq("id", editCode.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Product code updated" });
    setEditCodeDialogOpen(false);
    fetchData();
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCatId) return;
    const { data: linkedCodes } = await supabase.from("product_codes").select("id").eq("category_id", deleteCatId).limit(1);
    if (linkedCodes && linkedCodes.length > 0) {
      toast({ title: "Cannot delete", description: "This category has product codes linked to it. Remove or reassign them first.", variant: "destructive" });
      setDeleteCatOpen(false);
      setDeleteCatId(null);
      return;
    }
    const { error } = await supabase.from("product_categories").delete().eq("id", deleteCatId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Category deleted" });
    setDeleteCatOpen(false);
    setDeleteCatId(null);
    fetchData();
  };

  const confirmDeleteCode = async () => {
    if (!deleteCodeId) return;
    const { data: linkedEntries } = await supabase.from("production_entries").select("id").eq("product_code_id", deleteCodeId).limit(1);
    if (linkedEntries && linkedEntries.length > 0) {
      toast({ title: "Cannot delete", description: "This product code is used in production entries. Deactivate it instead.", variant: "destructive" });
      setDeleteCodeOpen(false);
      setDeleteCodeId(null);
      return;
    }
    const { error } = await supabase.from("product_codes").delete().eq("id", deleteCodeId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Product code deleted" });
    setDeleteCodeOpen(false);
    setDeleteCodeId(null);
    fetchData();
  };

  const q = searchQuery.toLowerCase();

  // Category codes count
  const codeCountByCategory = codes.reduce<Record<string, number>>((acc, c) => {
    acc[c.category_id] = (acc[c.category_id] ?? 0) + 1;
    return acc;
  }, {});

  const filteredCategories = categories.filter(c =>
    (filterStatus === "all" || c.status === filterStatus) &&
    c.name.toLowerCase().includes(q)
  );

  const filteredCodes = selectedCategory
    ? codes.filter(c =>
        c.category_id === selectedCategory.id &&
        (filterStatus === "all" || c.status === filterStatus) &&
        c.code.toLowerCase().includes(q)
      )
    : [];

  // ─── Category List View ───
  if (!selectedCategory) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Product Management</h1>
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-secondary hover:bg-secondary/90"><Plus className="h-4 w-4 mr-1" /> Add Category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Category Name</Label><Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Semiconductor Woven Water Blocking Tape" /></div>
                <Button onClick={addCategory} className="w-full bg-secondary hover:bg-secondary/90">Add</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search categories..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground col-span-full">No categories found</p>
          ) : (
            filteredCategories.map((c) => (
              <Card
                key={c.id}
                className="cursor-pointer hover:shadow-lg hover:border-secondary/50 transition-all group"
                onClick={() => { setSelectedCategory(c); setSearchQuery(""); }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-10 w-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant={c.status === "active" ? "default" : "secondary"}
                        className="cursor-pointer text-[10px] px-2 py-0.5"
                        onClick={(e) => { e.stopPropagation(); toggleStatus("product_categories", c.id, c.status); }}
                      >
                        {c.status}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-2">{c.name}</h3>
                  <p className="text-2xl font-bold text-secondary mb-3">{codeCountByCategory[c.id] ?? 0} <span className="text-xs font-normal text-muted-foreground">codes</span></p>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEditCategory(c); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteCatId(c.id); setDeleteCatOpen(true); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Category Dialog */}
        <Dialog open={editCatDialogOpen} onOpenChange={setEditCatDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Category Name</Label><Input value={editCatName} onChange={(e) => setEditCatName(e.target.value)} /></div>
              <Button onClick={saveEditCategory} className="w-full bg-secondary hover:bg-secondary/90">Save</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Category Confirmation */}
        <AlertDialog open={deleteCatOpen} onOpenChange={setDeleteCatOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>This will permanently delete this category. Are you sure?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // ─── Product Codes View (inside a category) ───
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedCategory.name}</h1>
            <p className="text-sm text-muted-foreground">Product codes in this category</p>
          </div>
        </div>
        <Dialog open={codeDialogOpen} onOpenChange={setCodeDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-secondary hover:bg-secondary/90"><Plus className="h-4 w-4 mr-1" /> Add Product Code</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Product Code</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Product Code</Label><Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="e.g. CHSCWWBT 18" /></div>
              <Button onClick={addCode} className="w-full bg-secondary hover:bg-secondary/90">Add</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search product codes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCodes.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground col-span-full">No product codes in this category</p>
        ) : (
          filteredCodes.map((c) => (
            <Card key={c.id} className="group hover:shadow-md hover:border-secondary/30 transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                    <Hash className="h-4 w-4 text-primary" />
                  </div>
                  <Badge
                    variant={c.status === "active" ? "default" : "secondary"}
                    className="cursor-pointer text-[10px] px-2 py-0.5"
                    onClick={() => toggleStatus("product_codes", c.id, c.status)}
                  >
                    {c.status}
                  </Badge>
                </div>
                <p className="font-semibold text-sm mb-3">{c.code}</p>
                <div className="flex items-center gap-1 pt-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditCode(c)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setDeleteCodeId(c.id); setDeleteCodeOpen(true); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Product Code Dialog */}
      <Dialog open={editCodeDialogOpen} onOpenChange={setEditCodeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Product Code</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Category</Label>
              <Select value={editCodeCat} onValueChange={setEditCodeCat}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>{categories.filter(c => c.status === "active").map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Product Code</Label><Input value={editCodeValue} onChange={(e) => setEditCodeValue(e.target.value)} /></div>
            <Button onClick={saveEditCode} className="w-full bg-secondary hover:bg-secondary/90">Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Product Code Confirmation */}
      <AlertDialog open={deleteCodeOpen} onOpenChange={setDeleteCodeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product Code</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this product code. Are you sure?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCode} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
