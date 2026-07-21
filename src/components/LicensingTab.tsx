/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Plus, 
  Bot, 
  Calendar, 
  User, 
  Paperclip, 
  Sparkles, 
  AlertCircle,
  FileText,
  CheckCircle,
  Clock,
  Check,
  ChevronDown,
  ChevronUp,
  Printer
} from "lucide-react";
import { Tenant, EnvironmentalLicense, TechnicalResponsible, Condition } from "../types";

interface LicensingTabProps {
  tenant: Tenant;
  licenses: EnvironmentalLicense[];
  responsibles: TechnicalResponsible[];
  onAddLicense: (licenseData: any) => Promise<void>;
  onAddCondition: (licenseId: string, conditionData: any) => Promise<void>;
  onFulfillCondition: (conditionId: string, evidenceName: string) => Promise<void>;
  isDbUpdating: boolean;
  onNavigateToTab?: (tab: string) => void;
}

// Built-in Portuguese templates for realistic demo parsing
const DEMO_LICENSES_TEXTS = {
  mineracao: `LICENÇA DE INSTALAÇÃO (LI) Nº 890/2026 - FEAM/MG
PROCESSO: SEMAD 145/2019
EMPREENDIMENTO: Complexo Minerário Alegria - EcoMinas
CONDICIONANTES TÉCNICAS MANDATÓRIAS:
1. O empreendedor deverá implantar cortinas arbóreas com espécies nativas do bioma Cerrado no entorno da pilha de estéril leste até 30 de Outubro de 2026, visando à mitigação do impacto visual e de dispersão de poeira.
2. Fica obrigado o monitoramento diário da integridade das geomembranas do dique de decantação, devendo reportar ao órgão ambiental qualquer indício de percolação ou vazamento no prazo máximo de 48 horas. Data de entrega limite do relatório de ensaio: 2026-11-15.
3. Executar o plano de reassentamento e indenização das famílias da comunidade lindeira de Bento Rodrigues, apresentando o andamento das negociações de forma bimestral, sob pena de suspensão das atividades.`,
  petroleo: `RESOLUÇÃO DE LICENÇA DE OPERAÇÃO (LO) IBAMA Nº 1450/2023
EMPREENDEDOR: PetroNexa S.A.
DIRETRIZES GERAIS E CONDICIONANTES:
Artigo 2º. Garantir que a queima de gases de flare não ultrapasse os limites atmosféricos de óxido de nitrogênio (NOx). Deverá ser entregue o Relatório Técnico de Emissões Atmosféricas Anual até 2026-12-31, assinado por técnico qualificado.
Artigo 5º. Fica determinado o patrulhamento semanal da avifauna costeira no raio de 10km do terminal de Angra, visando registrar possíveis anomalias migratórias decorrentes da iluminação artificial. Prazo de implementação: 2026-09-15. Responsável técnico: Meio Ambiente.`
};

export default function LicensingTab({
  tenant,
  licenses,
  responsibles,
  onAddLicense,
  onAddCondition,
  onFulfillCondition,
  isDbUpdating,
  onNavigateToTab
}: LicensingTabProps) {
  const tenantLicenses = licenses.filter((l) => l.tenantId === tenant.id);

  // Accordion expanding states for licenses
  const [expandedLicenseId, setExpandedLicenseId] = useState<string | null>(
    tenantLicenses[0]?.id || null
  );

  // Add License Modal/Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [processNumber, setProcessNumber] = useState("");
  const [type, setType] = useState<"LP" | "LI" | "LO" | "Authorization" | "Outorga">("LO");
  const [issuer, setIssuer] = useState("");
  const [description, setDescription] = useState("");
  const [issueDate, setIssueDate] = useState("2026-01-01");
  const [dueDate, setDueDate] = useState("2030-01-01");
  const [selectedResp, setSelectedResp] = useState(responsibles[0]?.id || "");

  // AI Parser states
  const [aiInputText, setAiInputText] = useState("");
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [aiParsedConditions, setAiParsedConditions] = useState<any[]>([]);
  const [aiMessage, setAiMessage] = useState("");
  const [aiParseTargetLicenseId, setAiParseTargetLicenseId] = useState("");
  const [aiSimulatedNotice, setAiSimulatedNotice] = useState(false);

  // Manual Condition Form state
  const [manualCondText, setManualCondText] = useState("");
  const [manualCondDueDate, setManualCondDueDate] = useState("2026-12-31");
  const [manualCondTeam, setManualCondTeam] = useState("Meio Ambiente");

  // Evidence submit state
  const [evidenceInput, setEvidenceInput] = useState<{ [key: string]: string }>({});

  const handleCreateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseNumber || !issuer) return;

    await onAddLicense({
      tenantId: tenant.id,
      licenseNumber,
      processNumber,
      type,
      issuer,
      description,
      issueDate,
      dueDate,
      responsibles: [selectedResp],
      conditions: []
    });

    // Reset Form
    setLicenseNumber("");
    setProcessNumber("");
    setIssuer("");
    setDescription("");
    setShowAddForm(false);
  };

  const handleAddManualCondition = async (licenseId: string) => {
    if (!manualCondText) return;
    await onAddCondition(licenseId, {
      description: manualCondText,
      dueDate: manualCondDueDate,
      assignedTeam: manualCondTeam
    });
    setManualCondText("");
  };

  const handleFulfill = async (conditionId: string) => {
    const filename = evidenceInput[conditionId] || "evidencia_doc_assinado.pdf";
    await onFulfillCondition(conditionId, filename);
    // clear evidence input
    setEvidenceInput(prev => ({ ...prev, [conditionId]: "" }));
  };

  const handleTriggerAIParse = async () => {
    if (!aiInputText) return;
    if (!aiParseTargetLicenseId) {
      alert("Por favor, selecione uma licença de destino antes de iniciar a análise por IA.");
      return;
    }
    setIsAiParsing(true);
    setAiParsedConditions([]);
    setAiMessage("");
    setAiSimulatedNotice(false);

    try {
      const response = await fetch("/api/ai/parse-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: aiInputText,
          licenseId: aiParseTargetLicenseId
        })
      });
      const data = await response.json();
      if (data.success) {
        setAiParsedConditions(data.conditions || []);
        setAiMessage(data.message || "");
        setAiSimulatedNotice(!!data.simulated);
      } else {
        setAiMessage("Ocorreu um erro no processador da inteligência artificial: " + data.error);
      }
    } catch (err: any) {
      setAiMessage("Falha ao comunicar com o servidor da NexaAmbient IA.");
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleImportAIConditions = async () => {
    if (aiParsedConditions.length === 0 || !aiParseTargetLicenseId) return;

    for (const cond of aiParsedConditions) {
      await onAddCondition(aiParseTargetLicenseId, {
        description: cond.description,
        dueDate: cond.dueDate,
        assignedTeam: cond.assignedTeam
      });
    }

    setAiParsedConditions([]);
    setAiInputText("");
    setAiMessage("Condicionantes importadas e agendadas com sucesso no seu banco de dados corporativo!");
    // Auto collapse/expand parsed license
    setExpandedLicenseId(aiParseTargetLicenseId);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8" id="licensing-module-container">
      
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Gestão de Licenciamento Ambiental
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controle de processos de LP, LI, LO, Outorgas e autorizações regulatórias federais e estaduais.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab("reports")}
              className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-750 dark:text-slate-200 border border-slate-250 dark:border-slate-800 font-bold text-sm px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all duration-150 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-emerald-600" />
              <span>Exportar Licenças & PDF</span>
            </button>
          )}
          
          <button
            id="btn-trigger-add-license"
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/10 transition-all duration-150 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Cadastrar Nova Licença</span>
          </button>
        </div>
      </div>

      {/* Add License Inline Form */}
      {showAddForm && (
        <form onSubmit={handleCreateLicense} className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 animate-fade-in" id="add-license-form">
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Formulário de Cadastro de Licença</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Identificação / Número da Licença</label>
              <input 
                type="text" 
                required 
                value={licenseNumber} 
                onChange={(e) => setLicenseNumber(e.target.value)} 
                placeholder="Ex: LO Nº 1450/2023"
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Número do Processo de Origem</label>
              <input 
                type="text" 
                value={processNumber} 
                onChange={(e) => setProcessNumber(e.target.value)} 
                placeholder="Ex: IBAMA 02001.003421/2021-99"
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Tipo de Licença / Outorga</label>
              <select 
                value={type} 
                onChange={(e: any) => setType(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="LP">LP - Licença Prévia</option>
                <option value="LI">LI - Licença de Instalação</option>
                <option value="LO">LO - Licença de Operação</option>
                <option value="Authorization">Autorização Ambiental</option>
                <option value="Outorga">Outorga de Captação</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Órgão Emissor / Regulador</label>
              <input 
                type="text" 
                required 
                value={issuer} 
                onChange={(e) => setIssuer(e.target.value)} 
                placeholder="Ex: IBAMA, FEAM-MG, CETESB"
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Data de Emissão</label>
              <input 
                type="date" 
                required 
                value={issueDate} 
                onChange={(e) => setIssueDate(e.target.value)} 
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Data de Vencimento</label>
              <input 
                type="date" 
                required 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)} 
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Escopo Técnico da Licença</label>
            <textarea 
              rows={3}
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Descreva as principais atribuições e atividades permitidas sob o amparo legal desta outorga..."
              className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Responsável Técnico Designado</label>
              <select 
                value={selectedResp} 
                onChange={(e) => setSelectedResp(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              >
                {responsibles.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.creaOrCrq})</option>
                ))}
              </select>
            </div>
            <div className="flex items-end justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={isDbUpdating}
                className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-md shadow-emerald-600/10"
              >
                {isDbUpdating ? "Salvando..." : "Salvar Licença"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Main Grid: Active Licenses Expandable list & AI Parser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Licenses Accordion List (8cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Processos Regulatórios Ativos</h3>
            <span className="text-xs text-slate-500">{tenantLicenses.length} licenças registradas</span>
          </div>

          {tenantLicenses.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-500">
              Nenhuma licença disponível. Clique em "Cadastrar Nova Licença" ou mude o tenant para popular a lista.
            </div>
          ) : (
            tenantLicenses.map((lic) => {
              const isExpanded = expandedLicenseId === lic.id;
              const overdueCount = lic.conditions.filter(c => c.status === "Overdue").length;
              const pendingCount = lic.conditions.filter(c => c.status === "Pending").length;
              
              return (
                <div 
                  key={lic.id} 
                  id={`lic-card-${lic.id}`}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl transition-all duration-200 overflow-hidden shadow-sm ${
                    isExpanded 
                      ? "border-emerald-500 ring-1 ring-emerald-500" 
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-350"
                  }`}
                >
                  {/* Accordion header */}
                  <div 
                    onClick={() => setExpandedLicenseId(isExpanded ? null : lic.id)}
                    className="p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950/40"
                  >
                    <div className="flex space-x-3.5 items-start">
                      <div className="bg-emerald-100 dark:bg-emerald-950/50 p-2.5 rounded-xl text-emerald-750 dark:text-emerald-400 shrink-0 mt-0.5">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white uppercase">{lic.licenseNumber}</span>
                          <span className="bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{lic.type}</span>
                          {lic.status === "Expired" && <span className="bg-red-100 text-red-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Expirada</span>}
                          {lic.status === "InRenewal" && <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">Em Renovação</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Processo: {lic.processNumber} • Emissor: <span className="font-semibold text-slate-700 dark:text-slate-300">{lic.issuer}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="hidden sm:flex items-center space-x-2">
                        {overdueCount > 0 && (
                          <span className="bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-100 dark:border-red-950 text-[10px] font-bold px-2 py-1 rounded-lg">
                            {overdueCount} atrasada(s)
                          </span>
                        )}
                        {pendingCount > 0 && (
                          <span className="bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-350 border border-slate-200 dark:border-slate-800 text-[10px] font-semibold px-2 py-1 rounded-lg">
                            {pendingCount} pendente(s)
                          </span>
                        )}
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </div>
                  </div>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-6">
                      
                      {/* Description & metadata */}
                      <div className="bg-slate-50 dark:bg-slate-950/30 p-4 rounded-xl border border-slate-150 dark:border-slate-850 text-xs space-y-3">
                        <p className="text-slate-750 dark:text-slate-300 leading-relaxed font-medium">
                          {lic.description || "Sem descrição de escopo."}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-200 dark:border-slate-800/80 text-[11px]">
                          <div>
                            <span className="text-slate-400 block font-semibold uppercase">Vigência Inicial</span>
                            <span className="text-slate-700 dark:text-slate-250 font-bold">{new Date(lic.issueDate).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold uppercase">Vencimento Final</span>
                            <span className="text-slate-700 dark:text-slate-250 font-bold">{new Date(lic.dueDate).toLocaleDateString("pt-BR")}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold uppercase">Gestores Designados</span>
                            <span className="text-slate-700 dark:text-slate-250 font-medium">Dra. Heloísa Souza</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-semibold uppercase">Situação Legal</span>
                            <span className="text-slate-700 dark:text-slate-250 font-bold uppercase text-emerald-600">{lic.status}</span>
                          </div>
                        </div>
                      </div>

                      {/* Active Conditionals Title */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Condicionantes da Licença</h4>
                          <span className="text-xs text-slate-500">{lic.conditions.length} condicionantes listadas</span>
                        </div>

                        {/* List items */}
                        {lic.conditions.length === 0 ? (
                          <p className="text-center py-4 text-xs text-slate-450 italic">Nenhuma condicionante adicionada a esta licença ainda. Use o extrator IA ao lado para gerar condicionantes automáticas.</p>
                        ) : (
                          <div className="space-y-3">
                            {lic.conditions.map((cond) => (
                              <div key={cond.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-slate-150 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900 shadow-sm">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    {cond.status === "Fulfilled" ? (
                                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Cumprida</span>
                                    ) : cond.status === "Overdue" ? (
                                      <span className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Atrasada</span>
                                    ) : (
                                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-200 dark:border-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Pendente</span>
                                    )}
                                    <span className="text-[10px] text-slate-450 font-bold uppercase bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800">Setor: {cond.assignedTeam}</span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-850 dark:text-slate-200">{cond.description}</p>
                                  {cond.status === "Fulfilled" && (
                                    <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-semibold flex items-center space-x-1">
                                      <Check className="h-3 w-3" />
                                      <span>Evidência registrada: "{cond.evidenceName}" em {new Date(cond.evidenceDate || "").toLocaleDateString("pt-BR")}</span>
                                    </p>
                                  )}
                                </div>

                                <div className="flex flex-row md:flex-col items-end gap-3 shrink-0">
                                  <div className="text-[10px] text-slate-450 font-bold uppercase text-right">
                                    Vence: {new Date(cond.dueDate).toLocaleDateString("pt-BR")}
                                  </div>
                                  
                                  {cond.status !== "Fulfilled" && (
                                    <div className="flex items-center space-x-1">
                                      <input 
                                        type="text" 
                                        placeholder="Nome do arquivo..." 
                                        value={evidenceInput[cond.id] || ""}
                                        onChange={(e) => setEvidenceInput({ ...evidenceInput, [cond.id]: e.target.value })}
                                        className="text-[10px] px-2 py-1 rounded border border-slate-250 dark:border-slate-750 bg-white dark:bg-slate-900 w-32 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                      />
                                      <button
                                        onClick={() => handleFulfill(cond.id)}
                                        className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-[10px] px-2.5 py-1.5 rounded font-bold uppercase flex items-center space-x-1 cursor-pointer"
                                      >
                                        <Paperclip className="h-3 w-3" />
                                        <span>Evidenciar</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Manual Condition input form block */}
                      <div className="pt-4 border-t border-slate-250/50 dark:border-slate-800/60">
                        <h5 className="text-[11px] font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-3">Adicionar Condicionante Manualmente</h5>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <input 
                            type="text" 
                            placeholder="Descreva a condicionante..." 
                            value={manualCondText}
                            onChange={(e) => setManualCondText(e.target.value)}
                            className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                          />
                          <input 
                            type="date" 
                            value={manualCondDueDate}
                            onChange={(e) => setManualCondDueDate(e.target.value)}
                            className="text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                          />
                          <select 
                            value={manualCondTeam}
                            onChange={(e) => setManualCondTeam(e.target.value)}
                            className="text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                          >
                            <option value="Meio Ambiente">Meio Ambiente</option>
                            <option value="Operações">Operações</option>
                            <option value="Jurídico">Jurídico</option>
                            <option value="SSO & Compliance">SSO & Compliance</option>
                            <option value="Engenharia de Ruídos">Engenharia</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAddManualCondition(lic.id)}
                            className="bg-slate-900 dark:bg-slate-800 hover:bg-black text-white px-4 py-2 rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: AI Licenciamento Extractor (5cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 dark:from-emerald-950/20 dark:to-teal-950/20 border border-emerald-400 dark:border-emerald-900/60 p-6 rounded-2xl shadow-sm text-white space-y-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-emerald-100 dark:text-emerald-400 animate-pulse" />
              <h3 className="text-base font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                <span>Leitor Inteligente NexaAI</span>
                <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-[9px] font-extrabold px-1.5 py-0.5 rounded tracking-widest uppercase">Beta</span>
              </h3>
            </div>
            
            <p className="text-xs text-emerald-50 dark:text-slate-350 leading-relaxed">
              Cole o texto de uma licença (ou use nossos modelos) para analisar e extrair as condicionantes ambientais de forma automatizada usando o modelo <span className="font-bold underline text-slate-900 dark:text-emerald-400">Gemini 3.6-flash</span>.
            </p>

            {/* Quick Demo Template buttons */}
            <div className="space-y-1.5 pt-1">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-100 dark:text-emerald-500">Exemplos de Licenças do Setor:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAiInputText(DEMO_LICENSES_TEXTS.mineracao);
                    // Match to EcoMinas
                    const matchedLic = tenantLicenses.find(l => l.type === "LI") || tenantLicenses[0];
                    if (matchedLic) setAiParseTargetLicenseId(matchedLic.id);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-emerald-50 text-[10px] px-2.5 py-1.5 rounded-lg border border-white/15 transition-all text-left truncate max-w-xs font-semibold cursor-pointer"
                >
                  Mineração de Ferro (LI)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAiInputText(DEMO_LICENSES_TEXTS.petroleo);
                    // Match to PetroNexa
                    const matchedLic = tenantLicenses.find(l => l.type === "LO") || tenantLicenses[0];
                    if (matchedLic) setAiParseTargetLicenseId(matchedLic.id);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-emerald-50 text-[10px] px-2.5 py-1.5 rounded-lg border border-white/15 transition-all text-left truncate max-w-xs font-semibold cursor-pointer"
                >
                  Petrolífera Pré-Sal (LO)
                </button>
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-emerald-100 dark:text-slate-400 uppercase">Texto da Licença Reguladora</label>
              <textarea
                rows={6}
                value={aiInputText}
                onChange={(e) => setAiInputText(e.target.value)}
                placeholder="Cole o escopo ou parágrafos regulatórios oficiais da licença ambiental estadual/federal aqui para mapeamento de tarefas..."
                className="w-full text-xs bg-black/15 dark:bg-slate-900 border border-white/20 dark:border-slate-800 rounded-xl p-3 text-emerald-50 dark:text-slate-100 placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-white/40"
              />
            </div>

            {/* Target License selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-emerald-100 dark:text-slate-400 uppercase">Vincular Condicionantes à Licença de Destino</label>
              <select
                value={aiParseTargetLicenseId}
                onChange={(e) => setAiParseTargetLicenseId(e.target.value)}
                className="w-full text-xs bg-slate-900 border border-white/20 dark:border-slate-800 rounded-xl p-2.5 text-slate-200"
              >
                <option value="">-- Selecione a licença de destino --</option>
                {tenantLicenses.map(l => (
                  <option key={l.id} value={l.id}>{l.licenseNumber} ({l.type}) - {l.issuer}</option>
                ))}
              </select>
            </div>

            {/* Parse submit button */}
            <button
              type="button"
              disabled={isAiParsing || !aiInputText || !aiParseTargetLicenseId}
              onClick={handleTriggerAIParse}
              className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-black text-white text-xs font-bold py-3 rounded-xl flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 animate-spin-slow" />
              <span>{isAiParsing ? "Analisando com Inteligência Artificial..." : "Analisar & Extrair com IA"}</span>
            </button>
          </div>

          {/* AI Parsing Outcomes */}
          {aiMessage && (
            <div className={`p-4 rounded-2xl border text-xs ${
              aiMessage.includes("erro")
                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-800 dark:text-red-400"
                : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400"
            }`}>
              <div className="flex space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="font-semibold">{aiMessage}</p>
              </div>
              {aiSimulatedNotice && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  *Aviso: O applet gerou um escopo simulado de condicionantes de alta fidelidade para teste, pois não há chave do Gemini configurada em Secrets.
                </p>
              )}
            </div>
          )}

          {aiParsedConditions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 animate-slide-up">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Mapeamento Sugerido pela IA ({aiParsedConditions.length})</h4>
                <button
                  type="button"
                  onClick={handleImportAIConditions}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg uppercase flex items-center space-x-1 cursor-pointer"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Importar Todas</span>
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {aiParsedConditions.map((cond, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl space-y-1.5">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-normal">{cond.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>Setor: <strong className="text-slate-700 dark:text-slate-300">{cond.assignedTeam}</strong></span>
                      <span>Prazo sugerido: <strong>{new Date(cond.dueDate).toLocaleDateString("pt-BR")}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
