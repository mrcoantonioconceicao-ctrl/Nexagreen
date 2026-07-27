/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { 
  TrendingDown, 
  TrendingUp,
  Activity, 
  Droplet, 
  Flame, 
  Trash2, 
  Award, 
  AlertTriangle, 
  CheckCircle,
  CheckCircle2,
  HelpCircle,
  Clock,
  Printer,
  Sparkles,
  BrainCircuit,
  Sliders,
  Target,
  Zap,
  Info,
  ShieldAlert,
  ArrowRight,
  BellRing,
  Bell,
  PlusCircle,
  X,
  AlertOctagon,
  Calendar,
  UserCheck,
  FileText,
  ListChecks,
  Plus,
  ChevronRight,
  ChevronLeft,
  Filter,
  Check,
  ExternalLink,
  FileDown,
  Loader2,
  Download,
  Trophy,
  Building2,
  BarChart3,
  ArrowUpRight,
  SlidersHorizontal
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
  ComposedChart,
  Line,
  ReferenceLine
} from "recharts";
import { Tenant, EnvironmentalLicense, EsgKpi, Condition } from "../types";

interface DashboardESGProps {
  tenant: Tenant;
  licenses: EnvironmentalLicense[];
  esgKpis: EsgKpi[];
  onNavigateToTab?: (tab: string) => void;
}

export interface MitigationTask {
  id: string;
  title: string;
  kpiCategory: "Carbono" | "Água" | "Energia" | "Licenciamento" | "Resíduos";
  priority: "Crítica" | "Alta" | "Média";
  assignedTeam: string;
  targetReduction: string;
  dueDate: string;
  status: "Ativa" | "Concluída";
  createdAt: string;
  riskMonthTriggered: string;
  description: string;
  linkedArea?: string;
  linkedResource?: string;
}

export interface UnitScorecard {
  id: string;
  name: string;
  location: string;
  esgScore: number;
  energyEfficiencyScore: number;
  energyIntensity: number; // MWh/ton
  renewableEnergyPercent: number;
  totalEnergyMWh: number;
  carbonEmissionTons: number;
  waterRecyclePercent: number;
  status: "Líder Eficiência" | "Excelente" | "Em Conformidade" | "Atenção Operacional";
  certification: string;
  initiatives: string[];
}

export interface ComplianceEvent {
  id: string;
  title: string;
  eventType: "license_renewal" | "condition_expiration" | "audit_deadline";
  eventTypeName: "Renovação de Licença" | "Vencimento de Condicionante" | "Prazo de Auditoria";
  date: string; // YYYY-MM-DD
  status: "Overdue" | "Pending" | "Upcoming" | "Fulfilled";
  issuer?: string;
  licenseNumber?: string;
  category: "Carbono" | "Água" | "Energia" | "Licenciamento" | "Resíduos";
  description: string;
  unit?: string;
  priority: "Crítica" | "Alta" | "Média";
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
  // Interactive Predictive Analytics State
  const [forecastHorizon, setForecastHorizon] = useState<number>(6); // 3, 6 or 12 months
  const [selectedScenario, setSelectedScenario] = useState<"baseline" | "expansion" | "decarbonization">("baseline");
  const [efficiencyReduction, setEfficiencyReduction] = useState<number>(10); // 0 to 30% reduction target
  const [predictiveMetric, setPredictiveMetric] = useState<"carbon" | "water" | "energy" | "waste">("carbon");

  // Scorecard ESG Comparativo State
  const [scorecardSortKey, setScorecardSortKey] = useState<
    "energyEfficiency" | "esgScore" | "renewablePercent" | "carbonEmission" | "waterRecycle"
  >("energyEfficiency");
  const [selectedUnitForModal, setSelectedUnitForModal] = useState<UnitScorecard | null>(null);

  // Calendário de Compliance State
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(7); // 7 = August (0-indexed)
  const [selectedEventTypeFilter, setSelectedEventTypeFilter] = useState<"all" | "license_renewal" | "condition_expiration" | "audit_deadline">("all");
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null); // YYYY-MM-DD

  // Preemptive Mitigation Task & Notification State
  const [isMitigationModalOpen, setIsMitigationModalOpen] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [mitigationTasks, setMitigationTasks] = useState<MitigationTask[]>([
    {
      id: "task-init-1",
      title: "Otimização de Reúso Hídrico para Pico em Outubro/2026",
      kpiCategory: "Água",
      priority: "Alta",
      assignedTeam: "Equipe EHS & Operações Ambientais",
      targetReduction: "Redução de 12% na captação no Ponto 01",
      dueDate: "2026-09-25",
      status: "Ativa",
      createdAt: new Date().toISOString(),
      riskMonthTriggered: "Out/2026 (Prev)",
      description: "Instalação de Válvulas de Retenção e Reciclagem de Efluentes no Ponto de Lançamento."
    }
  ]);

  const [newTaskForm, setNewTaskForm] = useState({
    title: "Plano Preventivo: Adequação de Emissões & Eficiência Energética",
    kpiCategory: "Carbono" as "Carbono" | "Água" | "Energia" | "Licenciamento" | "Resíduos",
    priority: "Crítica" as "Crítica" | "Alta" | "Média",
    assignedTeam: "Engenharia Ambiental & Comitê ESG",
    targetReduction: "Redução de 15% tCO2e",
    dueDate: "2026-09-30",
    description: "Substituição de compressores de alta rotação e contratação de PPA mercado livre de energia renovável para neutralizar o pico de emissão projetado.",
    linkedArea: "",
    linkedResource: ""
  });

  // Filter KPIs specifically for this tenant
  const tenantKpis = (esgKpis || []).filter(k => k && k.tenantId === tenant?.id);
  const currentKpi = tenantKpis[tenantKpis.length - 1] || {
    carbonEmission: 1250,
    waterConsumption: 8400,
    energyConsumption: 14200,
    wasteRecycledRate: 85,
    esgScore: 88,
    odsAligned: [6, 7, 12, 13]
  };

  // Comparative ESG Scorecard Units Computation
  const rawUnitsList = useMemo(() => {
    if (tenant?.units && tenant.units.length > 0) {
      return tenant.units;
    }
    return [
      "Unidade Matriz - SP",
      "Planta Industrial II - RJ",
      "Centro de Distribuição - MG",
      "Complexo Operacional Norte - PA",
      "Filial Logística - RS"
    ];
  }, [tenant]);

  const unitScorecards = useMemo<UnitScorecard[]>(() => {
    const list: UnitScorecard[] = rawUnitsList.map((unitName, index) => {
      const baseEff = [96, 89, 83, 76, 70][index % 5];
      const baseRenewable = [94, 87, 75, 62, 54][index % 5];
      const baseEsg = [92, 87, 83, 78, 72][index % 5];
      const baseIntensity = [1.05, 1.18, 1.32, 1.45, 1.58][index % 5];
      const baseEnergyMWh = [2450, 3100, 1890, 4200, 2600][index % 5];
      const baseCarbon = [380, 520, 410, 780, 610][index % 5];
      const baseWater = [92, 85, 78, 64, 58][index % 5];
      const certs = ["ISO 50001 & LEED Gold", "ISO 14001", "Matriz 100% Eólica", "PPA Renovável", "Selo ODS 7"];

      let status: UnitScorecard["status"] = "Em Conformidade";
      if (index === 0) status = "Líder Eficiência";
      else if (baseEsg >= 85) status = "Excelente";
      else if (baseEsg < 75) status = "Atenção Operacional";

      const initiativesList = [
        ["Retrofit 100% LED e Sensores IoT", "Parque Solar Fotovoltaico no Telhado (2.4 MWp)", "Inversores de Frequência de Alta Eficiência IE4"],
        ["Sistema de Reaproveitamento de Calor Residual", "PPA Mercado Livre de Energia Eólica", "Piso Industrial Refletivo e Ventilação Natural"],
        ["Otimização de Rotas e Iluminação Inteligente", "Monitoramento de Demanda em Tempo Real", "Automação de Desligamento de Cargas Secundárias"],
        ["Substituição de Caldeiras a Óleo por Biomassa", "Redução de Perdas Térmicas em Tubulações", "Programa de Conscientização de Uso Consciente"],
        ["Estudo de Viabilidade para Energia Solar Offsite", "Sensores de Corrente para Mitigação de Fator de Potência", "Recuperação de Condensado de Vapor"]
      ];

      return {
        id: `unit-${index + 1}`,
        name: unitName,
        location: ["São Paulo, SP", "Resende, RJ", "Contagem, MG", "Barcarena, PA", "Caxias do Sul, RS"][index % 5],
        esgScore: baseEsg,
        energyEfficiencyScore: baseEff,
        energyIntensity: baseIntensity,
        renewableEnergyPercent: baseRenewable,
        totalEnergyMWh: baseEnergyMWh,
        carbonEmissionTons: baseCarbon,
        waterRecyclePercent: baseWater,
        status,
        certification: certs[index % 5],
        initiatives: initiativesList[index % 5]
      };
    });

    return [...list].sort((a, b) => {
      if (scorecardSortKey === "energyEfficiency") return b.energyEfficiencyScore - a.energyEfficiencyScore;
      if (scorecardSortKey === "esgScore") return b.esgScore - a.esgScore;
      if (scorecardSortKey === "renewablePercent") return b.renewableEnergyPercent - a.renewableEnergyPercent;
      if (scorecardSortKey === "carbonEmission") return a.carbonEmissionTons - b.carbonEmissionTons;
      if (scorecardSortKey === "waterRecycle") return b.waterRecyclePercent - a.waterRecyclePercent;
      return 0;
    });
  }, [rawUnitsList, scorecardSortKey]);

  const topEnergyUnit = useMemo(() => {
    return [...unitScorecards].sort((a, b) => b.energyEfficiencyScore - a.energyEfficiencyScore)[0];
  }, [unitScorecards]);

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

  // Dynamic Compliance Events Compilation for Calendar
  const allComplianceEvents = useMemo<ComplianceEvent[]>(() => {
    const events: ComplianceEvent[] = [];

    // 1. Environmental Licenses Renewals
    tenantLicenses.forEach((lic) => {
      if (!lic) return;
      const expDate = lic.dueDate || "2026-09-15";
      const today = new Date().toISOString().split("T")[0];
      let status: ComplianceEvent["status"] = "Pending";
      if (expDate < today) status = "Overdue";
      else if (lic.status === "Active" || lic.status === "InRenewal") status = "Upcoming";

      events.push({
        id: `lic-${lic.id}`,
        title: `Renovação de Licença (${lic.type}): nº ${lic.licenseNumber}`,
        eventType: "license_renewal",
        eventTypeName: "Renovação de Licença",
        date: expDate,
        status,
        issuer: lic.issuer,
        licenseNumber: lic.licenseNumber,
        category: "Licenciamento",
        description: `Renovação periódica da licença ambiental ${lic.type} emitida por ${lic.issuer}. Exige protocolo prévio de 120 dias.`,
        unit: (tenant?.units && tenant.units[0]) || "Planta Industrial Principal",
        priority: status === "Overdue" ? "Crítica" : "Alta"
      });
    });

    // 2. Legal Conditions Expiration
    allConditions.forEach((cond, idx) => {
      if (!cond) return;
      const dueDate = cond.dueDate || `2026-08-${(12 + idx * 4) % 28 + 1}`;
      let category: ComplianceEvent["category"] = "Licenciamento";
      const dLower = (cond.description || "").toLowerCase();
      if (dLower.includes("água") || dLower.includes("efluente") || dLower.includes("hídrico") || dLower.includes("poço")) category = "Água";
      else if (dLower.includes("emissão") || dLower.includes("carbono") || dLower.includes("ghg") || dLower.includes("co2")) category = "Carbono";
      else if (dLower.includes("energia") || dLower.includes("mwh") || dLower.includes("elétrica")) category = "Energia";
      else if (dLower.includes("resíduo") || dLower.includes("lixo") || dLower.includes("pgrs")) category = "Resíduos";

      let status: ComplianceEvent["status"] = "Pending";
      if (cond.status === "Overdue") status = "Overdue";
      else if (cond.status === "Fulfilled") status = "Fulfilled";
      else status = "Pending";

      events.push({
        id: `cond-${cond.id || idx}`,
        title: `Condicionante: ${cond.description}`,
        eventType: "condition_expiration",
        eventTypeName: "Vencimento de Condicionante",
        date: dueDate,
        status,
        issuer: cond.issuer,
        licenseNumber: cond.licenseNumber,
        category,
        description: `Exigência técnica e legal da licença ${cond.licenseNumber || "vigente"}. Requer elaboração de laudo de comprovação.`,
        unit: (tenant?.units && tenant.units[idx % tenant.units.length]) || "Unidade Operacional",
        priority: status === "Overdue" ? "Crítica" : "Alta"
      });
    });

    // 3. Planned Audits & Regulatory Deadlines
    const auditsList: ComplianceEvent[] = [
      {
        id: "audit-iso-14001",
        title: "Auditoria Anual de Recertificação ISO 14001 & ISO 50001",
        eventType: "audit_deadline",
        eventTypeName: "Prazo de Auditoria",
        date: "2026-08-28",
        status: "Upcoming",
        issuer: "Certificadora BSI / ABNT",
        licenseNumber: "SGI-2026-BR",
        category: "Energia",
        description: "Auditoria externa de conformidade com Gestão Ambiental e Eficiência Energética.",
        unit: "Todas as Unidades",
        priority: "Alta"
      },
      {
        id: "audit-ghg-protocol",
        title: "Verificação Externa do Inventário GHG Protocol (Escopos 1, 2 e 3)",
        eventType: "audit_deadline",
        eventTypeName: "Prazo de Auditoria",
        date: "2026-09-22",
        status: "Upcoming",
        issuer: "Auditoria de Sustentabilidade Independente",
        licenseNumber: "GHG-VERIF-09",
        category: "Carbono",
        description: "Validação independente do relatório de pegada de carbono para submissão ao CDP e GRI.",
        unit: "Unidade Matriz - SP",
        priority: "Alta"
      },
      {
        id: "audit-outorga-agua",
        title: "Vistoria da Agência de Bacia Hídrica (Outorga de Água)",
        eventType: "audit_deadline",
        eventTypeName: "Prazo de Auditoria",
        date: "2026-09-10",
        status: "Upcoming",
        issuer: "Agência Nacional de Águas / DAEE",
        licenseNumber: "OUTORGA-2026-88",
        category: "Água",
        description: "Aferição periódica de hidrômetros e testes de turbidez do efluente tratado.",
        unit: "Planta Industrial II - RJ",
        priority: "Crítica"
      },
      {
        id: "audit-residuos-pgrs",
        title: "Auditoria de Manifesto MTR & Destinação de Resíduos Perigosos",
        eventType: "audit_deadline",
        eventTypeName: "Prazo de Auditoria",
        date: "2026-10-18",
        status: "Upcoming",
        issuer: "Comitê Interno EHS",
        licenseNumber: "PGRS-2026",
        category: "Resíduos",
        description: "Auditoria de rastreabilidade do transporte e incineração de resíduos químicos industriais.",
        unit: "Centro de Distribuição - MG",
        priority: "Média"
      }
    ];

    events.push(...auditsList);

    return events.sort((a, b) => a.date.localeCompare(b.date));
  }, [tenantLicenses, allConditions]);

  const handleCreateTaskFromCalendarEvent = (evt: ComplianceEvent) => {
    setNewTaskForm({
      title: `Ação de Compliance: ${evt.title}`,
      kpiCategory: evt.category,
      priority: evt.priority,
      assignedTeam: evt.issuer ? `Equipe Compliance & EHS (${evt.issuer})` : "Equipe EHS & Regulatory Compliance",
      targetReduction: `Atendimento e regularização integral até ${evt.date}`,
      dueDate: evt.date,
      description: `Tarefa gerada via Calendário de Compliance para garantir o cumprimento do evento "${evt.eventTypeName}: ${evt.title}". Data limite legal: ${evt.date}. Unidade: ${evt.unit || "Planta Principal"}.`,
      linkedArea: evt.unit || "Planta Operacional",
      linkedResource: `${evt.eventTypeName} (${evt.licenseNumber || evt.id})`
    });
    setIsMitigationModalOpen(true);
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const daysInCalendarMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfCalendarMonth = new Date(calendarYear, calendarMonth, 1).getDay();

  const monthEvents = useMemo(() => {
    return allComplianceEvents.filter(evt => {
      const parts = evt.date.split("-");
      if (parts.length < 3) return false;
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const inMonth = y === calendarYear && m === calendarMonth;
      if (!inMonth) return false;
      if (selectedEventTypeFilter !== "all" && evt.eventType !== selectedEventTypeFilter) return false;
      if (selectedCalendarDay && evt.date !== selectedCalendarDay) return false;
      return true;
    });
  }, [allComplianceEvents, calendarYear, calendarMonth, selectedEventTypeFilter, selectedCalendarDay]);

  // Multipliers for selected scenario
  const scenarioMultipliers = {
    baseline: { carbon: 1.0, water: 1.0, energy: 1.01, title: "Cenário Base (Tendência Atual)" },
    expansion: { carbon: 1.15, water: 1.18, energy: 1.20, title: "Expansão Operacional (+15% Demanda)" },
    decarbonization: { carbon: 0.78, water: 0.88, energy: 0.82, title: "Descarbonização Acelerada (Net-Zero)" }
  };

  const activeMult = scenarioMultipliers[selectedScenario];
  const effFactor = 1 - (efficiencyReduction / 100);

  // Real historical trend data (Jan - Jun)
  const baseCarbon = currentKpi.carbonEmission || 1200;
  const baseWater = currentKpi.waterConsumption || 8000;
  const baseEnergy = currentKpi.energyConsumption || 14000;
  const baseWaste = currentKpi.wasteRecycledRate ? Math.round((100 - currentKpi.wasteRecycledRate) * 4.5) + 120 : 180; // Toneladas de resíduos gerados

  const historicalMonths = [
    { month: "Jan", CarbonoReal: Math.round(baseCarbon * 0.88), AguaReal: Math.round(baseWater * 0.92), EnergiaReal: Math.round(baseEnergy * 1.04), ResiduosReal: Math.round(baseWaste * 0.85) },
    { month: "Fev", CarbonoReal: Math.round(baseCarbon * 0.92), AguaReal: Math.round(baseWater * 0.95), EnergiaReal: Math.round(baseEnergy * 1.02), ResiduosReal: Math.round(baseWaste * 0.90) },
    { month: "Mar", CarbonoReal: Math.round(baseCarbon * 1.02), AguaReal: Math.round(baseWater * 1.03), EnergiaReal: Math.round(baseEnergy * 0.98), ResiduosReal: Math.round(baseWaste * 0.96) },
    { month: "Abr", CarbonoReal: Math.round(baseCarbon * 0.96), AguaReal: Math.round(baseWater * 0.97), EnergiaReal: Math.round(baseEnergy * 0.95), ResiduosReal: Math.round(baseWaste * 0.94) },
    { month: "Mai", CarbonoReal: Math.round(baseCarbon * 0.99), AguaReal: Math.round(baseWater * 1.01), EnergiaReal: Math.round(baseEnergy * 0.99), ResiduosReal: Math.round(baseWaste * 0.98) },
    { month: "Jun", CarbonoReal: baseCarbon, AguaReal: baseWater, EnergiaReal: baseEnergy, ResiduosReal: baseWaste }
  ];

  // Predictive forecast months (Jul - Dez)
  const forecastMonthList = [
    { name: "Jul", trend: 1.02, riskMonth: false },
    { name: "Ago", trend: 1.05, riskMonth: false },
    { name: "Set", trend: 1.08, riskMonth: true }, // License condition bottleneck
    { name: "Out", trend: 1.12, riskMonth: true }, // Peak water demand
    { name: "Nov", trend: 1.06, riskMonth: false },
    { name: "Dez", trend: 1.03, riskMonth: false }
  ].slice(0, forecastHorizon);

  const forecastPoints = forecastMonthList.map((m) => {
    const projectedCarbon = Math.round(baseCarbon * m.trend * activeMult.carbon * effFactor);
    const projectedWater = Math.round(baseWater * m.trend * activeMult.water * effFactor);
    const projectedEnergy = Math.round(baseEnergy * m.trend * activeMult.energy * effFactor);
    const projectedWaste = Math.round(baseWaste * m.trend * activeMult.water * (1 - (efficiencyReduction * 0.7 / 100)));

    // Compute predictive compliance risk index for this month (0-100%)
    let monthlyRiskScore = 15;
    if (overdueConditions.length > 0) monthlyRiskScore += overdueConditions.length * 20;
    if (pendingConditions.length > 0) monthlyRiskScore += pendingConditions.length * 8;
    if (m.riskMonth) monthlyRiskScore += 18;
    if (selectedScenario === "expansion") monthlyRiskScore += 15;
    if (efficiencyReduction >= 15) monthlyRiskScore -= 12;
    monthlyRiskScore = Math.min(Math.max(monthlyRiskScore, 8), 95);

    return {
      month: `${m.name} (Prev)`,
      isForecast: true,
      CarbonoPrevisto: projectedCarbon,
      AguaPrevista: projectedWater,
      EnergiaPrevista: projectedEnergy,
      ResiduosPrevisto: projectedWaste,
      RiscoComplianceScore: monthlyRiskScore,
      LimiteCarbonoPermitido: Math.round(baseCarbon * 1.15)
    };
  });

  // Combined dataset for charts
  const combinedTrendAndForecastData = [
    ...historicalMonths.map(h => ({
      ...h,
      isForecast: false,
      CarbonoPrevisto: h.CarbonoReal,
      AguaPrevista: h.AguaReal,
      EnergiaPrevista: h.EnergiaReal,
      ResiduosPrevisto: h.ResiduosReal,
      RiscoComplianceScore: 12 + overdueConditions.length * 15,
      LimiteCarbonoPermitido: Math.round(baseCarbon * 1.15)
    })),
    ...forecastPoints
  ];

  // Calculated overall projected compliance risk score
  const avgForecastRisk = Math.round(
    forecastPoints.reduce((acc, curr) => acc + curr.RiscoComplianceScore, 0) / forecastPoints.length
  );

  const totalForecastCarbon = forecastPoints.reduce((acc, curr) => acc + curr.CarbonoPrevisto, 0);
  const totalForecastWater = forecastPoints.reduce((acc, curr) => acc + curr.AguaPrevista, 0);

  // Risk categorization
  const getRiskBadge = (score: number) => {
    if (score >= 60) return { label: "Alto Risco de Compliance", bg: "bg-red-500/10 text-red-500 border-red-500/20", icon: ShieldAlert };
    if (score >= 35) return { label: "Risco Moderado", bg: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: AlertTriangle };
    return { label: "Baixo Risco (Conforme)", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle };
  };

  const riskBadge = getRiskBadge(avgForecastRisk);
  const RiskIcon = riskBadge.icon;

  // Non-compliance point detection for predictive alert trigger
  const nonCompliancePoint = forecastPoints.find(
    p => p.CarbonoPrevisto > p.LimiteCarbonoPermitido || p.RiscoComplianceScore >= 35
  ) || forecastPoints[0];

  const isPredictiveAlertActive = !alertDismissed && (
    (nonCompliancePoint && nonCompliancePoint.CarbonoPrevisto > nonCompliancePoint.LimiteCarbonoPermitido) ||
    avgForecastRisk >= 30 ||
    selectedScenario === "expansion"
  );

  const handleOpenQuickActionForCondition = (condition: any, isOverdue: boolean) => {
    let category: "Carbono" | "Água" | "Energia" | "Licenciamento" | "Resíduos" = "Licenciamento";
    const descLower = (condition.description || "").toLowerCase();
    if (descLower.includes("água") || descLower.includes("efluente") || descLower.includes("hídrico") || descLower.includes("poço")) {
      category = "Água";
    } else if (descLower.includes("emissão") || descLower.includes("carbono") || descLower.includes("ghg") || descLower.includes("co2")) {
      category = "Carbono";
    } else if (descLower.includes("energia") || descLower.includes("mwh") || descLower.includes("eletricidade") || descLower.includes("solar")) {
      category = "Energia";
    } else if (descLower.includes("resíduo") || descLower.includes("lixo") || descLower.includes("recicla") || descLower.includes("coleta")) {
      category = "Resíduos";
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (isOverdue ? 10 : 25));
    const dueDateStr = targetDate.toISOString().split("T")[0];

    const affectedArea = condition.assignedTeam || "Equipe EHS & Compliance";
    const affectedResource = `${condition.issuer || "Órgão Ambiental"} - ${condition.licenseNumber || "Licença Vigente"}`;

    setNewTaskForm({
      title: `Plano Corretivo: ${condition.description}`,
      kpiCategory: category,
      priority: isOverdue ? "Crítica" : "Alta",
      assignedTeam: affectedArea,
      targetReduction: `Atendimento integral e regularização da condicionante (${condition.licenseNumber})`,
      dueDate: dueDateStr,
      description: `Ação corretiva de emergência gerada via Ação Rápida no Alerta de Conformidade. Vinculada ao órgão ${condition.issuer} e licença ${condition.licenseNumber}.`,
      linkedArea: affectedArea,
      linkedResource: affectedResource
    });

    setIsMitigationModalOpen(true);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    const createdTask: MitigationTask = {
      id: `task-${Date.now()}`,
      title: newTaskForm.title,
      kpiCategory: newTaskForm.kpiCategory,
      priority: newTaskForm.priority,
      assignedTeam: newTaskForm.assignedTeam,
      targetReduction: newTaskForm.targetReduction,
      dueDate: newTaskForm.dueDate,
      status: "Ativa",
      createdAt: new Date().toISOString(),
      riskMonthTriggered: nonCompliancePoint?.month || "Imediato",
      description: newTaskForm.description,
      linkedArea: newTaskForm.linkedArea,
      linkedResource: newTaskForm.linkedResource
    };

    setMitigationTasks(prev => [createdTask, ...prev]);
    setIsMitigationModalOpen(false);
    setToastMessage("Plano de Ação Corretivo criado e vinculado com sucesso à área e recurso afetados!");
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleToggleTaskStatus = (taskId: string) => {
    setMitigationTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: t.status === "Ativa" ? "Concluída" : "Ativa" } : t
    ));
  };

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleDeleteTask = (taskId: string) => {
    setMitigationTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleExportPDF = async () => {
    try {
      setIsExportingPDF(true);
      setToastMessage("Gerando Relatório Preditivo em PDF com Gráficos e Resumo Executivo...");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 14;
      let currentY = 14;

      // Header Banner Box
      pdf.setFillColor(15, 23, 42); // slate-900
      pdf.rect(0, 0, pageWidth, 32, "F");

      // Document Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text("RELATÓRIO PREDITIVO DE SUSTENTABILIDADE & RISCOS ESG", margin, 13);

      // Subtitle / Metadata
      pdf.setFontSize(8.5);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(148, 163, 184); // slate-400
      pdf.text(`Organização: ${tenant.name} | Gerado em: ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`, margin, 20);

      // Score Badge Box in PDF Header
      pdf.setFillColor(16, 185, 129); // emerald-500
      pdf.roundedRect(pageWidth - margin - 38, 7, 38, 17, 3, 3, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      pdf.text("SCORE ESG", pageWidth - margin - 33, 12);
      pdf.setFontSize(11);
      pdf.text(`${currentKpi.esgScore || 85}/100`, pageWidth - margin - 33, 19);

      currentY = 38;

      // --- SECTION 1: EXECUTIVE RISK & COMPLIANCE SUMMARY ---
      pdf.setFillColor(248, 250, 252); // slate-50
      pdf.setDrawColor(226, 232, 240); // slate-200
      pdf.roundedRect(margin, currentY, pageWidth - (margin * 2), 48, 3, 3, "FD");

      pdf.setFontSize(10.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42); // slate-900
      pdf.text("1. RESUMO EXECUTIVO DE RISCOS DE NÃO CONFORMIDADE", margin + 4, currentY + 7);

      // Line divider
      pdf.setDrawColor(203, 213, 225);
      pdf.line(margin + 4, currentY + 10, pageWidth - margin - 4, currentY + 10);

      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(51, 65, 85);

      const summaryText1 = `• Diagnóstico Geral de Risco Preditivo: Índice médio de ${avgForecastRisk}% (${riskBadge.label.toUpperCase()}). Projeção estocástica simulada para horizonte de ${forecastHorizon} meses no ${selectedScenario === "baseline" ? "Cenário Base" : selectedScenario === "expansion" ? "Cenário Expansão (+15%)" : "Cenário Descarbonização"}.`;
      pdf.text(pdf.splitTextToSize(summaryText1, pageWidth - (margin * 2) - 8), margin + 4, currentY + 16);

      const summaryText2 = nonCompliancePoint && nonCompliancePoint.CarbonoPrevisto > nonCompliancePoint.LimiteCarbonoPermitido
        ? `• ALERTA PREDITIVO DE CRITICIDADE: Detectada tendência de ultrapassagem do limite regulatório ambiental em ${nonCompliancePoint.month} (Emissão Projetada: ${nonCompliancePoint.CarbonoPrevisto} tCO2e vs Teto de Licença: ${nonCompliancePoint.LimiteCarbonoPermitido} tCO2e).`
        : `• Conformidade Preditiva de Emissões: Projeções operacionais mantêm-se dentro dos limites autorizados nas licenças vigentes.`;
      pdf.text(pdf.splitTextToSize(summaryText2, pageWidth - (margin * 2) - 8), margin + 4, currentY + 25);

      const summaryText3 = `• Condicionantes & Licenciamento: ${overdueConditions.length} condicionante(s) vencida(s) e ${pendingConditions.length} a vencer em 30 dias. ${mitigationTasks.filter(t => t.status === "Ativa").length} plano(s) de ação corretiva/mitigação ativas.`;
      pdf.text(pdf.splitTextToSize(summaryText3, pageWidth - (margin * 2) - 8), margin + 4, currentY + 34);

      const summaryText4 = `• Diretriz de Eficiência Operacional: Meta de -${efficiencyReduction}% no consumo hídrico e energético. Emissão acumulada total projetada: ${totalForecastCarbon.toLocaleString("pt-BR")} tCO2e.`;
      pdf.text(pdf.splitTextToSize(summaryText4, pageWidth - (margin * 2) - 8), margin + 4, currentY + 43);

      currentY += 54;

      // --- SECTION 2: CRITICAL LEGAL CONDITIONS DETAILS ---
      pdf.setFontSize(10.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      pdf.text("2. DETALHAMENTO DE CONDICIONANTES & ALERTAS AMBIENTAIS", margin, currentY);

      currentY += 5;

      if (overdueConditions.length === 0 && pendingConditions.length === 0) {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(100, 116, 139);
        pdf.text("Nenhuma condicionante com pendência crítica detectada no momento.", margin, currentY + 3);
        currentY += 9;
      } else {
        // Table Header
        pdf.setFillColor(226, 232, 240);
        pdf.rect(margin, currentY, pageWidth - (margin * 2), 6, "F");
        pdf.setFontSize(7.5);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(30, 41, 59);
        pdf.text("Status Risco", margin + 2, currentY + 4);
        pdf.text("Condicionante / Descrição Técnica", margin + 25, currentY + 4);
        pdf.text("Órgão / Licença", margin + 115, currentY + 4);
        pdf.text("Prazo Limite", margin + 155, currentY + 4);

        currentY += 7;

        const allCritical = [
          ...overdueConditions.map(c => ({ ...c, isOverdue: true })),
          ...pendingConditions.map(c => ({ ...c, isOverdue: false }))
        ].slice(0, 5);

        allCritical.forEach((c) => {
          pdf.setFontSize(7);
          pdf.setFont("helvetica", "normal");

          if (c.isOverdue) {
            pdf.setTextColor(220, 38, 38);
            pdf.text("CRÍTICO (VENCIDO)", margin + 2, currentY + 3.5);
          } else {
            pdf.setTextColor(217, 119, 6);
            pdf.text("ATENÇÃO (A VENCER)", margin + 2, currentY + 3.5);
          }

          pdf.setTextColor(15, 23, 42);
          const descTrunc = c.description.length > 55 ? c.description.substring(0, 52) + "..." : c.description;
          pdf.text(descTrunc, margin + 25, currentY + 3.5);

          pdf.setTextColor(71, 85, 105);
          const issuerTrunc = `${c.issuer || "Órgão"} (${c.licenseNumber || "Licença"})`;
          pdf.text(issuerTrunc.substring(0, 24), margin + 115, currentY + 3.5);

          pdf.text(new Date(c.dueDate).toLocaleDateString("pt-BR"), margin + 155, currentY + 3.5);

          pdf.setDrawColor(241, 245, 249);
          pdf.line(margin, currentY + 5, pageWidth - margin, currentY + 5);
          currentY += 6;
        });

        currentY += 4;
      }

      // Ensure space for Chart capture
      if (currentY > pageHeight - 95) {
        pdf.addPage();
        currentY = 14;
      }

      // --- SECTION 3: PREDICTIVE TREND CHART & VISUAL ANALYTICS ---
      pdf.setFontSize(10.5);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(15, 23, 42);
      pdf.text(`3. MÓDULO VISUAL PREDITIVO & TENDÊNCIAS DE CONSUMO (${forecastHorizon} MESES)`, margin, currentY);

      currentY += 5;

      const chartElem = document.getElementById("predictive-analytics-module");
      if (chartElem) {
        const canvas = await html2canvas(chartElem, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#0f172a",
          logging: false
        });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", margin, currentY, imgWidth, Math.min(imgHeight, 115));
        currentY += Math.min(imgHeight, 115) + 6;
      }

      // Page numbers footer
      const totalPages = pdf.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7.5);
        pdf.setTextColor(148, 163, 184);
        pdf.text(`Relatório Preditivo ESG & Compliance — ${tenant.name} — Página ${i} de ${totalPages}`, margin, pageHeight - 7);
      }

      const cleanTenantName = (tenant.name || "Empresa").replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`Relatorio_Preditivo_ESG_${cleanTenantName}_${new Date().toISOString().split("T")[0]}.pdf`);

      setToastMessage("Relatório Preditivo em PDF gerado e baixado com sucesso!");
      setTimeout(() => setToastMessage(null), 4500);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      setToastMessage("Ocorreu um erro ao gerar o PDF. Tente novamente.");
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 relative" id="dashboard-esg-container">
      
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center space-x-3 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="h-5 w-5 text-white shrink-0" />
          <span className="text-xs font-bold tracking-wide">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="hover:opacity-80 p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-500 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center space-x-2 shadow-md transition-all cursor-pointer disabled:opacity-50 hover:shadow-emerald-900/30"
          >
            {isExportingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4 text-white" />
            )}
            <span>{isExportingPDF ? "Gerando PDF..." : "Exportar Relatório Preditivo (PDF)"}</span>
          </button>

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

      {/* Predictive Analytics & Risk Intelligence Module */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden" id="predictive-analytics-module">
        {/* Header with Brain/AI Icon & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-950/50 shrink-0">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Motor Preditivo & Análise de Riscos ESG
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center">
                  <Sparkles className="h-3 w-3 mr-1 inline" /> IA Preditiva Nexa
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Modelagem estocástica e projeção de emissões, estresse hídrico e risco de não conformidade legal para <span className="text-slate-200 font-semibold">{tenant.name}</span>.
              </p>
            </div>
          </div>

          {/* Controls: Horizon & Scenario Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Horizon Selector */}
            <div className="flex bg-slate-950 border border-slate-800 rounded-xl p-1">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setForecastHorizon(m)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    forecastHorizon === m 
                      ? "bg-emerald-600 text-white shadow-sm" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {m} Meses
                </button>
              ))}
            </div>

            {/* Scenario Selector */}
            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500"
            >
              <option value="baseline">Cenário Base (Tendência Atual)</option>
              <option value="expansion">Cenário Expansão (+15% Produção)</option>
              <option value="decarbonization">Cenário Descarbonização (Net-Zero)</option>
            </select>

            {/* Export PDF Button inside module */}
            <button
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-md border border-emerald-500/40 transition-all cursor-pointer disabled:opacity-50"
              title="Baixar Relatório Preditivo em PDF"
            >
              {isExportingPDF ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              <span>{isExportingPDF ? "Exportando..." : "Baixar PDF"}</span>
            </button>
          </div>
        </div>

        {/* Pulsing Visual Alert Banner when Predictive Risk or Non-Compliance is Triggered */}
        {isPredictiveAlertActive && (
          <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-slate-900 to-amber-950/80 border border-red-500/40 shadow-2xl relative overflow-hidden group">
            {/* Flashing ambient background ring */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all pointer-events-none"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start space-x-3.5">
                {/* Pulsing Icon Badge */}
                <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <div className="relative p-2.5 bg-red-500/20 text-red-400 border border-red-500/50 rounded-xl">
                    <BellRing className="h-5 w-5 animate-pulse" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-red-400 tracking-tight flex items-center space-x-1.5">
                      <span>ALERTA PREDITIVO: Tendência de Não Conformidade em {nonCompliancePoint?.month || "Out/2026 (Prev)"}</span>
                    </h4>
                    <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                      Risco {nonCompliancePoint?.RiscoComplianceScore}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed max-w-3xl">
                    A IA preditiva detectou projeção de emissões/recursos ({nonCompliancePoint?.CarbonoPrevisto} tCO2e) atingindo o limite regulatório da licença ({nonCompliancePoint?.LimiteCarbonoPermitido} tCO2e). É recomendado ativar um plano de ação preventiva antes do período de pico.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setIsMitigationModalOpen(true)}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-950/50 flex items-center space-x-2 transition-all transform hover:scale-105 active:scale-95"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Criar Tarefa de Mitigação</span>
                </button>
                <button
                  onClick={() => setAlertDismissed(true)}
                  title="Dispensar Notificação"
                  className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Simulator Controls & KPI Summary Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80">
          {/* Efficiency Target Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300">
              <span className="flex items-center space-x-1.5">
                <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                <span>Meta de Eficiência Energética/Hídrica:</span>
              </span>
              <span className="font-bold font-mono text-emerald-400">-{efficiencyReduction}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="30"
              step="5"
              value={efficiencyReduction}
              onChange={(e) => setEfficiencyReduction(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (Inércia)</span>
              <span>15% (Intermediário)</span>
              <span>30% (Agressivo)</span>
            </div>
          </div>

          {/* Predicted Carbon Accumulation */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Emissão Acumulada Projetada</span>
              <span className="text-lg font-extrabold text-white">
                {totalForecastCarbon.toLocaleString("pt-BR")} <span className="text-xs font-normal text-slate-400">tCO2e</span>
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                Horizontes de {forecastHorizon} meses
              </span>
            </div>
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>

          {/* Predicted Compliance Risk Score */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Índice Preditivo de Risco</span>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className="text-lg font-extrabold text-white">{avgForecastRisk}%</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskBadge.bg}`}>
                  {riskBadge.label}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {overdueConditions.length > 0 ? `${overdueConditions.length} condicionante(s) em atraso` : "Baseado em histórico & metas"}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <RiskIcon className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Main Predictive Chart with Resource Selector */}
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-emerald-400 shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Projeção Preditiva de Consumo de Recursos vs Tendência
              </h4>
            </div>

            {/* Metric Tab Selector */}
            <div className="flex items-center space-x-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => setPredictiveMetric("carbon")}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  predictiveMetric === "carbon"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                Carbono (tCO2e)
              </button>
              <button
                onClick={() => setPredictiveMetric("water")}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  predictiveMetric === "water"
                    ? "bg-cyan-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                Água (m³)
              </button>
              <button
                onClick={() => setPredictiveMetric("energy")}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  predictiveMetric === "energy"
                    ? "bg-amber-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                Energia (MWh)
              </button>
              <button
                onClick={() => setPredictiveMetric("waste")}
                className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all ${
                  predictiveMetric === "waste"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                Resíduos (t)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 text-[11px] text-slate-400 mb-2">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
              <span>Histórico Real</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
              <span>Projeção IA (Próximos {forecastHorizon} Meses)</span>
            </span>
            {predictiveMetric === "carbon" && (
              <span className="flex items-center space-x-1">
                <span className="w-3 h-0.5 bg-red-500 inline-block"></span>
                <span>Teto Licenciado</span>
              </span>
            )}
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedTrendAndForecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(15, 23, 42, 0.95)", 
                    borderRadius: "12px", 
                    borderColor: "#334155",
                    color: "#fff",
                    fontSize: "12px"
                  }}
                  formatter={(value: any, name: any) => {
                    const unitMap = { carbon: "tCO2e", water: "m³", energy: "MWh", waste: "t" };
                    const currentUnit = unitMap[predictiveMetric];
                    if (name === "Real") return [`${value} ${currentUnit}`, "Uso Real"];
                    if (name === "Previsto") return [`${value} ${currentUnit}`, "Projeção IA"];
                    if (name === "RiscoComplianceScore") return [`${value}%`, "Risco Preditivo"];
                    return [value, name];
                  }}
                />
                {predictiveMetric === "carbon" && (
                  <ReferenceLine y={Math.round(baseCarbon * 1.15)} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Teto de Licença (115%)', fill: '#ef4444', fontSize: 10 }} />
                )}

                {/* Render bars based on selected predictive metric */}
                {predictiveMetric === "carbon" && (
                  <>
                    <Bar dataKey="CarbonoReal" name="Real" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={22} />
                    <Bar dataKey="CarbonoPrevisto" name="Previsto" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
                    <Line type="monotone" dataKey="RiscoComplianceScore" name="Risco Compliance (%)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                  </>
                )}

                {predictiveMetric === "water" && (
                  <>
                    <Bar dataKey="AguaReal" name="Real" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={22} />
                    <Bar dataKey="AguaPrevista" name="Previsto" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
                  </>
                )}

                {predictiveMetric === "energy" && (
                  <>
                    <Bar dataKey="EnergiaReal" name="Real" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={22} />
                    <Bar dataKey="EnergiaPrevista" name="Previsto" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
                  </>
                )}

                {predictiveMetric === "waste" && (
                  <>
                    <Bar dataKey="ResiduosReal" name="Real" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={22} />
                    <Bar dataKey="ResiduosPrevisto" name="Previsto" fill="#10b981" radius={[4, 4, 0, 0]} barSize={22} />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Predictive Recommendations */}
        <div className="mt-6 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start space-x-3">
            <Zap className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-slate-200">Gargalo Preditivo Identificado</h5>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Para o mês de <strong className="text-slate-200">Setembro/2026</strong>, a curva preditiva aponta pico de demanda hídrica combinado com a data limite da condicionante de monitoramento de efluentes.
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start space-x-3">
            <Sparkles className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-slate-200">Ação Recomendada (Estratégia ESG)</h5>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Com a meta de eficiência ajustada para <strong className="text-emerald-400">-{efficiencyReduction}%</strong>, prevê-se redução de <strong className="text-emerald-400">{Math.round(totalForecastCarbon * 0.12)} tCO2e</strong> no período, mantendo o score de risco em nível seguro.
              </p>
            </div>
          </div>
        </div>

        {/* Active Preemptive Mitigation Tasks Panel */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center space-x-2.5">
              <ListChecks className="h-5 w-5 text-emerald-400 shrink-0" />
              <h4 className="text-sm font-bold text-white tracking-tight">
                Tarefas de Mitigação Preventiva Ativas
              </h4>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {mitigationTasks.filter(t => t.status === "Ativa").length} Em Acompanhamento
              </span>
            </div>

            <button
              onClick={() => setIsMitigationModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-all shadow-md self-start sm:self-auto"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nova Tarefa Preventiva</span>
            </button>
          </div>

          {mitigationTasks.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-500">
              Nenhuma tarefa de mitigação cadastrada no momento. Clique no botão acima para criar uma.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {mitigationTasks.map((task) => (
                <div 
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all ${
                    task.status === "Concluída"
                      ? "bg-slate-950/40 border-slate-800/60 opacity-60"
                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700 shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase border ${
                        task.priority === "Crítica" 
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : task.priority === "Alta"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      }`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 bg-slate-900 rounded border border-slate-800">
                        {task.kpiCategory}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleToggleTaskStatus(task.id)}
                        className={`p-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
                          task.status === "Concluída"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        }`}
                        title={task.status === "Concluída" ? "Reabrir Tarefa" : "Marcar como Concluída"}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="text-[10px]">{task.status}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-all"
                        title="Excluir Tarefa"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <h5 className="font-bold text-slate-200 text-xs mt-2.5 line-clamp-1">{task.title}</h5>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{task.description}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                    <div className="flex items-center space-x-1">
                      <UserCheck className="h-3 w-3 text-emerald-400 shrink-0" />
                      <span className="truncate">{task.assignedTeam}</span>
                    </div>
                    <div className="flex items-center space-x-1 justify-end">
                      <Calendar className="h-3 w-3 text-amber-400 shrink-0" />
                      <span>Prazo: {task.dueDate}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  <div className="flex flex-col items-end shrink-0 ml-4">
                    <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 whitespace-nowrap">
                      Venceu em: {new Date(c.dueDate).toLocaleDateString("pt-BR")}
                    </span>
                    <button
                      onClick={() => handleOpenQuickActionForCondition(c, true)}
                      className="mt-2 px-3 py-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-[11px] font-bold rounded-lg shadow-md flex items-center space-x-1.5 transition-all transform hover:scale-105 active:scale-95"
                      title="Criar plano de ação corretivo vinculado"
                    >
                      <Zap className="h-3 w-3" />
                      <span>Ação Rápida</span>
                    </button>
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
                    <div className="flex flex-col items-end shrink-0 ml-4">
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        Vence em: {new Date(c.dueDate).toLocaleDateString("pt-BR")}
                      </span>
                      <button
                        onClick={() => handleOpenQuickActionForCondition(c, false)}
                        className="mt-2 px-3 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-[11px] font-bold rounded-lg shadow-md flex items-center space-x-1.5 transition-all transform hover:scale-105 active:scale-95"
                        title="Criar plano de ação corretivo vinculado"
                      >
                        <Zap className="h-3 w-3" />
                        <span>Ação Rápida</span>
                      </button>
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

      {/* Scorecard ESG Comparativo entre Unidades */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6" id="esg-comparative-scorecard">
        
        {/* Component Header with Sorting & Filtering */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                Scorecard ESG Comparativo entre Unidades Operacionais
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ranking comparativo de desempenho ESG para a organização <strong className="text-slate-700 dark:text-slate-200">{tenant?.name}</strong> com destaque em sustentabilidade e eficiência energética.
            </p>
          </div>

          {/* Sort selector controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase text-slate-400 flex items-center space-x-1 mr-1">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Ordenar Por:</span>
            </span>
            <button
              onClick={() => setScorecardSortKey("energyEfficiency")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                scorecardSortKey === "energyEfficiency"
                  ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Eficiência Energética</span>
            </button>

            <button
              onClick={() => setScorecardSortKey("esgScore")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                scorecardSortKey === "esgScore"
                  ? "bg-emerald-600 text-white shadow-md font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Award className="h-3.5 w-3.5" />
              <span>Score ESG</span>
            </button>

            <button
              onClick={() => setScorecardSortKey("renewablePercent")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                scorecardSortKey === "renewablePercent"
                  ? "bg-teal-600 text-white shadow-md font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Energia Limpa (%)</span>
            </button>

            <button
              onClick={() => setScorecardSortKey("carbonEmission")}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer ${
                scorecardSortKey === "carbonEmission"
                  ? "bg-indigo-600 text-white shadow-md font-extrabold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <Target className="h-3.5 w-3.5" />
              <span>Menor Pegada CO2</span>
            </button>
          </div>
        </div>

        {/* Energy Leader Spotlight Banner */}
        {topEnergyUnit && (
          <div className="bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-md">
            <div className="absolute -right-8 -bottom-8 opacity-10 text-amber-400 pointer-events-none">
              <Zap className="h-48 w-48" />
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-slate-950 shadow-lg shrink-0 mt-0.5">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-[10px] uppercase rounded-md tracking-wider flex items-center space-x-1">
                      <Zap className="h-3 w-3 animate-pulse" />
                      <span>LÍDER EM EFICIÊNCIA ENERGÉTICA</span>
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold rounded-md">
                      {topEnergyUnit.certification}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                    {topEnergyUnit.name} ({topEnergyUnit.location})
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                    Sítio operacional com maior rendimento e menor intensidade energética por tonelada processada no tenant (<strong className="text-amber-300">{topEnergyUnit.energyIntensity} MWh/t</strong>).
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 shrink-0 self-end md:self-center">
                <div className="text-right">
                  <p className="text-[10px] text-amber-200 uppercase font-bold">Índice Eficiência</p>
                  <p className="text-xl font-extrabold text-amber-400">{topEnergyUnit.energyEfficiencyScore}%</p>
                  <p className="text-[10px] text-emerald-300 font-medium">{topEnergyUnit.renewableEnergyPercent}% Matriz Renovável</p>
                </div>
                <button
                  onClick={() => setSelectedUnitForModal(topEnergyUnit)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Diagnóstico</span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comparative Ranking Grid / Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Posição</th>
                <th className="py-3 px-3">Unidade Operacional</th>
                <th className="py-3 px-3">Score ESG Geral</th>
                <th className="py-3 px-3">Eficiência Energética</th>
                <th className="py-3 px-3">Energia Renovável</th>
                <th className="py-3 px-3">Pegada CO2</th>
                <th className="py-3 px-3">Reúso Água</th>
                <th className="py-3 px-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {unitScorecards.map((unit, index) => {
                const isTopLeader = unit.id === topEnergyUnit?.id;
                const rankBadgeColors = [
                  "bg-amber-500 text-slate-950 font-black", // #1
                  "bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-white font-bold", // #2
                  "bg-amber-700/60 text-amber-200 font-bold", // #3
                  "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold", // #4
                  "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold"  // #5
                ];

                return (
                  <tr 
                    key={unit.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isTopLeader ? "bg-amber-500/5 dark:bg-amber-500/10" : ""
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${rankBadgeColors[index] || "bg-slate-800 text-slate-300"}`}>
                          {index + 1}
                        </span>
                        {index === 0 && <span title="Top Leader" className="text-amber-500">🥇</span>}
                        {index === 1 && <span title="Vice Leader" className="text-slate-400">🥈</span>}
                        {index === 2 && <span title="3º Lugar" className="text-amber-700">🥉</span>}
                      </div>
                    </td>

                    {/* Unit Name & Location */}
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{unit.name}</span>
                        {isTopLeader && (
                          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-extrabold rounded">
                            Líder ⚡
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{unit.location}</p>
                    </td>

                    {/* Overall ESG Score */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">{unit.esgScore}/100</span>
                        <div className="w-16 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${unit.esgScore >= 85 ? "bg-emerald-500" : unit.esgScore >= 75 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${unit.esgScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Energy Efficiency & Intensity */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1.5">
                          <Zap className={`h-3.5 w-3.5 ${unit.energyEfficiencyScore >= 85 ? "text-amber-400" : "text-slate-400"}`} />
                          <span className="font-bold text-slate-900 dark:text-white">{unit.energyEfficiencyScore}%</span>
                          <span className="text-[10px] text-slate-400 font-mono">({unit.energyIntensity} MWh/t)</span>
                        </div>
                        <div className="w-24 bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${unit.energyEfficiencyScore}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Clean Renewable Energy */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{unit.renewableEnergyPercent}%</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{unit.totalEnergyMWh.toLocaleString("pt-BR")} MWh</p>
                    </td>

                    {/* Carbon Footprint */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {unit.carbonEmissionTons} tCO2e
                      </div>
                    </td>

                    {/* Water Recycling */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-cyan-500 font-semibold">
                        <Droplet className="h-3.5 w-3.5" />
                        <span>{unit.waterRecyclePercent}%</span>
                      </div>
                    </td>

                    {/* Detail Action Button */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedUnitForModal(unit)}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors cursor-pointer"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* Calendário de Compliance */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6" id="compliance-calendar">
        
        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                Calendário de Compliance & Eventos Regulatórios
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Acompanhamento integrado de renovação de licenças, vencimento de condicionantes e prazos de auditoria com criação rápida de tarefas vinculadas.
            </p>
          </div>

          {/* Month Navigator & Event Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Month Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(calendarYear - 1);
                  } else {
                    setCalendarMonth(calendarMonth - 1);
                  }
                  setSelectedCalendarDay(null);
                }}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold px-3 text-slate-900 dark:text-white min-w-[120px] text-center">
                {monthNames[calendarMonth]} {calendarYear}
              </span>
              <button
                onClick={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(calendarYear + 1);
                  } else {
                    setCalendarMonth(calendarMonth + 1);
                  }
                  setSelectedCalendarDay(null);
                }}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setSelectedEventTypeFilter("all")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedEventTypeFilter === "all"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedEventTypeFilter("license_renewal")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedEventTypeFilter === "license_renewal"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Licenças
              </button>
              <button
                onClick={() => setSelectedEventTypeFilter("condition_expiration")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedEventTypeFilter === "condition_expiration"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Condicionantes
              </button>
              <button
                onClick={() => setSelectedEventTypeFilter("audit_deadline")}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  selectedEventTypeFilter === "audit_deadline"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Auditorias
              </button>
            </div>
          </div>
        </div>

        {/* Legend / Category Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Renovação de Licenças</span>
            </div>
            <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
              {allComplianceEvents.filter(e => e.eventType === "license_renewal").length}
            </span>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Vencimento de Condicionantes</span>
            </div>
            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
              {allComplianceEvents.filter(e => e.eventType === "condition_expiration").length}
            </span>
          </div>

          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Prazos de Auditoria ESG</span>
            </div>
            <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
              {allComplianceEvents.filter(e => e.eventType === "audit_deadline").length}
            </span>
          </div>
        </div>

        {/* Main Calendar Body: Grid + Detailed Side List */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Visual Grid (7 Cols x Days) */}
          <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Grade Mensal: {monthNames[calendarMonth]} {calendarYear}
              </span>
              {selectedCalendarDay && (
                <button
                  onClick={() => setSelectedCalendarDay(null)}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Limpar filtro de dia ({selectedCalendarDay.split("-")[2]})
                </button>
              )}
            </div>

            {/* Day Names Row */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 uppercase py-1 border-b border-slate-200 dark:border-slate-800">
              {dayNames.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty leading cells */}
              {Array.from({ length: firstDayOfCalendarMonth }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-14 sm:h-16 rounded-xl bg-slate-100/40 dark:bg-slate-900/40 opacity-30" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInCalendarMonth }).map((_, dayIdx) => {
                const dayNum = dayIdx + 1;
                const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const eventsOnDay = allComplianceEvents.filter(e => e.date === dateStr);
                const isSelected = selectedCalendarDay === dateStr;

                return (
                  <div
                    key={dateStr}
                    onClick={() => {
                      if (eventsOnDay.length > 0) {
                        setSelectedCalendarDay(isSelected ? null : dateStr);
                      }
                    }}
                    className={`h-14 sm:h-16 rounded-xl p-1.5 border transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md ring-2 ring-indigo-400"
                        : eventsOnDay.length > 0
                        ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-indigo-400 shadow-sm"
                        : "bg-white/60 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/80 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-800 dark:text-slate-200"}`}>
                        {dayNum}
                      </span>
                      {eventsOnDay.length > 0 && (
                        <span className={`text-[9px] font-extrabold px-1 rounded ${isSelected ? "bg-white text-indigo-900" : "bg-indigo-500/20 text-indigo-400"}`}>
                          {eventsOnDay.length}
                        </span>
                      )}
                    </div>

                    {/* Indicators for event types on this day */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {eventsOnDay.map((e) => {
                        let dotColor = "bg-blue-500";
                        if (e.eventType === "condition_expiration") dotColor = "bg-amber-500";
                        if (e.eventType === "audit_deadline") dotColor = "bg-purple-500";
                        if (e.status === "Overdue") dotColor = "bg-red-500 animate-ping";

                        return (
                          <span
                            key={e.id}
                            title={`${e.eventTypeName}: ${e.title}`}
                            className={`w-2 h-2 rounded-full ${dotColor}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Events Timeline / Quick Task Creator Side Panel */}
          <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                <ListChecks className="h-4 w-4 text-indigo-500" />
                <span>
                  {selectedCalendarDay 
                    ? `Eventos em ${selectedCalendarDay.split("-").reverse().join("/")}`
                    : `Eventos de ${monthNames[calendarMonth]}`
                  } ({monthEvents.length})
                </span>
              </h4>

              {selectedCalendarDay && (
                <button
                  onClick={() => setSelectedCalendarDay(null)}
                  className="text-[10px] text-slate-400 hover:text-slate-200 underline"
                >
                  Ver mês completo
                </button>
              )}
            </div>

            {/* List of matching events */}
            <div className="space-y-3 overflow-y-auto max-h-[360px] pr-1 flex-1">
              {monthEvents.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto opacity-60" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nenhum evento de compliance pendente
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Nenhum vencimento de licença, condicionante ou auditoria cadastrado para este período/filtro.
                  </p>
                </div>
              ) : (
                monthEvents.map((evt) => {
                  let badgeBg = "bg-blue-500/10 text-blue-500 border-blue-500/30";
                  if (evt.eventType === "condition_expiration") badgeBg = "bg-amber-500/10 text-amber-500 border-amber-500/30";
                  if (evt.eventType === "audit_deadline") badgeBg = "bg-purple-500/10 text-purple-400 border-purple-500/30";

                  return (
                    <div
                      key={evt.id}
                      className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 shadow-sm hover:border-indigo-500/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2 py-0.5 border text-[10px] font-extrabold rounded-md uppercase tracking-wide ${badgeBg}`}>
                          {evt.eventTypeName}
                        </span>

                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          evt.status === "Overdue" 
                            ? "bg-red-500/20 text-red-400 border border-red-500/30" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}>
                          📅 {evt.date.split("-").reverse().join("/")}
                        </span>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          {evt.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {evt.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                        <span className="truncate max-w-[150px]">
                          📍 {evt.unit || evt.issuer || "Geral"}
                        </span>

                        <button
                          onClick={() => handleCreateTaskFromCalendarEvent(evt)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-sm transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <PlusCircle className="h-3 w-3" />
                          <span>Criar Tarefa</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

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
              <AreaChart data={combinedTrendAndForecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Area type="monotone" dataKey="CarbonoPrevisto" name="Carbono (tCO2e)" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCarbon)" />
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
              <BarChart data={combinedTrendAndForecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                <Bar dataKey="AguaPrevista" name="Água (m³)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="EnergiaPrevista" name="Energia (MWh)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Modal: Criar Tarefa de Mitigação Preventiva */}
      {isMitigationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-xl shadow-md">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Criar Tarefa de Mitigação Preventiva
                  </h3>
                  <p className="text-xs text-slate-400">
                    Ação corretiva antecipada para evitar extrapolação de limite de compliance
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMitigationModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateTask} className="mt-5 space-y-4">
              
              {/* Linked Area/Resource Callout Badge if opened via Quick Action */}
              {(newTaskForm.linkedArea || newTaskForm.linkedResource) && (
                <div className="p-3 bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 border border-amber-500/30 rounded-xl space-y-1.5">
                  <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                    <Zap className="h-4 w-4 animate-pulse" />
                    <span>Ação Rápida — Plano Vinculado Automaticamente</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
                    {newTaskForm.linkedArea && (
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        Área/Setor Afetado: <strong className="text-white">{newTaskForm.linkedArea}</strong>
                      </span>
                    )}
                    {newTaskForm.linkedResource && (
                      <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        Recurso/Licença: <strong className="text-amber-300">{newTaskForm.linkedResource}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título da Ação Preventiva / Corretiva *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskForm.title}
                  onChange={(e) => setNewTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                  placeholder="Ex: Adequação de Efluentes para Pico Hídrico de Out/2026"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoria do Parâmetro KPI *
                  </label>
                  <select
                    value={newTaskForm.kpiCategory}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, kpiCategory: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Carbono">Carbono (Emissões CO2e)</option>
                    <option value="Água">Água (Captação / Efluentes)</option>
                    <option value="Energia">Energia (Consumo MWh)</option>
                    <option value="Licenciamento">Licenciamento (Condicionantes)</option>
                    <option value="Resíduos">Resíduos (Reciclagem / Destinação)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nível de Prioridade *
                  </label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="Crítica">Crítica (Urgente)</option>
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Equipe Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTaskForm.assignedTeam}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, assignedTeam: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                    placeholder="Ex: Engenharia EHS / Operações"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Prazo Limite Preventivo *
                  </label>
                  <input
                    type="date"
                    required
                    value={newTaskForm.dueDate}
                    onChange={(e) => setNewTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Meta de Redução Esperada
                </label>
                <input
                  type="text"
                  value={newTaskForm.targetReduction}
                  onChange={(e) => setNewTaskForm(prev => ({ ...prev, targetReduction: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
                  placeholder="Ex: Redução de 15% tCO2e / -10% Consumo Hídrico"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Descrição do Plano Técnico de Ação
                </label>
                <textarea
                  rows={3}
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-100 rounded-xl p-3 focus:outline-none focus:border-emerald-500 font-medium"
                  placeholder="Descreva as etapas técnicas e ações operacionais que serão executadas..."
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMitigationModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/50 flex items-center space-x-2 transition-all transform hover:scale-105"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Salvar & Ativar Mitigação</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Diagnóstico Detalhado da Unidade */}
      {selectedUnitForModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedUnitForModal(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start space-x-3 border-b border-slate-800 pb-4">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-xl">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-extrabold rounded uppercase">
                    Diagnóstico de Unidade
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded">
                    {selectedUnitForModal.certification}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  {selectedUnitForModal.name}
                </h3>
                <p className="text-xs text-slate-400">{selectedUnitForModal.location}</p>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-800/60 border border-slate-800 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Eficiência Energética</p>
                <p className="text-lg font-extrabold text-amber-400 mt-1">{selectedUnitForModal.energyEfficiencyScore}%</p>
                <p className="text-[10px] text-slate-500">{selectedUnitForModal.energyIntensity} MWh/t</p>
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-800 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Energia Renovável</p>
                <p className="text-lg font-extrabold text-teal-400 mt-1">{selectedUnitForModal.renewableEnergyPercent}%</p>
                <p className="text-[10px] text-slate-500">{selectedUnitForModal.totalEnergyMWh} MWh total</p>
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-800 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Emissões de CO2</p>
                <p className="text-lg font-extrabold text-indigo-400 mt-1">{selectedUnitForModal.carbonEmissionTons} t</p>
                <p className="text-[10px] text-slate-500">Escopo 1 + 2 + 3</p>
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-800 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Reúso Hídrico</p>
                <p className="text-lg font-extrabold text-cyan-400 mt-1">{selectedUnitForModal.waterRecyclePercent}%</p>
                <p className="text-[10px] text-slate-500">Taxa Reciclagem</p>
              </div>
            </div>

            {/* Active Initiatives */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <Zap className="h-4 w-4 text-amber-400" />
                <span>Projetos & Iniciativas de Eficiência Energética na Unidade</span>
              </h4>
              <div className="space-y-2">
                {selectedUnitForModal.initiatives.map((init: string, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center space-x-2.5 text-xs text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>{init}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedUnitForModal(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Fechar Diagnóstico
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
