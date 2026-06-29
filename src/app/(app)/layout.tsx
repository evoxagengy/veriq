import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/session";
import { getShellNotifications } from "@/lib/data/queries";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();
  const notifications = await getShellNotifications(session.user.tenantId, session.user.id, session.user.role);

  return (
    <AppShell
      user={{
        name: session.user.name,
        role: session.user.role,
        tenantName: session.user.tenant.name
      }}
      notifications={notifications}
    >
      {children}
    </AppShell>
  );
}
