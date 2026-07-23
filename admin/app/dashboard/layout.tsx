import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Separator } from "@/components/ui/separator";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <ProtectedRoute>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b md:px-4">
                <SidebarTrigger className="md:hidden" />
                <Separator orientation="vertical" className="h-4 md:hidden" />
              </header>
              <main className="flex-1 overflow-auto p-6">
                {children}
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </ProtectedRoute>
      <Toaster />
    </TooltipProvider>
  );
}
