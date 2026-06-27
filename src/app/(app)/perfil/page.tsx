import { UserRound } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata = {
  title: "Perfil"
};

export default function ProfilePage() {
  return (
    <PlaceholderPage
      icon={UserRound}
      title="Perfil"
      description="Veja e atualize suas informações de conta de forma segura."
    />
  );
}

