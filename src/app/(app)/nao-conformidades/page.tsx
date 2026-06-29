import { NonConformitiesClient } from "@/components/non-conformities/non-conformities-client";
import { requireSession } from "@/lib/auth/session";
import { getNonConformitiesData } from "@/lib/data/queries";

export const metadata = {
  title: "Não conformidades"
};

export default async function NonConformitiesPage() {
  const session = await requireSession();
  const data = await getNonConformitiesData(session.user.tenantId);

  return <NonConformitiesClient data={data} />;
}

