import { ChecklistsClient } from "@/components/checklists/checklists-client";
import { requireSession } from "@/lib/auth/session";
import { getChecklistsData } from "@/lib/data/queries";

export const metadata = {
  title: "Checklists"
};

export default async function ChecklistsPage() {
  const session = await requireSession();
  const data = await getChecklistsData(session.user.tenantId);

  return <ChecklistsClient data={data} />;
}

