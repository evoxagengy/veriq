import { FileText } from "lucide-react";
import { PlaceholderPage } from "@/components/layout/placeholder-page";

export const metadata = {
  title: "Relatórios"
};

export default function ReportsPage() {
  return (
    <PlaceholderPage
      icon={FileText}
      title="Relatórios"
      description="Analise conformidade, desempenho operacional, históricos e tendências."
    />
  );
}

