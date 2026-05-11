import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Users,
  Building2,
  LogOut,
  Warehouse,
  Boxes,
  ShoppingCart,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const mainItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Production Logs", url: "/admin/logs", icon: ClipboardList },
  { title: "Stock Management", url: "/admin/stock", icon: Warehouse },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Inventory", url: "/admin/inventory", icon: Boxes },
  { title: "Sales", url: "/admin/sales", icon: ShoppingCart },
  { title: "Clients", url: "/admin/clients", icon: Building2 },
  { title: "User Management", url: "/admin/users", icon: Users },
];

export function AdminSidebar() {
  const { signOut, isSuperAdmin, profileName } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <Link to="/admin" className="flex items-center gap-3">
          <img src={logo} alt="Chhaperia Cables" className="h-9 w-auto" />
          <div>
            <p className="text-sm font-bold text-sidebar-foreground">Chhaperia Cables</p>
            <p className="text-xs text-sidebar-foreground/60">Admin Panel</p>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/admin"} activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-sidebar-foreground/60 truncate">{profileName ?? "Admin"}</span>
          <Button variant="ghost" size="icon" onClick={signOut} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
