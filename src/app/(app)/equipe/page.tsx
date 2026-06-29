import { TeamClient } from "@/components/team/team-client";
import { requireSession } from "@/lib/auth/session";
import { getTeamData } from "@/lib/data/queries";

export const metadata = {
  title: "Equipe"
};

export default async function TeamPage() {
  const session = await requireSession();
  const data = await getTeamData(session.user.tenantId);

  return <TeamClient data={data} />;
}

