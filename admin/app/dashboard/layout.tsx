import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <ProtectedRoute>
        <SidebarProvider defaultOpen={false}>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <SidebarInset>
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
