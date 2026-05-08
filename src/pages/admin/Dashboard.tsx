import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, TrendingUp, Download, Loader2, Layers, ChevronRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface EntryDetail {
  id: string;
  date: string;
  rolls_count: number;
  quantity_per_roll: number;
  total_quantity: number | null;
  unit: string;
  product_codes: { code: string } | null;
  profiles: { name: string } | null;
}

type ModalType = "today" | "week" | null;

interface CategorySummary {
  id: string;
  name: string;
  status: string;
  codes: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [chartData, setChartData] = useState<{ date: string; entries: number }[]>([]);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [todayEntries, setTodayEntries] = useState<EntryDetail[]>([]);
  const [weekEntries, setWeekEntries] = useState<EntryDetail[]>([]);
  const [backingUp, setBackingUp] = useState(false);
  const [categories, setCategories] = useState<CategorySummary[]>([]);

  const fetchCategories = async () => {
    const [catRes, codeRes] = await Promise.all([
      supabase.from("product_categories").select("id, name, status").eq("status", "active").order("name"),
      supabase.from("product_codes").select("category_id").eq("status", "active").limit(5000),
    ]);
    const counts: Record<string, number> = {};
    for (const c of (codeRes.data ?? []) as any[]) {
      counts[c.category_id] = (counts[c.category_id] ?? 0) + 1;
    }
    setCategories((catRes.data ?? []).map((c: any) => ({ ...c, codes: counts[c.id] ?? 0 })));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      const now = new Date();
      const todayStr = format(now, "yyyy-MM-dd");
      const weekAgo = format(subDays(now, 7), "yyyy-MM-dd");
      const monthAgo = format(subDays(now, 30), "yyyy-MM-dd");

      const [todayRes, weekRes, monthRes] = await Promise.all([
        supabase.from("production_entries").select("id").eq("date", todayStr),
        supabase.from("production_entries").select("id").gte("date", weekAgo),
        supabase.from("production_entries").select("id").gte("date", monthAgo),
      ]);

      setStats({
        today: todayRes.data?.length ?? 0,
        week: weekRes.data?.length ?? 0,
        month: monthRes.data?.length ?? 0,
      });

      const { data: entries } = await supabase
        .from("production_entries")
        .select("date")
        .gte("date", weekAgo)
        .order("date");

      const dayCounts: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        dayCounts[format(subDays(now, i), "yyyy-MM-dd")] = 0;
      }
      entries?.forEach((e) => {
        if (dayCounts[e.date] !== undefined) dayCounts[e.date]++;
      });

      setChartData(
        Object.entries(dayCounts).map(([date, entries]) => ({
          date: format(new Date(date), "MMM dd"),
          entries,
        }))
      );
    };

    fetchStats();

    const channel = supabase
      .channel("dashboard-entries")
      .on("postgres_changes", { event: "*", schema: "public", table: "production_entries" }, () => {
        fetchStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const openModal = async (type: ModalType) => {
    setActiveModal(type);
    setModalLoading(true);

    const now = new Date();
    const todayStr = format(now, "yyyy-MM-dd");
    const weekAgo = format(subDays(now, 7), "yyyy-MM-dd");

    try {
      if (type === "today") {
        const { data } = await supabase
          .from("production_entries")
          .select("id, date, rolls_count, quantity_per_roll, total_quantity, unit, product_codes(code), profiles:worker_id(name)")
          .eq("date", todayStr)
          .order("created_at", { ascending: false });
        setTodayEntries((data as unknown as EntryDetail[]) ?? []);
      } else if (type === "week") {
        const { data } = await supabase
          .from("production_entries")
          .select("id, date, rolls_count, quantity_per_roll, total_quantity, unit, product_codes(code), profiles:worker_id(name)")
          .gte("date", weekAgo)
          .order("date", { ascending: false });
        setWeekEntries((data as unknown as EntryDetail[]) ?? []);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const [
        { data: categories },
        { data: productCodes },
        { data: clients },
        { data: profiles },
        { data: roles },
        { data: productionEntries },
        { data: stockIssues },
      ] = await Promise.all([
        supabase.from("product_categories").select("*").order("name"),
        supabase.from("product_codes").select("*").order("code"),
        supabase.from("company_clients").select("*").order("name"),
        supabase.from("profiles").select("*").order("name"),
        supabase.from("user_roles").select("*"),
        supabase.from("production_entries").select("*").order("date", { ascending: false }).limit(1000),
        supabase.from("stock_issues").select("*").order("date", { ascending: false }).limit(1000),
      ]);

      const backup = {
        exported_at: new Date().toISOString(),
        product_categories: categories ?? [],
        product_codes: productCodes ?? [],
        company_clients: clients ?? [],
        profiles: profiles ?? [],
        user_roles: roles ?? [],
        production_entries: productionEntries ?? [],
        stock_issues: stockIssues ?? [],
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chhaperia-backup-${format(new Date(), "yyyy-MM-dd-HHmm")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({ title: "Backup downloaded successfully" });
    } catch (err: any) {
      toast({ title: "Backup failed", description: err.message, variant: "destructive" });
    } finally {
      setBackingUp(false);
    }
  };

  const modalTitles: Record<string, string> = {
    today: "Today's Production Entries",
    week: "This Week's Production Entries",
  };

  const statCards = [
    { label: "Today's Entries", value: stats.today, icon: ClipboardList, color: "text-secondary", modal: "today" as ModalType },
    { label: "This Week", value: stats.week, icon: TrendingUp, color: "text-primary", modal: "week" as ModalType },
  ];

  const renderEntriesTable = (entries: EntryDetail[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Product Code</TableHead>
          <TableHead>Worker</TableHead>
          <TableHead className="text-right">Rolls</TableHead>
          <TableHead className="text-right">Qty/Roll</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Unit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No entries found</TableCell>
          </TableRow>
        ) : (
          entries.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="text-base font-medium whitespace-nowrap">
                {(() => { const d = new Date(e.date); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getFullYear()).slice(-2)}`; })()}
              </TableCell>
              <TableCell className="font-medium">{e.product_codes?.code ?? "—"}</TableCell>
              <TableCell>{e.profiles?.name ?? "—"}</TableCell>
              <TableCell className="text-right">{e.rolls_count}</TableCell>
              <TableCell className="text-right">{e.quantity_per_roll}</TableCell>
              <TableCell className="text-right font-semibold">{e.total_quantity ?? "—"}</TableCell>
              <TableCell>{e.unit}</TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  const renderModalContent = () => {
    if (modalLoading) return <p className="text-center py-8 text-muted-foreground">Loading...</p>;
    if (activeModal === "today") return renderEntriesTable(todayEntries);
    if (activeModal === "week") return renderEntriesTable(weekEntries);
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handleBackup} disabled={backingUp} variant="outline" className="gap-2">
          {backingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Backup Data
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statCards.map((s) => (
          <Card
            key={s.label}
            className="cursor-pointer transition-shadow hover:shadow-md hover:border-primary/30"
            onClick={() => openModal(s.modal)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">Click to view details</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{activeModal ? modalTitles[activeModal] : ""}</DialogTitle>
          </DialogHeader>
          {renderModalContent()}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Production Entries — Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis allowDecimals={false} className="text-xs" />
                <Tooltip />
                <Bar dataKey="entries" fill="hsl(30, 90%, 55%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-secondary" />
            Raw Materials Inventory ({materials.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Current Stock</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No materials found</TableCell>
                </TableRow>
              ) : (
                materials.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.unit}</TableCell>
                    <TableCell className={`text-right font-mono ${m.current_stock <= 0 ? "text-muted-foreground" : ""}`}>
                      {Number(m.current_stock).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget({ id: m.id, name: m.name })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
