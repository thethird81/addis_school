import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { School2 } from "lucide-react";

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <School2 className="h-6 w-6 shrink-0 text-purple-600 group-data-[collapsible=icon]:hidden" />
          <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">
            Addis School Admin
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
