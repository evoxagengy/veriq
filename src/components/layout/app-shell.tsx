import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import type { ShellNotificationsData } from "@/lib/data/queries";

export function AppShell({
  user,
  notifications,
  children
}: {
  user: {
    name: string;
    role: string;
    tenantName: string;
  };
  notifications: ShellNotificationsData;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <div className="lg:pl-72">
        <Topbar user={user} notifications={notifications} />
        <main className="px-5 pb-7 md:px-8">{children}</main>
      </div>
    </div>
  );
}
