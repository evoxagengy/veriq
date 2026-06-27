"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const conformityData = [
  { day: "12 Mai", value: 39 },
  { day: "13 Mai", value: 70 },
  { day: "14 Mai", value: 44 },
  { day: "15 Mai", value: 75 },
  { day: "16 Mai", value: 84 },
  { day: "17 Mai", value: 61 },
  { day: "18 Mai", value: 86 }
];

const inspectionStatus = [
  { name: "Concluídas", value: 1024, color: "#00D6C9" },
  { name: "Em andamento", value: 162, color: "#2563EB" },
  { name: "Pendentes", value: 78, color: "#F59E0B" },
  { name: "Atrasadas", value: 22, color: "#EF4444" }
];

export function ConformityAreaChart() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={conformityData} margin={{ left: -24, right: 8, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorConformity" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#00D6C9" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#00D6C9" stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} tickFormatter={(value) => `${value}%`} />
          <Tooltip
            cursor={{ stroke: "#00AFA6", strokeWidth: 1 }}
            contentStyle={{
              border: "1px solid #E2E8F0",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.10)"
            }}
            formatter={(value) => [`${value}%`, "Conformidade"]}
          />
          <Area type="monotone" dataKey="value" stroke="#00AFA6" strokeWidth={3} fill="url(#colorConformity)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function InspectionStatusDonut() {
  const total = inspectionStatus.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="grid items-center gap-5 md:grid-cols-[220px_1fr]">
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={inspectionStatus} dataKey="value" innerRadius={68} outerRadius={92} paddingAngle={2}>
              {inspectionStatus.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-3xl font-bold text-primary-dark">{total.toLocaleString("pt-BR")}</p>
            <p className="text-sm text-ink-muted">Total</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {inspectionStatus.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-3 font-medium text-primary">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="text-ink-muted">{item.value.toLocaleString("pt-BR")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

