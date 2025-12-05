import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { SelectedRegulationsSidebar } from '@/components/SelectedRegulationsSidebar';

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex">
          <div className="flex-1">
            <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
              <SidebarTrigger />
            </header>
            <div className="p-6">
              <Outlet />
            </div>
          </div>
          <SelectedRegulationsSidebar />
        </main>
      </div>
    </SidebarProvider>
  );
}

