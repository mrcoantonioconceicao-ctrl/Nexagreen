/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  ClipboardCheck, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  Plus, 
  TrendingUp, 
  User, 
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Tenant, EnvironmentalAudit, RiskMatrixItem, AuditActionPlan } from "../types";

interface ComplianceTabProps {
  tenant: Tenant;
  audits: EnvironmentalAudit[];
  risks: RiskMatrixItem[];
  onAddActionPlan: (auditId: string, planData: any) => Promise<void>;
  onUpdateActionPlanStatus: (auditId: string, planId: string, status: "NotStarted" | "InProgress" | "Done") => Promise<void>;
  isDbUpdating: boolean;
}

export default function ComplianceTab({
  tenant,
  audits,
  risks,
  onAddActionPlan,
  onUpdateActionPlanStatus,
  isDbUpdating
}: ComplianceTabProps) {
  const tenantAudits = audits.filter(a => a.tenantId === tenant.id);

  // States
  const [selectedRiskCategory, setSelectedRiskCategory] = useState<string | null>(null);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(
    tenantAudits[0]?.id || null
  );

  // Form states for new Action Plan
  const [planTitle, setPlanTitle] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [planAssigned, setPlanAssigned] = useState("Ing. Amanda Rezende");
  const [planDueDate, setPlanDueDate] = useState("2026-08-30");
  const [planPriority, setPlanPriority] = useState<"Low" | "Medium" | "High">("Medium");

  const handleCreateActionPlan = async (e: React.FormEvent, auditId: string) => {
    e.preventDefault();
    if (!planTitle) return;

    await onAddActionPlan(auditId, {
      title: planTitle,
      description: planDesc,
      assignedTo: planAssigned,
      dueDate: planDueDate,
      priority: planPriority
    });

    // Reset Form
    setPlanTitle("");
    setPlanDesc("");
  };

  const handleTogglePlanDone = async (auditId: string, planId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Done" ? "InProgress" : "Done";
    await onUpdateActionPlanStatus(auditId, planId, nextStatus);
  };

  // Compute stats of audits
  const totalNonConformities = tenantAudits.reduce((sum, a) => sum + a.nonConformities, 0);

  // Filtered risks based on matrix interaction
  const filteredRisks = selectedRiskCategory 
    ? risks.filter(r => r.category === selectedRiskCategory)
    : risks;

  return (
    <div className="p-6 lg:p-8 space-y-8" id="compliance-module-container">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Compliance, Auditorias & Riscos
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestão de não-conformidades de auditorias regulatórias de terceiros (Bureau Veritas, SGS, IBAMA) e matriz de probabilidade vs impacto.
          </p>
        </div>

        <div className="flex bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl items-center space-x-3 text-xs shadow-sm">
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          <div>
            <span className="text-[10px] block font-bold uppercase text-slate-400 tracking-wider">Passivos Não Cumpridos</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{totalNonConformities} Não-Conformidades Ativas</span>
          </div>
        </div>
      </div>

      {/* Grid: Risks Matrix interactive & Audits list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive 3x3 Risk matrix (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">Matriz de Severidade de Riscos</h3>
              <p className="text-xs text-slate-400 mt-0.5">Clique nas categorias de perigo para filtrar mitigadores cadastrados.</p>
            </div>

            {/* Simulated 3x3 grid layout */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase">
              <div 
                onClick={() => setSelectedRiskCategory("Reputational")}
                className={`p-4 rounded-xl border flex flex-col justify-between h-20 transition-all cursor-pointer ${
                  selectedRiskCategory === "Reputational"
                    ? "bg-indigo-650 text-white border-indigo-700 shadow"
                    : "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 border-indigo-150 hover:bg-indigo-100"
                }`}
              >
                <span>Impacto Médio</span>
                <span>Reputacional</span>
              </div>
              <div 
                onClick={() => setSelectedRiskCategory("Operational")}
                className={`p-4 rounded-xl border flex flex-col justify-between h-20 transition-all cursor-pointer ${
                  selectedRiskCategory === "Operational"
                    ? "bg-red-650 text-white border-red-700 shadow animate-pulse"
                    : "bg-red-50 dark:bg-red-950/20 text-red-700 border-red-150 hover:bg-red-100"
                }`}
              >
                <span>Impacto Alto</span>
                <span>Operacional</span>
              </div>
              <div 
                onClick={() => setSelectedRiskCategory("Legal")}
                className={`p-4 rounded-xl border flex flex-col justify-between h-20 transition-all cursor-pointer ${
                  selectedRiskCategory === "Legal"
                    ? "bg-amber-650 text-slate-900 border-amber-700 shadow"
                    : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 border-amber-150 hover:bg-amber-100"
                }`}
              >
                <span>Impacto Alto</span>
                <span>Legal / Regulatório</span>
              </div>
            </div>

            {selectedRiskCategory && (
              <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg text-xs">
                <span>Filtrado por: <strong>{selectedRiskCategory}</strong></span>
                <button 
                  onClick={() => setSelectedRiskCategory(null)}
                  className="text-red-500 font-bold hover:underline"
                >
                  Limpar Filtro
                </button>
              </div>
            )}

            {/* Filtered risks items */}
            <div className="space-y-3 pt-2">
              <span className="block text-[10px] font-extrabold uppercase text-slate-400">Mitigação de Perigos de Conformidade:</span>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {filteredRisks.map(r => (
                  <div key={r.id} className="p-3.5 border border-slate-150 dark:border-slate-850 rounded-xl space-y-2 bg-white dark:bg-slate-900 shadow-sm text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white leading-normal">{r.hazard}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        r.riskScore >= 7 ? "bg-red-100 text-red-800" : r.riskScore >= 4 ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        Score: {r.riskScore}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-550 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-2 rounded border border-slate-100 dark:border-slate-800">
                      <strong>Plano de Contingência:</strong> {r.mitigationPlan}
                    </div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Categoria: {r.category}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Audits List Expandable (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Auditorias Técnicas Governamentais</h3>
            <span className="text-xs text-slate-500">{tenantAudits.length} auditorias reportadas</span>
          </div>

          {tenantAudits.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 p-8 rounded-2xl text-center text-slate-500">
              Nenhuma auditoria reportada para este tenant.
            </div>
          ) : (
            tenantAudits.map(aud => {
              const isExpanded = expandedAuditId === aud.id;
              return (
                <div 
                  key={aud.id} 
                  id={`audit-card-${aud.id}`}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl transition-all duration-200 overflow-hidden shadow-sm ${
                    isExpanded ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-200 dark:border-slate-800 hover:border-slate-350"
                  }`}
                >
                  {/* Header */}
                  <div 
                    onClick={() => setExpandedAuditId(isExpanded ? null : aud.id)}
                    className="p-5 flex items-center justify-between cursor-pointer bg-slate-50/50 dark:bg-slate-950/20 hover:bg-slate-50 dark:hover:bg-slate-950/40"
                  >
                    <div className="flex space-x-3.5 items-start">
                      <div className="bg-emerald-100 dark:bg-emerald-950/50 p-2.5 rounded-xl text-emerald-750 dark:text-emerald-400 shrink-0 mt-0.5">
                        <ClipboardCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white">{aud.auditor}</span>
                          <span className="bg-slate-200 dark:bg-slate-850 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-[9px] font-bold uppercase">{aud.status}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Data: {new Date(aud.date).toLocaleDateString("pt-BR")} • Escopo: {aud.scope}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-500">Pontuação</div>
                        <div className="text-sm font-extrabold text-emerald-600">{aud.score}/100</div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                    </div>
                  </div>

                  {/* Expandable Action Plans details */}
                  {isExpanded && (
                    <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-6">
                      
                      {/* Action plans lists */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest">Planos de Ação Preventivos / Corretivos</h4>
                          <span className="text-xs text-slate-500">{aud.actionPlans.length} planos ativos</span>
                        </div>

                        {aud.actionPlans.length === 0 ? (
                          <div className="p-4 bg-emerald-50/20 rounded-xl border border-dashed border-emerald-200 text-center text-xs text-emerald-700">
                            Sem não-conformidades ativas! Todos os passivos da fiscalização foram solucionados.
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {aud.actionPlans.map(plan => (
                              <div key={plan.id} className="p-4 border border-slate-150 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900/40 flex flex-col sm:flex-row justify-between gap-3 text-xs shadow-sm">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <input 
                                      type="checkbox" 
                                      checked={plan.status === "Done"}
                                      onChange={() => handleTogglePlanDone(aud.id, plan.id, plan.status)}
                                      className="rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className={`font-bold ${plan.status === "Done" ? "line-through text-slate-400" : "text-slate-800 dark:text-slate-200"}`}>{plan.title}</span>
                                    <span className={`text-[8px] font-bold px-1 rounded uppercase ${
                                      plan.priority === "High" ? "bg-red-100 text-red-850" : "bg-slate-100 text-slate-700"
                                    }`}>
                                      {plan.priority}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 pl-5">{plan.description}</p>
                                  <div className="flex items-center space-x-2 pl-5 text-[10px] text-slate-400 pt-1">
                                    <User className="h-3 w-3" />
                                    <span>Resp: {plan.assignedTo}</span>
                                    <span>•</span>
                                    <Calendar className="h-3 w-3" />
                                    <span>Vence: {new Date(plan.dueDate).toLocaleDateString("pt-BR")}</span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    plan.status === "Done" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {plan.status === "Done" ? "Resolvido" : "Em Execução"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Add corrective plan Inline Form */}
                      <form onSubmit={(e) => handleCreateActionPlan(e, aud.id)} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                        <h5 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest">Inserir Novo Plano de Mitigação</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Título do Plano de Ação</label>
                            <input
                              type="text"
                              required
                              value={planTitle}
                              onChange={(e) => setPlanTitle(e.target.value)}
                              placeholder="Ex: Reforçar marcação do solo químico"
                              className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Responsável Designado</label>
                            <input
                              type="text"
                              required
                              value={planAssigned}
                              onChange={(e) => setPlanAssigned(e.target.value)}
                              placeholder="Ex: Dr. Carlos Eduardo Malta"
                              className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Detalhamento Técnico das Tarefas</label>
                            <textarea
                              rows={2}
                              value={planDesc}
                              onChange={(e) => setPlanDesc(e.target.value)}
                              placeholder="Passo a passo descritivo para mitigação de risco e reporte documental..."
                              className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data de Conclusão Máxima</label>
                            <input
                              type="date"
                              required
                              value={planDueDate}
                              onChange={(e) => setPlanDueDate(e.target.value)}
                              className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Prioridade</label>
                            <select
                              value={planPriority}
                              onChange={(e: any) => setPlanPriority(e.target.value)}
                              className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-slate-900"
                            >
                              <option value="Low">Baixa</option>
                              <option value="Medium">Média</option>
                              <option value="High">Alta (Crítica)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            type="submit"
                            disabled={isDbUpdating || !planTitle}
                            className="bg-slate-900 dark:bg-emerald-600 hover:bg-black text-white font-bold text-xs px-5 py-2 rounded-xl flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>{isDbUpdating ? "Adicionando..." : "Registrar Plano de Ação"}</span>
                          </button>
                        </div>
                      </form>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
