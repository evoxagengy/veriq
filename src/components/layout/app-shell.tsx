import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({
  user,
  children
}: {
  user: {
    name: string;
    role: string;
  };
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <div className="lg:pl-72">
        <Topbar user={user} />
        <main className="px-5 pb-7 md:px-8">{children}</main>
      </div>
    </div>
  );
}

