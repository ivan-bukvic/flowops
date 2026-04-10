import logo from "@/assets/logo.svg";
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
import { Separator } from "@/components/ui/separator";

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
            relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-all duration-150
            ${active
              ? "bg-primary/[0.08] text-foreground font-semibold"
              : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }
          `}
        >
          {active && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 rounded-r-full bg-primary" />
          )}
          <item.icon className={`h-4 w-4 shrink-0 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
          {!collapsed && <span>{item.title}</span>}
        </Link>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-0 p-0">
        <div className="flex h-14 items-center px-4">
          {!collapsed && (
            <img src={logo} alt="FlowOps" className="h-[2.1rem] text-ring" />
          )}
          {collapsed && (
            <img src={logo} alt="FlowOps" className="h-6 w-6 object-contain object-left" />
          )}
        </div>
        
      </SidebarHeader>

      <SidebarContent className="px-2 pt-4 pb-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground/70 font-semibold px-3 mb-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {mainItems.map(renderItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="my-5" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground/70 font-semibold px-3 mb-2">
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
