import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Bot,
  Zap,
  Activity,
  Plug,
  Settings,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "AI", url: "/ai", icon: Bot },
  { title: "Automations", url: "/automations", icon: Zap },
  { title: "Events", url: "/events", icon: Activity },
];

const secondaryItems = [
  { title: "Integrations", url: "/integrations", icon: Plug },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const renderItem = (item: (typeof mainItems)[0]) => {
    const active = isActive(item.url);

    return (
      <SidebarMenuItem key={item.title}>
        <Link
          to={item.url}
          className={`
            relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors
            ${active
              ? "bg-primary/[0.06] text-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }
          `}
        >
          {active && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary" />
          )}
          <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
          {!collapsed && <span>{item.title}</span>}
        </Link>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        {!collapsed && (
          <span className="text-base font-bold text-sidebar-foreground tracking-tight">
            FlowOps
          </span>
        )}
        {collapsed && (
          <span className="text-base font-bold text-sidebar-foreground">F</span>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium px-3 mb-1">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainItems.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-3" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium px-3 mb-1">
            Workspace
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {secondaryItems.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        {!collapsed && (
          <p className="text-[11px] text-muted-foreground/50 px-2">© FlowOps AI</p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
