"use client";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, Video, Flag, Radio, HelpCircle, Users, BookOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    title: "Dashboard Overview",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Videos",
    url: "/dashboard/videos",
    icon: Video,
  },
  {
    title: "Reported Videos",
    url: "/dashboard/reported-videos",
    icon: Flag,
  },
  {
    title: "Channel",
    url: "/dashboard/channel",
    icon: Radio,
  },
  {
    title: "Quiz Management",
    url: "/dashboard/quiz",
    icon: HelpCircle,
  },
  {
    title: "User Management",
    url: "/dashboard/user",
    icon: Users,
  },
  {
    title: "Curriculum",
    url: "/dashboard/curriculum",
    icon: BookOpen,
  },
];

export function NavMain() {
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive = pathname === item.url;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={item.title}
            >
              <Link href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}