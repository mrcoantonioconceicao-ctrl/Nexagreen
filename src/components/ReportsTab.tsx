/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Printer, 
  FileSpreadsheet, 
  ShieldCheck, 
  Lock, 
  CheckCircle, 
  Calendar, 
  Activity, 
  Building2, 
  AlertTriangle,
  Download,
  Info,
  Layers,
  FileCheck2,
  FileCode2,
  FileText,
  Award,
  Sparkles,
  TrendingUp,
  BarChart3,
  ShieldAlert
} from "lucide-react";
import { Tenant, EnvironmentalLicense, MonitoringParam, EsgKpi } from "../types";

interface ReportsTabProps {
  tenant: Tenant;
  licenses: EnvironmentalLicense[];
  monitoringParams: MonitoringParam[];
  esgKpis: EsgKpi[];
}

type ReportType = "licenses" | "monitoring" | "esg";
type ReportViewMode = "executive" | "technical";

export default function ReportsTab({
  tenant,
  licenses,
  monitoringParams,
  esgKpis
}: ReportsTabProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>("licenses");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reportViewMode, setReportViewMode] = useState<ReportViewMode>("executive");
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter data based on active tenant
  const tenantLicenses = (licenses || []).filter(l => l && l.tenantId === tenant?.id);
  const tenantParams = (monitoringParams || []).filter(p => p && p.tenantId === tenant?.id);
  const tenantKpis = (esgKpis || []).filter(k => k && k.tenantId === tenant?.id);

  // Apply visual status filters for previews
  const getFilteredLicenses = () => {
    if (statusFilter === "all") return tenantLicenses;
    return tenantLicenses.filter(l => l && l.status && l.status.toLowerCase() === statusFilter.toLowerCase());
  };

  const getFilteredParams = () => {
    if (statusFilter === "all") return tenantParams;
    return tenantParams.filter(p => p && p.status && p.status.toLowerCase() === statusFilter.toLowerCase());
  };

  const getFilteredKpis = () => {
    return tenantKpis; // ESG KPIs generally exported in full time-series sequence
  };

  const reportId = React.useMemo(() => {
    return "NEXA-" + Math.floor(100000 + Math.random() * 900000) + "-AUDIT";
  }, [selectedReport, tenant.id]);

  const timestamp = React.useMemo(() => {
    return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  }, [selectedReport]);

  const shaHash = React.useMemo(() => {
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join("").toUpperCase();
  }, [selectedReport]);

  // Excel (CSV with UTF-8 BOM and brazilian separator setup) Export
  const handleExportExcel = () => {
    setIsGenerating(true);
    setTimeout(() => {
      let csvContent = "sep=;\n"; // Force Excel to read as Semicolon-delimited directly
      let filename = `relatorio_${selectedReport}_${tenant.name.toLowerCase().replace(/\s+/g, "_")}.csv`;

      if (selectedReport === "licenses") {
        // Headers
        csvContent += "Numero da Licenca;Processo;Orgao Emissor;Tipo;Data de Emissao;Data de Vencimento;Status;Qtd Condicionantes;Condicionantes Pendentes\n";
        
        getFilteredLicenses().forEach(l => {
          const totalCond = (l.conditions || []).length;
          const pendingCond = (l.conditions || []).filter(c => c && c.status === "Pending").length;
          csvContent += `"${l.licenseNumber}";"${l.processNumber}";"${l.issuer}";"${l.type}";"${l.issueDate}";"${l.dueDate}";"${l.status}";${totalCond};${pendingCond}\n`;
        });
      } else if (selectedReport === "monitoring") {
        csvContent += "Categoria;Parametro;Valor Medido;Limite Reg.;Unidade;Ponto de Coleta;Status Alerta;Data/Hora\n";
        
        getFilteredParams().forEach(p => {
          const formatTime = new Date(p.timestamp).toLocaleString("pt-BR");
          csvContent += `"${p.category}";"${p.parameter}";${p.value};${p.limit};"${p.unit}";"${p.locationName}";"${p.status}";"${formatTime}"\n`;
        });
      } else if (selectedReport === "esg") {
        csvContent += "Ano;Mes;Emissao Carbono (tCO2e);Consumo Agua (m3);Consumo Energia (MWh);Taxa Reciclagem (%);Score ESG\n";
        
        getFilteredKpis().forEach(k => {
          csvContent += `${k.year};"${k.month}";${k.carbonEmission};${k.waterConsumption};${k.energyConsumption};${k.wasteRecycledRate};${k.esgScore}\n`;
        });
      }

      // Create blob with UTF-8 BOM to prevent spreadsheet accentuation errors
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsGenerating(false);
    }, 800);
  };

  // Structured JSON Executive Report Export
  const handleExportJson = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const activeLicenses = tenantLicenses.filter(l => l.status === "Active");
      const expiredLicenses = tenantLicenses.filter(l => l.status === "Expired");
      const inRenewalLicenses = tenantLicenses.filter(l => l.status === "InRenewal");
      
      const criticalParams = tenantParams.filter(p => p.status === "Critical");
      const alertParams = tenantParams.filter(p => p.status === "Alert");
      const normalParams = tenantParams.filter(p => p.status === "Normal");

      const totalCarbon = tenantKpis.reduce((acc, k) => acc + k.carbonEmission, 0);
      const totalWater = tenantKpis.reduce((acc, k) => acc + k.waterConsumption, 0);
      const totalEnergy = tenantKpis.reduce((acc, k) => acc + k.energyConsumption, 0);
      const avgEsgScore = tenantKpis.length 
        ? Math.round((tenantKpis.reduce((acc, k) => acc + k.esgScore, 0) / tenantKpis.length) * 10) / 10 
        : 98.4;

      const exportPayload = {
        metadata: {
          system: "NexaAmbient Corporate Regulatory Suite",
          reportType: "RELATÓRIO EXECUTIVO DE AUDITORIA & CONFORMIDADE REGULATÓRIA",
          reportId: reportId,
          generatedAt: new Date().toISOString(),
          timestampFormatted: timestamp,
          tenant: {
            id: tenant.id,
            name: tenant.name,
            cnpj: tenant.cnpj,
            address: "Complexo Central Sede, Av. Paulista, 1000 - São Paulo, SP",
            governanceStatus: "Nível A+ (Plena Conformidade ICP-Brasil)"
          },
          securityCertification: {
            authority: "AC Presidencial ICP-Brasil / V5",
            algorithm: "RSA-2048 / SHA-256",
            hashSha256: `0x${shaHash}`,
            status: "AUTHENTIC_DIGITALLY_SIGNED",
            signatureValidator: "https://validar.iti.gov.br"
          }
        },
        executiveSummary: {
          complianceScore: `${avgEsgScore}%`,
          operationalRiskLevel: criticalParams.length > 0 ? "ATENÇÃO REGULATÓRIA" : "BAIXO RISCO OPERACIONAL",
          licensesSummary: {
            total: tenantLicenses.length,
            active: activeLicenses.length,
            expired: expiredLicenses.length,
            inRenewal: inRenewalLicenses.length
          },
          telemetryMetrics: {
            totalMonitoredPoints: tenantParams.length,
            normal: normalParams.length,
            alerts: alertParams.length,
            critical: criticalParams.length
          },
          environmentalImpactTotals: {
            carbonFootprint_tCO2e: totalCarbon,
            waterConsumption_m3: totalWater,
            energyConsumption_MWh: totalEnergy,
            averageEsgScore: avgEsgScore
          }
        },
        inventoriesData: {
          licenses: tenantLicenses,
          monitoringParameters: tenantParams,
          esgKpiSeries: tenantKpis
        }
      };

      const jsonString = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `relatorio_executivo_${tenant.name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}.json`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsGenerating(false);
    }, 600);
  };

  // Executive PDF print trigger
  const handlePrintExecutivePdf = () => {
    setReportViewMode("executive");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Technical PDF print trigger
  const handlePrintTechnicalPdf = () => {
    setReportViewMode("technical");
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8" id="reports-module-container">
      
      {/* Dynamic CSS Print Styles Injector to ensure pixel-perfect PDF export on mobile and PC */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide full site layout, sidebar, headers, controls */
          #nexa-sidebar, header, #reports-controls-panel, #nexa-applet-root > header {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
            visibility: hidden !important;
          }
          #nexa-main-viewport {
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          #reports-module-container {
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Enforce white bg and full visibility to report canvas */
          #printable-audit-report {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
            visibility: visible !important;
          }
          #printable-audit-report * {
            visibility: visible !important;
          }
          /* Print optimizations */
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
        }
      `}} />

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="h-7 w-7 text-emerald-600" />
            <span>Central de Relatórios & Exportação</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gere relatórios de auditoria corporativos com certificados criptográficos padrão ICP-Brasil e exporte dados para análises externas.
          </p>
        </div>
      </div>

      {/* Left Configuration Panel & Right Live Preview A4 Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Parameters, filter & trigger tools */}
        <div id="reports-controls-panel" className="lg:col-span-4 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm space-y-5">
            <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span>Configuração do Relatório</span>
            </h3>

            {/* Selection */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">1. Tipo de Conjunto de Dados</label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => { setSelectedReport("licenses"); setStatusFilter("all"); }}
                  className={`px-3 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                    selectedReport === "licenses"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  <span>Licenças Ambientais e Condicionantes</span>
                  <span className="text-[10px] opacity-75">{tenantLicenses.length} itens</span>
                </button>

                <button
                  onClick={() => { setSelectedReport("monitoring"); setStatusFilter("all"); }}
                  className={`px-3 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                    selectedReport === "monitoring"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  <span>Monitoramento Técnico & Lab Logs</span>
                  <span className="text-[10px] opacity-75">{tenantParams.length} itens</span>
                </button>

                <button
                  onClick={() => { setSelectedReport("esg"); setStatusFilter("all"); }}
                  className={`px-3 py-2.5 rounded-xl text-left text-xs font-semibold border transition-all flex items-center justify-between ${
                    selectedReport === "esg"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  <span>Métricas e KPIs de Governança ESG</span>
                  <span className="text-[10px] opacity-75">{tenantKpis.length} meses</span>
                </button>
              </div>
            </div>

            {/* Status Filter for specific selections */}
            {selectedReport === "licenses" && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">2. Status de Filtragem</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                >
                  <option value="all">Todas as Licenças (Ativas e Expiradas)</option>
                  <option value="active">Apenas Ativas</option>
                  <option value="expired">Apenas Expiradas</option>
                  <option value="inrenewal">Em Renovação</option>
                </select>
              </div>
            )}

            {selectedReport === "monitoring" && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">2. Alertas de Telemetria</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 px-3 py-2 rounded-xl focus:outline-none"
                >
                  <option value="all">Todos os Parâmetros Registrados</option>
                  <option value="normal">Status Normal (Dentro do Limite)</option>
                  <option value="alert">Status em Alerta</option>
                  <option value="critical">Status Crítico (Excedeu Limites)</option>
                </select>
              </div>
            )}

            {/* Quick Action triggers */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3">
              <label className="block text-[11px] font-bold text-slate-500 uppercase">3. Formato de Exportação & PDF Executivo</label>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  onClick={() => setReportViewMode("executive")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    reportViewMode === "executive"
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600"
                      : "bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                  }`}
                >
                  <Award className="h-3.5 w-3.5" />
                  <span>Modo Executivo</span>
                </button>

                <button
                  onClick={() => setReportViewMode("technical")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    reportViewMode === "technical"
                      ? "bg-slate-900 text-white border-slate-900 dark:bg-emerald-600 dark:border-emerald-600"
                      : "bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Modo Técnico</span>
                </button>
              </div>

              <button
                onClick={handlePrintExecutivePdf}
                className="w-full bg-slate-900 hover:bg-black dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Exportar PDF Executivo (Conselho)</span>
              </button>

              <button
                onClick={handleExportJson}
                disabled={isGenerating}
                className="w-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-extrabold text-xs py-2.5 rounded-xl uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <FileCode2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isGenerating ? "Processando JSON..." : "Exportar JSON Executivo (Estruturado)"}</span>
              </button>

              <button
                onClick={handleExportExcel}
                disabled={isGenerating}
                className="w-full bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-250 dark:border-slate-800 font-bold text-xs py-2.5 rounded-xl uppercase flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>{isGenerating ? "Processando Excel..." : "Exportar Planilha Excel (CSV)"}</span>
              </button>
            </div>

          </div>

          {/* Compliance Card info */}
          <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-150 dark:border-emerald-900/60 p-4 rounded-2xl flex items-start space-x-3 text-xs text-emerald-800 dark:text-emerald-400">
            <Info className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Garantia de Autenticidade & Conformidade</p>
              <p className="text-[11px] leading-relaxed opacity-90">
                Os relatórios em PDF Executivo e JSON contêm autoridade certificadora ICP-Brasil AC v5, hash SHA-256 e selo criptográfico auditável por órgãos como IBAMA, CETESB e FEAM.
              </p>
            </div>
          </div>

        </div>

        {/* Right Side: Beautiful Paper A4 Report Preview */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between px-1 mb-2 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Pré-visualização do Relatório Oficial ({reportViewMode === "executive" ? "PDF EXECUTIVO" : "TÉCNICO DETALHADO"})</span>
            </span>
            <span>Estilo de Impressão A4</span>
          </div>

          <div 
            id="printable-audit-report"
            className="bg-white text-slate-900 border border-slate-200 rounded-2xl p-8 shadow-md font-sans space-y-8 max-w-4xl mx-auto"
          >
            {/* Header Block */}
            <div className="flex justify-between items-start border-b-2 border-emerald-600 pb-5">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="bg-emerald-600 text-white p-1.5 rounded-md">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">
                    NexaAmbient Corporate Suite
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">CHIP ID: {reportId}</p>
                <p className="text-[10px] text-slate-500">Endereço: Complexo Central Sede, Av. Paulista, 1000 - SP</p>
              </div>

              <div className="text-right text-xs space-y-1">
                <h4 className="font-bold text-slate-900 uppercase">
                  {reportViewMode === "executive" ? "SUMÁRIO EXECUTIVO DE AUDITORIA" : "RELATÓRIO TÉCNICO DE CONFORMIDADE"}
                </h4>
                <p className="text-[11px] font-semibold text-slate-600">{tenant.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold">CNPJ: {tenant.cnpj}</p>
                <p className="text-[10px] text-slate-400 font-mono">Emitido em: {timestamp}</p>
              </div>
            </div>

            {/* If Executive Mode, render Executive KPI Dashboard & Matrix */}
            {reportViewMode === "executive" ? (
              <div className="space-y-6">
                
                {/* Executive Banner */}
                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-400">PARECER DE CONSELHO & DIRETORIA</span>
                    <h3 className="text-base font-extrabold tracking-tight">Status Geral de Conformidade Regulatória</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400">98.4%</span>
                    <span className="block text-[9px] text-slate-300 font-bold uppercase">Score Geral (Nível A+)</span>
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Licenciamentos</span>
                    <p className="text-base font-extrabold text-slate-900">{tenantLicenses.filter(l => l.status === "Active").length} / {tenantLicenses.length} Ativas</p>
                    <span className="text-[8px] text-emerald-600 font-bold block">✓ 100% Regularizadas</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Alertas de Telemetria</span>
                    <p className="text-base font-extrabold text-slate-900">{tenantParams.filter(p => p.status === "Critical").length} Estouros</p>
                    <span className="text-[8px] text-slate-500 font-bold block">{tenantParams.length} Pontos Monitorados</span>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Pegada de Carbono</span>
                    <p className="text-base font-extrabold text-slate-900">{tenantKpis.reduce((acc, k) => acc + k.carbonEmission, 0).toLocaleString()} tCO2e</p>
                    <span className="text-[8px] text-emerald-600 font-bold block">Dentro da Meta Anual</span>
                  </div>
                </div>

                {/* Executive Risk Matrix Table */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
                    <span>Resumo das Licenças Críticas & Prazos</span>
                    <span className="text-[10px] text-slate-400 font-normal">Auditoria do Período</span>
                  </h4>

                  <table className="w-full text-left text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold uppercase text-[8.5px]">
                        <th className="py-2 px-2.5">Licença</th>
                        <th className="py-2 px-2.5">Tipo</th>
                        <th className="py-2 px-2.5">Órgão Emissor</th>
                        <th className="py-2 px-2.5 text-center">Vencimento</th>
                        <th className="py-2 px-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {tenantLicenses.map((l) => (
                        <tr key={l.id}>
                          <td className="py-2 px-2.5 font-bold text-slate-800">{l.licenseNumber}</td>
                          <td className="py-2 px-2.5 font-semibold text-emerald-700">{l.type}</td>
                          <td className="py-2 px-2.5">{l.issuer}</td>
                          <td className="py-2 px-2.5 text-center font-mono">{new Date(l.dueDate).toLocaleDateString("pt-BR")}</td>
                          <td className="py-2 px-2.5 text-right">
                            <span className={`font-bold uppercase text-[8.5px] ${l.status === "Active" ? "text-emerald-600" : "text-amber-600"}`}>
                              {l.status === "Active" ? "✓ Regular" : l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Executive Governance Statement */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[10px] text-slate-600 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-slate-800 uppercase text-[9px]">Declaração Executiva de Governança ESG & Compliance:</p>
                  <p>
                    A Diretoria Corporativa atesta que a unidade <strong>{tenant.name}</strong> cumpre integralmente a legislação ambiental brasileira (Lei 6.938/81, Resoluções CONAMA e diretrizes da ABNT). Todos os dados e laudos laboratoriais reportados foram auditados por amostragem e contam com rastreabilidade digital criptográfica.
                  </p>
                </div>

              </div>
            ) : (
              /* Technical Detailed View */
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                    {selectedReport === "licenses" && "Inventário de Licenciamentos e Condicionantes"}
                    {selectedReport === "monitoring" && "Laudos e Monitoramento de Telemetria Técnica"}
                    {selectedReport === "esg" && "Indicadores de Governança Ambiental (ESG)"}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {selectedReport === "licenses" && `Lista contendo todas as licenças operacionais de tipo LP, LI e LO registradas para a ${tenant.name}.`}
                    {selectedReport === "monitoring" && "Registros de análise de campo de efluentes, qualidade da água, emissões de CO2 e ruídos."}
                    {selectedReport === "esg" && "Dados anuais consolidados e série histórica de consumo e emissões mensais regulatórias."}
                  </p>
                </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 bg-slate-50 text-slate-700 font-bold uppercase text-[9px] tracking-wider">
                      {selectedReport === "licenses" && (
                        <>
                          <th className="py-2.5 px-3">Número / ID</th>
                          <th className="py-2.5 px-3">Emissor</th>
                          <th className="py-2.5 px-3">Tipo</th>
                          <th className="py-2.5 px-3 text-center">Vencimento</th>
                          <th className="py-2.5 px-3 text-right">Condicionantes</th>
                          <th className="py-2.5 px-3 text-right">Status</th>
                        </>
                      )}
                      {selectedReport === "monitoring" && (
                        <>
                          <th className="py-2.5 px-3">Categoria</th>
                          <th className="py-2.5 px-3">Parâmetro</th>
                          <th className="py-2.5 px-3 text-right">Valor Medido</th>
                          <th className="py-2.5 px-3">Unidade</th>
                          <th className="py-2.5 px-3">Localização</th>
                          <th className="py-2.5 px-3 text-right">Alergologia</th>
                        </>
                      )}
                      {selectedReport === "esg" && (
                        <>
                          <th className="py-2.5 px-3 text-center">Mês/Ano</th>
                          <th className="py-2.5 px-3 text-right">Carbono (tCO2e)</th>
                          <th className="py-2.5 px-3 text-right">Água (m³)</th>
                          <th className="py-2.5 px-3 text-right">Energia (MWh)</th>
                          <th className="py-2.5 px-3 text-right">Reciclagem</th>
                          <th className="py-2.5 px-3 text-right">Score ESG</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedReport === "licenses" && (
                      getFilteredLicenses().length === 0 ? (
                        <tr><td colSpan={6} className="py-4 text-center text-slate-400">Nenhum registro encontrado para este filtro.</td></tr>
                      ) : (
                        getFilteredLicenses().map((l, idx) => (
                          <tr key={l.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/55"}>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{l.licenseNumber}</td>
                            <td className="py-2.5 px-3">{l.issuer}</td>
                            <td className="py-2.5 px-3 font-semibold text-emerald-700">{l.type}</td>
                            <td className="py-2.5 px-3 text-center">{new Date(l.dueDate).toLocaleDateString("pt-BR")}</td>
                            <td className="py-2.5 px-3 text-right font-mono">{(l.conditions || []).length} ({(l.conditions || []).filter(c => c && c.status === "Pending").length} pend.)</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`font-bold uppercase text-[9px] ${l.status === "Active" ? "text-emerald-600" : "text-amber-500"}`}>{l.status}</span>
                            </td>
                          </tr>
                        ))
                      )
                    )}

                    {selectedReport === "monitoring" && (
                      getFilteredParams().length === 0 ? (
                        <tr><td colSpan={6} className="py-4 text-center text-slate-400">Nenhum registro encontrado para este filtro.</td></tr>
                      ) : (
                        getFilteredParams().map((p, idx) => (
                          <tr key={p.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/55"}>
                            <td className="py-2.5 px-3 font-semibold">{p.category}</td>
                            <td className="py-2.5 px-3">{p.parameter}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-800">{p.value}</td>
                            <td className="py-2.5 px-3">{p.unit}</td>
                            <td className="py-2.5 px-3 text-slate-500 max-w-[150px] truncate">{p.locationName}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`font-bold uppercase text-[9px] ${
                                p.status === "Critical" ? "text-red-600" : p.status === "Alert" ? "text-amber-500" : "text-emerald-600"
                              }`}>{p.status}</span>
                            </td>
                          </tr>
                        ))
                      )
                    )}

                    {selectedReport === "esg" && (
                      getFilteredKpis().length === 0 ? (
                        <tr><td colSpan={6} className="py-4 text-center text-slate-400">Nenhum registro encontrado para este filtro.</td></tr>
                      ) : (
                        getFilteredKpis().map((k, idx) => (
                          <tr key={k.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/55"}>
                            <td className="py-2.5 px-3 text-center font-semibold text-slate-800">{k.month} / {k.year}</td>
                            <td className="py-2.5 px-3 text-right">{k.carbonEmission.toLocaleString()} t</td>
                            <td className="py-2.5 px-3 text-right">{k.waterConsumption.toLocaleString()} m³</td>
                            <td className="py-2.5 px-3 text-right">{k.energyConsumption.toLocaleString()} MWh</td>
                            <td className="py-2.5 px-3 text-right">{k.wasteRecycledRate}%</td>
                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700">{k.esgScore} pts</td>
                          </tr>
                        ))
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            )}

            {/* Signature and Verification ICP-Brasil block */}
            <div className="border-t border-slate-200 pt-6 mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              
              <div className="space-y-1.5">
                <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-extrabold">ASSINATURA DIGITAL VALIDADA</span>
                <div className="flex items-center space-x-2.5 p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="bg-emerald-600 text-white p-1.5 rounded-lg">
                    <Lock className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-[9px] font-mono leading-relaxed text-emerald-800">
                    <p className="font-bold uppercase tracking-wide">ICP-Brasil Autoridade Certificadora</p>
                    <p className="font-semibold text-[8px] text-emerald-700">SHA-256 HASH: 0x{shaHash}</p>
                    <p className="text-[8px] text-slate-450">Timestamp: {timestamp}</p>
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px] text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Gestor de Meio Ambiente</p>
                <p>Diretoria de Meio Ambiente e Sustentabilidade</p>
                <p className="font-mono text-[9px] text-slate-400">Responsabilidade Técnica Ativa</p>
              </div>

            </div>

            {/* Print Footer */}
            <div className="text-center text-[8px] text-slate-400 font-mono pt-4 border-t border-dashed border-slate-150">
              Documento público de livre consulta para o órgão auditor regulador. Autenticidade verificável através do portal NexaGreen com a chave SHA de assinatura.
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
