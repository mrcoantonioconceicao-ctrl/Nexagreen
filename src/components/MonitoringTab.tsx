/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  Droplet, 
  Wind, 
  Volume2, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  FlaskConical, 
  Plus, 
  UserPlus, 
  Search,
  Activity,
  History,
  FileCheck,
  Printer
} from "lucide-react";
import { Tenant, MonitoringParam, LabCustody } from "../types";

interface MonitoringTabProps {
  tenant: Tenant;
  params: MonitoringParam[];
  labCustodies: LabCustody[];
  onAddMonitoringLog: (logData: any) => Promise<void>;
  isDbUpdating: boolean;
  onNavigateToTab?: (tab: string) => void;
}

const CATEGORY_ICONS: { [key: string]: any } = {
  Water: Droplet,
  Air: Wind,
  Noise: Volume2,
  Effluents: Droplet,
  Waste: Trash2,
  Soil: Activity
};

export default function MonitoringTab({
  tenant,
  params,
  labCustodies,
  onAddMonitoringLog,
  isDbUpdating,
  onNavigateToTab
}: MonitoringTabProps) {
  const tenantParams = params.filter(p => p.tenantId === tenant.id);

  // Filter param states
  const [filterCategory, setFilterCategory] = useState<string>("All");

  // Form states for manual param log
  const [showLogForm, setShowLogForm] = useState(false);
  const [category, setCategory] = useState<"Water" | "Soil" | "Air" | "Noise" | "Fauna" | "Flora" | "Effluents" | "Waste">("Water");
  const [parameter, setParameter] = useState("");
  const [value, setValue] = useState("");
  const [limit, setLimit] = useState("");
  const [unit, setUnit] = useState("mg/L");
  const [locationName, setLocationName] = useState("");

  // Sample submission chain states
  const [samples, setSamples] = useState<LabCustody[]>(labCustodies);
  const [sampleCollector, setSampleCollector] = useState("");
  const [sampleCode, setSampleCode] = useState("");
  const [sampleLab, setSampleLab] = useState("Eurofins Análises Ambientais");
  const [sampleParamsText, setSampleParamsText] = useState("pH, Turbidez, DBO");

  const handleCreateParamLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parameter || !value || !limit) return;

    await onAddMonitoringLog({
      tenantId: tenant.id,
      category,
      parameter,
      value: parseFloat(value),
      limit: parseFloat(limit),
      unit,
      locationName: locationName || "Unidade Operacional Sede",
      coordinates: { lat: -23.55 + (Math.random() - 0.5) * 2, lng: -46.63 + (Math.random() - 0.5) * 2 }
    });

    setParameter("");
    setValue("");
    setLimit("");
    setLocationName("");
    setShowLogForm(false);
  };

  const handleCreateCustodySample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sampleCode || !sampleCollector) return;

    const newSample: LabCustody = {
      id: `lab-${Date.now()}`,
      sampleCode,
      collectorName: sampleCollector,
      collectDate: new Date().toISOString().split("T")[0],
      labName: sampleLab,
      analyzedParams: sampleParamsText.split(",").map(p => p.trim()),
      status: "Collected"
    };

    setSamples([newSample, ...samples]);
    setSampleCode("");
    setSampleCollector("");
  };

  const advanceSampleStatus = (id: string) => {
    setSamples(prev => prev.map(s => {
      if (s.id === id) {
        let nextStatus: "Collected" | "InTransit" | "Analysis" | "LaudoEmitted" = "InTransit";
        if (s.status === "Collected") nextStatus = "InTransit";
        else if (s.status === "InTransit") nextStatus = "Analysis";
        else if (s.status === "Analysis") {
          nextStatus = "LaudoEmitted";
          return { ...s, status: nextStatus, laudoUrl: `laudo_emitted_${s.sampleCode.toLowerCase()}.pdf` };
        } else {
          nextStatus = "Collected";
        }
        return { ...s, status: nextStatus };
      }
      return s;
    }));
  };

  const filteredParams = filterCategory === "All" 
    ? tenantParams 
    : tenantParams.filter(p => p.category === filterCategory);

  // Detect critical items of the active tenant
  const criticalParams = tenantParams.filter(p => p.status === "Critical" || p.status === "Alert");

  return (
    <div className="p-6 lg:p-8 space-y-8" id="monitoring-module-container">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Monitoramento de Parâmetros & Laboratórios
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestão analítica de emissões atmosféricas, efluentes industriais, ruídos noturnos e Cadeia de Custódia laboratorial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onNavigateToTab && (
            <button
              onClick={() => onNavigateToTab("reports")}
              className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-850 text-slate-755 dark:text-slate-200 border border-slate-250 dark:border-slate-800 font-bold text-sm px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="h-4 w-4 text-emerald-600" />
              <span>Exportar Telemetria & PDF</span>
            </button>
          )}

          <button
            id="btn-trigger-log-form"
            onClick={() => setShowLogForm(!showLogForm)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/10 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Registrar Medição Manual</span>
          </button>
        </div>
      </div>

      {/* Manual Input Form */}
      {showLogForm && (
        <form onSubmit={handleCreateParamLog} className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-fade-in" id="add-param-log-form">
          <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-1">
            <FlaskConical className="h-5 w-5 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Lançamento de Coleta de Parâmetro</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Categoria do Monitoramento</label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="Water">Água Superficial/Subterrânea</option>
                <option value="Air">Emissões Atmosféricas (Ar)</option>
                <option value="Soil">Qualidade do Solo</option>
                <option value="Noise">Emissão de Ruídos</option>
                <option value="Effluents">Efluentes Líquidos</option>
                <option value="Waste">Gestão de Resíduos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Nome do Parâmetro Analisado</label>
              <input
                type="text"
                required
                value={parameter}
                onChange={(e) => setParameter(e.target.value)}
                placeholder="Ex: Demanda Química de Oxigênio"
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Valor Medido</label>
              <input
                type="number"
                step="0.01"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Ex: 45.2"
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Limite Regulatório Permitido</label>
              <input
                type="number"
                step="0.01"
                required
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="Ex: 50.0"
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Unidade de Medida</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ex: mg/L, dB(A), mg/Nm³"
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-650 dark:text-slate-350 mb-1.5">Localização / Ponto de Coleta</label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ex: Efluente Bruto ETA"
                className="w-full text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-end justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isDbUpdating}
                className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-md shadow-emerald-600/10"
              >
                {isDbUpdating ? "Gravando..." : "Gravar Medição"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Grid: Params Telemetry & Chain of Custody */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Logs history with alerts (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Alerts Warning Banner */}
          {criticalParams.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 p-4 rounded-2xl flex items-start space-x-3 text-red-800 dark:text-red-400" id="critical-alert-box">
              <AlertTriangle className="h-5 w-5 text-red-650 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">Não-conformidade Telemétrica Detectada</p>
                <p className="text-xs font-medium mt-1">
                  Existem {criticalParams.length} medição(ões) ambiental(is) operando acima do teto outorgado pela licença. O compliance legal exige a abertura imediata de Plano de Ação Mitigatório e aviso ao Gestor Técnico.
                </p>
              </div>
            </div>
          )}

          {/* Telemetry logs card list */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <History className="h-5 w-5 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">Histórico Telemétrico de Parâmetros</h3>
              </div>

              {/* Categoric filter pill buttons */}
              <div className="flex flex-wrap gap-1.5">
                {["All", "Water", "Air", "Noise", "Soil", "Effluents"].map(catName => (
                  <button
                    key={catName}
                    onClick={() => setFilterCategory(catName)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border uppercase transition-colors cursor-pointer ${
                      filterCategory === catName 
                        ? "bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600" 
                        : "bg-slate-50 dark:bg-slate-950/20 text-slate-500 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {catName === "All" ? "Todos" : catName}
                  </button>
                ))}
              </div>
            </div>

            {filteredParams.length === 0 ? (
              <p className="text-center py-8 text-sm text-slate-500 italic">Nenhum parâmetro medido nesta categoria.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {filteredParams.map((param) => {
                  const CategoryIcon = CATEGORY_ICONS[param.category] || Activity;
                  return (
                    <div 
                      key={param.id} 
                      className={`p-4 border rounded-xl flex items-center justify-between transition-colors shadow-sm bg-white dark:bg-slate-900 ${
                        param.status === "Critical" 
                          ? "border-red-300 bg-red-50/20 dark:border-red-900/30" 
                          : param.status === "Alert" 
                            ? "border-amber-300 bg-amber-50/20 dark:border-amber-900/30" 
                            : "border-slate-150 dark:border-slate-850 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className={`p-2 rounded-lg shrink-0 ${
                          param.status === "Critical" 
                            ? "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-400" 
                            : param.status === "Alert" 
                              ? "bg-amber-100 text-amber-850 dark:bg-amber-950/80 dark:text-amber-400" 
                              : "bg-slate-100 text-slate-700 dark:bg-slate-850 dark:text-slate-300"
                        }`}>
                          <CategoryIcon className="h-4.5 w-4.5" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{param.parameter}</span>
                            <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">{param.category}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Local: <span className="font-semibold text-slate-700 dark:text-slate-300">{param.locationName}</span> • Coletado em: {new Date(param.timestamp).toLocaleString("pt-BR")}</p>
                        </div>
                      </div>

                      {/* Values & compliance levels */}
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {param.value} <span className="text-[10px] font-semibold text-slate-400">{param.unit}</span>
                        </div>
                        <div className="text-[10px] text-slate-450 mt-1 font-medium">
                          Limite outorgado: <span className="font-bold">{param.limit} {param.unit}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Labs & Chain of Custody (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Accredited Labs quick display card */}
          <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest mb-3">Laboratórios Credenciados INMETRO</h4>
            <div className="space-y-2.5">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-850 dark:text-slate-200">Eurofins Análises Ambientais S.A.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Acreditação CRL 0205 • Parâmetros: Físico-Química e Metais</p>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Homologado</span>
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-850 dark:text-slate-200">SGS Geosol Laboratórios Ltda.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Acreditação CRL 0110 • Parâmetros: Minerais e Geotecnia</p>
                </div>
                <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">Homologado</span>
              </div>
            </div>
          </div>

          {/* Chain of Custody (Cadeia de Custódia) manager */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4" id="lab-custody-card">
            <div className="flex items-center space-x-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <FlaskConical className="h-5 w-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">Cadeia de Custódia de Amostras</h3>
            </div>

            {/* Form to dispatch sample to lab */}
            <form onSubmit={handleCreateCustodySample} className="space-y-3.5 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-150 dark:border-slate-850">
              <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Registrar Amostra de Campo (Custódia)</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Código de Amostra</label>
                  <input
                    type="text"
                    required
                    value={sampleCode}
                    onChange={(e) => setSampleCode(e.target.value)}
                    placeholder="Ex: SAM-2026-C44"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Técnico Coletor</label>
                  <input
                    type="text"
                    required
                    value={sampleCollector}
                    onChange={(e) => setSampleCollector(e.target.value)}
                    placeholder="Ex: Amanda Rezende"
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Laboratório Receptor</label>
                <select
                  value={sampleLab}
                  onChange={(e) => setSampleLab(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md text-slate-900"
                >
                  <option value="Eurofins Análises Ambientais">Eurofins Análises Ambientais S.A.</option>
                  <option value="SGS Geosol Laboratórios">SGS Geosol Laboratórios Ltda.</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Parâmetros Desejados (Vírgula para separar)</label>
                <input
                  type="text"
                  required
                  value={sampleParamsText}
                  onChange={(e) => setSampleParamsText(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-black text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center space-x-1 cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Despachar Coleta para Laboratório</span>
              </button>
            </form>

            {/* Dynamic Samples Custody List */}
            <div className="space-y-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Fluxograma de Custódia Ativo:</span>
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {samples.map(samp => (
                  <div key={samp.id} className="p-3.5 border border-slate-150 dark:border-slate-850 rounded-xl bg-slate-50/20 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 dark:text-white uppercase">{samp.sampleCode}</span>
                      <button 
                        onClick={() => advanceSampleStatus(samp.id)}
                        className={`px-2 py-1 rounded text-[9px] font-bold uppercase cursor-pointer border ${
                          samp.status === "Collected" 
                            ? "bg-cyan-50 text-cyan-800 border-cyan-200" 
                            : samp.status === "InTransit" 
                              ? "bg-blue-50 text-blue-800 border-blue-200" 
                              : samp.status === "Analysis" 
                                ? "bg-amber-50 text-amber-800 border-amber-200" 
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {samp.status === "Collected" && "Fase: Coletada (Avançar)"}
                        {samp.status === "InTransit" && "Fase: Em Trânsito (Avançar)"}
                        {samp.status === "Analysis" && "Fase: Em Análise (Concluir)"}
                        {samp.status === "LaudoEmitted" && "Fase: Laudo Emitido (Reset)"}
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-500 space-y-1">
                      <p>Coletor: <strong className="text-slate-700 dark:text-slate-300">{samp.collectorName}</strong> em {samp.collectDate}</p>
                      <p>Laboratório: <strong className="text-slate-750 dark:text-slate-250">{samp.labName}</strong></p>
                      <p>Parâmetros: <strong className="text-slate-600 dark:text-slate-400">{samp.analyzedParams.join(", ")}</strong></p>
                      {samp.laudoUrl && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1 pt-1">
                          <FileCheck className="h-3.5 w-3.5" />
                          <span>Laudo Final emitido com conformidade técnica.</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
