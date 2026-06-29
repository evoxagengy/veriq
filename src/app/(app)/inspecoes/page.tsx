import { InspectionsClient } from "@/components/inspections/inspections-client";
import { requireSession } from "@/lib/auth/session";
import { getInspectionsData } from "@/lib/data/queries";

export const metadata = {
  title: "Checklists operador"
};

export default async function InspecoesPage() {
  const session = await requireSession();
  const data = await getInspectionsData(session.user.tenantId, session.user.id, session.user.role);

  return <InspectionsClient data={data} />;
}
