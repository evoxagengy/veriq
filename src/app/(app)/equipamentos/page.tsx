import { EquipmentClient } from "@/components/equipment/equipment-client";
import { requireSession } from "@/lib/auth/session";
import { getEquipmentData } from "@/lib/data/queries";

export const metadata = {
  title: "Equipamentos"
};

export default async function EquipamentosPage() {
  const session = await requireSession();
  const data = await getEquipmentData(session.user.tenantId);

  return <EquipmentClient data={data} />;
}

