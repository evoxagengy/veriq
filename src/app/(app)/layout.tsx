import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await requireSession();

  return (
    <AppShell
      user={{
        name: session.user.name,
        role: session.user.role
      }}
    >
      {children}
    </AppShell>
  );
}

