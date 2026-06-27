import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata = {
  title: "Configurações"
};

export default function SettingsPage() {
  return (
    <PlaceholderPage
      icon={Settings}
      title="Configurações"
      description="Configure tenant, segurança, notificações, auditoria e parâmetros do sistema."
    />
  );
}

