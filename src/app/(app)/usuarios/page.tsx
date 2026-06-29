import { TeamClient } from "@/components/team/team-client";
import { requireSession } from "@/lib/auth/session";
import { getTeamData } from "@/lib/data/queries";

export const metadata = {
  title: "Usuários"
};

export default async function UsuariosPage() {
  const session = await requireSession();
  const data = await getTeamData(session.user.tenantId, session.user.role);

  return <TeamClient data={data} />;
}
