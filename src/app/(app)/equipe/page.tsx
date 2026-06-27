import { UsersRound } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata = {
  title: "Equipe"
};

export default function TeamPage() {
  return (
    <PlaceholderPage
      icon={UsersRound}
      title="Equipe"
      description="Gerencie usuários, perfis de acesso, permissões e responsabilidades."
    />
  );
}

