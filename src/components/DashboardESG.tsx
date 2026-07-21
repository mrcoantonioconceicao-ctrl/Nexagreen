/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { 
  TrendingDown, 
  Activity, 
  Droplet, 
  Flame, 
  Trash2, 
  Award, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Clock,
  Printer
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar,
  Cell
} from "recharts";
import { Tenant, EnvironmentalLicense, EsgKpi, Condition } from "../types";

interface DashboardESGProps {
  tenant: Tenant;
  licenses: EnvironmentalLicense[];
  esgKpis: EsgKpi[];
  onNavigateToTab?: (tab: string) => void;
}

// UN ODS standard mappings
const ODS_MAP: { [key: number]: { title: string; color: string; desc: string } } = {
  6: { title: "ODS 6", color: "bg-cyan-600 text-white border-cyan-750", desc: "Água Potável & Saneamento" },
  7: { title: "ODS 7", color: "bg-amber-500 text-slate-900 border-amber-600", desc: "Energia Limpa & Acessível" },
  9: { title: "ODS 9", color: "bg-orange-600 text-white border-orange-750", desc: "Indústria, Inovação & Infraestrutura" },
  11: { title: "ODS 11", color: "bg-yellow-600 text-slate-900 border-yellow-750", desc: "Cidades & Comunidades Sustentáveis" },
  12: { title: "ODS 12", color: "bg-amber-700 text-white border-amber-800", desc: "Consumo & Produção Responsáveis" },
  13: { title: "ODS 13", color: "bg-emerald-700 text-white border-emerald-800", desc: "Ação Contra a Mudança Global do Clima" },
  14: { title: "ODS 14", color: "bg-blue-600 text-white border-blue-750", desc: "Vida na Água" },
  15: { title: "ODS 15", color: "bg-lime-750 text-white border-lime-800", desc: "Vida Terrestre" }
};

export default function DashboardESG({ tenant, licenses, esgKpis, onNavigateToTab }: DashboardESGProps) {
  // Filter KPIs specifically for this tenant
  const tenantKpis = (esgKpis || []).filter(k => k && k.tenantId === tenant?.id);
  const currentKpi = tenantKpis[tenantKpis.length - 1] || {
    carbonEmission: 0,
    waterConsumption: 0,
    energyConsumption: 0,
    wasteRecycledRate: 0,
    esgScore: 0,
    odsAligned: []
  };

  // Compile all conditionals for alerts
  const tenantLicenses = (licenses || []).filter(l => l && l.tenantId === tenant?.id);
  const allConditions = tenantLicenses.flatMap(l => 
    (l.conditions || []).map(c => ({
      ...c,
      licenseNumber: l.licenseNumber,
      issuer: l.issuer
    }))
  );

  const pendingConditions = (allConditions || []).filter(c => c && c.status === "Pending");
  const overdueConditions = (allConditions || []).filter(c => c && c.status === "Overdue");
  const fulfilledConditions = (allConditions || []).filter(c => c && c.status === "Fulfilled");

  // Simulated trend data for interactive charts
  const monthlyTrendData = [
    { month: "Jan", Carbono: currentKpi.carbonEmission * 0.9, Agua: currentKpi.waterConsumption * 0.95, Energia: currentKpi.energyConsumption * 1.05 },
    { month: "Fev", Carbono: currentKpi.carbonEmission * 0.95, Agua: currentKpi.waterConsumption * 0.98, Energia: currentKpi.energyConsumption * 1.02 },
    { month: "Mar", Carbono: currentKpi.carbonEmission * 1.02, Agua: currentKpi.waterConsumption * 1.03, Energia: currentKpi.energyConsumption * 0.98 },
    { month: "Abr", Carbono: currentKpi.carbonEmission * 0.98, Agua: currentKpi.waterConsumption * 0.97, Energia: currentKpi.energyConsumption * 0.95 },
    { month: "Mai", Carbono: currentKpi.carbonEmission * 1.0, Agua: currentKpi.waterConsumption * 1.01, Energia: currentKpi.energyConsumption * 0.99 },
    { month: "Jun", Carbono: currentKpi.carbonEmission, Agua: currentKpi.waterConsumption, Energia: currentKpi.energyConsumption }
  ];

  return (
    <div className="space-y-8 p-6 lg:p-8" id="dashboard-esg-container">
      
      {/* Title Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Dashboard Corporativo & Governança ESG
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Métricas integradas de sustentabilidade, compliance legal e controle operacional da <span className="font-semibold text-slate-700 dark:text-slate-300">{tenant.name}</span>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab("reports")}
              className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-750 dark:text-slate-200 border border-slate-250 dark:border-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4 text-emerald-600" />
              <span>Exportar Relatórios & KPIs</span>
            </button>
          )}
          <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 px-4 py-2 rounded-xl">
            <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Score de Sustentabilidade</div>
              <div className="text-base font-bold text-slate-900 dark:text-white">{currentKpi.esgScore || 85}/100</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Metric Blocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Carbon metric */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" id="metric-carbon">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Emissão Carbono (Mensal)</span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {(currentKpi.carbonEmission || 0).toLocaleString("pt-BR")} <span className="text-xs font-semibold text-slate-500">tCO2e</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              -4.2% comparado ao trimestre anterior
            </p>
          </div>
        </div>

        {/* Water metric */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" id="metric-water">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Consumo de Água (Mensal)</span>
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400">
              <Droplet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {(currentKpi.waterConsumption || 0).toLocaleString("pt-BR")} <span className="text-xs font-semibold text-slate-500">m³</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">
              Captação autorizada por Outorga
            </p>
          </div>
        </div>

        {/* Energy metric */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" id="metric-energy">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Consumo de Energia</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
              <Flame className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {(currentKpi.energyConsumption || 0).toLocaleString("pt-BR")} <span className="text-xs font-semibold text-slate-500">MWh</span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              34% originário de matriz solar/eólica
            </p>
          </div>
        </div>

        {/* Waste metric */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" id="metric-waste">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Taxa de Reciclagem</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400">
              <Trash2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {currentKpi.wasteRecycledRate || 80}%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">
              Destinação certificada Classe I e II
            </p>
          </div>
        </div>

      </div>

      {/* Compliance Warning and State Summary Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Alerts & Critical Conditions Checklist */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2" id="alerts-compliance-panel">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                Alertas Críticos de Licenciamento
              </h3>
            </div>
            <span className="text-[11px] font-semibold uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
              Controle Legal
            </span>
          </div>

          {allConditions.length === 0 ? (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
              Nenhuma condicionante cadastrada para este tenant. Cadastre licenças na aba Licenciamento.
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {/* Overdue alerts */}
              {overdueConditions.map(c => (
                <div key={c.id} className="flex items-start justify-between p-3.5 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-xl">
                  <div className="flex space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {c.description}
                      </p>
                      <div className="flex flex-wrap gap-2 items-center text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                        <span className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Atrasada</span>
                        <span>{c.issuer} - {c.licenseNumber}</span>
                        <span>•</span>
                        <span>Setor: {c.assignedTeam}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-semibold text-red-700 dark:text-red-400 text-right whitespace-nowrap ml-4">
                    Venceu em: {new Date(c.dueDate).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))}

              {/* Pending alerts */}
              {pendingConditions.map(c => {
                const diffTime = Math.abs(new Date(c.dueDate).getTime() - new Date().getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 65 * 60 * 24)); // general calculation
                return (
                  <div key={c.id} className="flex items-start justify-between p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <div className="flex space-x-3">
                      <Clock className="h-5 w-5 text-slate-450 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                          {c.description}
                        </p>
                        <div className="flex flex-wrap gap-2 items-center text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                          <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Pendente</span>
                          <span>{c.issuer} - {c.licenseNumber}</span>
                          <span>•</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">Responsável: {c.assignedTeam}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-right whitespace-nowrap ml-4">
                      Vence em: {new Date(c.dueDate).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                );
              })}

              {/* Fulfiiled alerts */}
              {fulfilledConditions.map(c => (
                <div key={c.id} className="flex items-start justify-between p-3.5 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/30 rounded-xl opacity-75">
                  <div className="flex space-x-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-normal text-slate-700 dark:text-slate-350 line-through leading-snug">
                        {c.description}
                      </p>
                      <div className="flex flex-wrap gap-2 items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                        <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Cumprida</span>
                        <span>Evidência: {c.evidenceName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] font-normal text-emerald-600 dark:text-emerald-550 text-right whitespace-nowrap ml-4">
                    {new Date(c.evidenceDate || "").toLocaleDateString("pt-BR")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alignment UN ODS */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" id="ods-alignment-panel">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              ODS da Agenda 2030
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Alinhamento de metas da organização.
            </p>
          </div>

          {currentKpi.odsAligned && currentKpi.odsAligned.length > 0 ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Esta unidade operacional atende diretamente a {currentKpi.odsAligned.length} ODS principais:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {currentKpi.odsAligned.map(num => {
                  const ods = ODS_MAP[num] || { title: `ODS ${num}`, color: "bg-slate-500 text-white", desc: "Metas Sociais e de Meio Ambiente" };
                  return (
                    <div 
                      key={num} 
                      title={ods.desc}
                      className={`p-3 rounded-xl border ${ods.color} flex flex-col justify-between h-20 transition-transform duration-150 hover:scale-[1.02] cursor-help`}
                    >
                      <span className="text-xs font-extrabold tracking-wide uppercase">{ods.title}</span>
                      <span className="text-[10px] font-medium leading-tight line-clamp-2 truncate whitespace-normal">{ods.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm">
              Nenhuma vinculação de ODS registrada neste tenant.
            </div>
          )}
        </div>

      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Carbon trend area chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" id="chart-carbon-trend">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                Pegada Climática (Histórico de Emissões)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Emissões combinadas de escopo 1, 2 e 3 em toneladas equivalentes de CO2.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
              Escopo Global
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCarbon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15, 23, 42, 0.9)", 
                    borderRadius: "12px", 
                    borderColor: "#334155",
                    color: "#fff"
                  }} 
                  labelStyle={{ fontWeight: "bold", fontSize: "11px", marginBottom: "4px" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Area type="monotone" dataKey="Carbono" name="Carbono (tCO2e)" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCarbon)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Resources double bar chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm" id="chart-resources-trend">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                Eficiência Operacional (Água & Energia)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitoramento integrado de insumos críticos de fabricação por período.
              </p>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
              Recursos
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-slate-800" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15, 23, 42, 0.9)", 
                    borderRadius: "12px", 
                    borderColor: "#334155",
                    color: "#fff"
                  }}
                  labelStyle={{ fontWeight: "bold", fontSize: "11px" }}
                  itemStyle={{ fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="Agua" name="Água (m³)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Energia" name="Energia (MWh)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
}
