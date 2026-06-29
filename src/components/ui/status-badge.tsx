import { Badge } from "@/components/ui/badge";

const statusMap = {
  ativo: ["success", "Ativo"],
  atrasado: ["danger", "Atrasado"],
  pendente: ["warning", "Pendente"],
  andamento: ["info", "Em andamento"],
  revisao: ["warning", "Em revisão"],
  rascunho: ["neutral", "Rascunho"],
  critico: ["danger", "Crítico"],
  atencao: ["warning", "Atenção"],
  operando: ["success", "Operando"],
  manutencao: ["info", "Em manutenção"],
  inativo: ["neutral", "Inativo"],
  agendado: ["info", "Agendado"],
  concluido: ["success", "Concluído"],
  disponivel: ["success", "Disponível agora"],
  cancelado: ["neutral", "Cancelado"]
} as const;

type StatusKey = keyof typeof statusMap;

export function StatusBadge({ status }: { status: StatusKey }) {
  const [variant, label] = statusMap[status];

  return <Badge variant={variant}>{label}</Badge>;
}
