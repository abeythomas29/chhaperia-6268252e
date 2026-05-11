import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Login from "./pages/Login";
import AdminLayout from "./layouts/AdminLayout";
import WorkerLayout from "./layouts/WorkerLayout";
import InventoryManagerLayout from "./layouts/InventoryManagerLayout";
import SlittingManagerLayout from "./layouts/SlittingManagerLayout";
import Dashboard from "./pages/admin/Dashboard";
import ProductionLogs from "./pages/admin/ProductionLogs";
import StockManagement from "./pages/admin/StockManagement";
import Products from "./pages/admin/Products";
import Clients from "./pages/admin/Clients";
import UserManagement from "./pages/admin/UserManagement";
import RawMaterials from "./pages/admin/RawMaterials";
import ProductionEntry from "./pages/worker/ProductionEntry";
import ProductionHistory from "./pages/worker/ProductionHistory";
import MyIssues from "./pages/worker/MyIssues";
import InwardEntry from "./pages/inventory/InwardEntry";
import InventoryView from "./pages/inventory/InventoryView";
import InwardHistory from "./pages/inventory/InwardHistory";
import SalesEntry from "./pages/inventory/SalesEntry";
import SalesHistory from "./pages/inventory/SalesHistory";
import SlittingEntry from "./pages/slitting/SlittingEntry";
import SlittingHistory from "./pages/slitting/SlittingHistory";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="logs" element={<ProductionLogs />} />
              <Route path="stock" element={<StockManagement />} />
              <Route path="products" element={<Products />} />
              <Route path="clients" element={<Clients />} />
              <Route path="inventory" element={<RawMaterials />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="sales" element={<SalesHistory />} />
            </Route>
            <Route path="/worker" element={<WorkerLayout />}>
              <Route index element={<ProductionEntry />} />
              <Route path="history" element={<ProductionHistory />} />
              <Route path="stock" element={<StockManagement />} />
              <Route path="inventory" element={<RawMaterials />} />
              <Route path="issues" element={<MyIssues />} />
            </Route>
            <Route path="/inventory" element={<InventoryManagerLayout />}>
              <Route index element={<InwardEntry />} />
              <Route path="view" element={<InventoryView />} />
              <Route path="history" element={<InwardHistory />} />
              <Route path="sales" element={<SalesEntry />} />
              <Route path="sales-history" element={<SalesHistory />} />
            </Route>
            <Route path="/slitting" element={<SlittingManagerLayout />}>
              <Route index element={<SlittingEntry />} />
              <Route path="history" element={<SlittingHistory />} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
