/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Compass, 
  Wifi, 
  WifiOff, 
  Camera, 
  PenTool, 
  QrCode, 
  CheckSquare, 
  RotateCcw, 
  CloudLightning,
  Smartphone,
  Save,
  CheckCircle,
  Clock,
  Navigation
} from "lucide-react";
import { Tenant, FieldInspectionReport } from "../types";

interface FieldAppSimulatorProps {
  tenant: Tenant;
  onSubmitReport: (reportData: any) => Promise<void>;
  reports: FieldInspectionReport[];
}

export default function FieldAppSimulator({ tenant, onSubmitReport, reports }: FieldAppSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // States
  const [offlineMode, setOfflineMode] = useState(false);
  const [inspector, setInspector] = useState("Márcio Silva Guedes");
  const [locationName, setLocationName] = useState("Área de Britagem Primária");
  const [gpsCoords, setGpsCoords] = useState({ lat: -22.9152, lng: -43.1235 });

  const [checklist, setChecklist] = useState([
    { question: "Taludes apresentam trincas ou desmoronamentos?", checked: false, note: "" },
    { question: "Há vazamentos ou furos visíveis nas bacias de contenção?", checked: false, note: "" },
    { question: "Equipamentos possuem bandejas de contenção de óleo sob o motor?", checked: true, note: "Bandejas limpas de zinco." },
    { question: "Resíduos industriais perigosos (Classe I) estão segregados?", checked: true, note: "" },
    { question: "Emissão visível de poeira / material particulado?", checked: false, note: "" }
  ]);

  const [photoSnapped, setPhotoSnapped] = useState(false);
  const [signatureDrawn, setSignatureDrawn] = useState(false);
  const [localQueue, setLocalQueue] = useState<any[]>([]);
  const [syncStatusMsg, setSyncStatusMsg] = useState("");

  // Canvas signature logic
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // Generate slight mock GPS variations for interest
    const interval = setInterval(() => {
      setGpsCoords(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.0001,
        lng: prev.lng + (Math.random() - 0.5) * 0.0001
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Clear signature board
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw subtle guide line
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(10, 50);
    ctx.lineTo(240, 50);
    ctx.stroke();
    ctx.setLineDash([]);
    setSignatureDrawn(false);
  };

  useEffect(() => {
    clearSignature();
  }, []);

  const handleStartDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0f172a";
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setSignatureDrawn(true);
  };

  const handleEndDraw = () => {
    setIsDrawing(false);
  };

  const handleCheckboxChange = (index: number) => {
    setChecklist(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, checked: !item.checked };
      }
      return item;
    }));
  };

  const handleNoteChange = (index: number, text: string) => {
    setChecklist(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, note: text };
      }
      return item;
    }));
  };

  const handleSaveReport = async () => {
    // Collect report object
    const reportData = {
      tenantId: tenant.id,
      inspectorName: inspector,
      date: new Date().toISOString().split("T")[0],
      locationName,
      coordinates: gpsCoords,
      checklist,
      photo: photoSnapped ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%2310b981'/><text x='10' y='50' fill='white'>Foto Georreferenciada</text></svg>" : undefined,
      signature: signatureDrawn ? "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAE=" : undefined
    };

    if (offlineMode) {
      // Save offline queue
      setLocalQueue([...localQueue, reportData]);
      setSyncStatusMsg("Salvo com sucesso na fila local do dispositivo (Modo Offline Ativo).");
    } else {
      // Direct sync submit
      setSyncStatusMsg("Enviando relatório em tempo real para a nuvem...");
      try {
        await onSubmitReport(reportData);
        setSyncStatusMsg("Relatório transmitido e sincronizado com sucesso com o servidor central!");
      } catch (err) {
        setSyncStatusMsg("Erro de rede. Salvo automaticamente na fila local.");
        setLocalQueue([...localQueue, reportData]);
      }
    }

    // Reset report interactive fields
    setPhotoSnapped(false);
    clearSignature();
  };

  // Sync offline queue to cloud manually or automatically
  const handleTriggerManualSync = async () => {
    if (localQueue.length === 0) return;
    setSyncStatusMsg(`Sincronizando ${localQueue.length} relatório(s) pendente(s)...`);

    try {
      for (const rep of localQueue) {
        await onSubmitReport(rep);
      }
      setLocalQueue([]);
      setSyncStatusMsg("Todos os relatórios da fila de campo foram sincronizados com sucesso!");
    } catch (err) {
      setSyncStatusMsg("Falha na sincronização. Verifique a conectividade de dados.");
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8" id="field-module-container">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Coleta e Fiscalização de Campo (Offline)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ferramenta de conformidade de campo. Simule vistorias georreferenciadas com armazenamento offline temporário.
          </p>
        </div>

        {/* Offline Mode Switch */}
        <div className="flex items-center space-x-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2">
            {offlineMode ? <WifiOff className="h-5 w-5 text-red-500 animate-pulse" /> : <Wifi className="h-5 w-5 text-emerald-600" />}
            <div>
              <span className="text-[10px] block font-extrabold text-slate-500 uppercase tracking-wider">Modo de Operação</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{offlineMode ? "Modo Offline Ativo" : "Online em Rede"}</span>
            </div>
          </div>
          <button
            onClick={() => setOfflineMode(!offlineMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
              offlineMode 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {offlineMode ? "Ir Online" : "Trabalhar Offline"}
          </button>
        </div>
      </div>

      {/* Main double split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Device frame (simulation) (5cols) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-sm bg-slate-950 p-4 rounded-[40px] shadow-2xl border-4 border-slate-800 ring-2 ring-slate-900 relative">
            
            {/* Camera notch simulation */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black h-4.5 w-24 rounded-full z-20 flex items-center justify-center">
              <div className="h-1.5 w-1.5 bg-slate-800 rounded-full"></div>
            </div>

            {/* Mobile App Canvas Screen */}
            <div className="bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden flex flex-col h-[640px] text-slate-850 z-10 pt-4 relative">
              
              {/* Header */}
              <div className="p-4 bg-emerald-600 text-white flex items-center justify-between shadow-md shrink-0">
                <div className="flex items-center space-x-1.5">
                  <Smartphone className="h-4 w-4" />
                  <span className="text-xs font-bold tracking-tight">NexaField • Coletor</span>
                </div>
                <div className="flex items-center space-x-2">
                  {offlineMode ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5 animate-pulse" />}
                  <span className="text-[10px] font-bold uppercase">{offlineMode ? "Offline" : "Online"}</span>
                </div>
              </div>

              {/* Scrollable Form Inside Device */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Georeference GPS badge */}
                <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <div className="flex items-center space-x-1.5 text-slate-650 dark:text-slate-300">
                    <Navigation className="h-3.5 w-3.5 text-emerald-600 animate-spin-slow shrink-0" />
                    <span className="font-bold truncate max-w-[150px]">{locationName}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 font-bold">
                    {gpsCoords.lat.toFixed(5)}, {gpsCoords.lng.toFixed(5)}
                  </div>
                </div>

                {/* Checklist questions */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Itens do Checklist de Conformidade</h4>
                  <div className="space-y-2.5">
                    {checklist.map((item, idx) => (
                      <div key={idx} className="p-3 border border-slate-150 dark:border-slate-850 rounded-xl bg-white dark:bg-slate-900/40 space-y-2 text-xs shadow-sm">
                        <label className="flex items-start space-x-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleCheckboxChange(idx)}
                            className="mt-0.5 rounded border-slate-200 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 leading-snug">{item.question}</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Adicionar nota técnica..."
                          value={item.note}
                          onChange={(e) => handleNoteChange(idx, e.target.value)}
                          className="w-full text-[10px] border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1.5 rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Snap Georeferenced Photo */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Mídia Fotográfica Georreferenciada</h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col items-center justify-center space-y-2.5 bg-slate-50 dark:bg-slate-950/20 text-xs">
                    {photoSnapped ? (
                      <div className="space-y-1 text-center w-full">
                        <div className="h-24 bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-300 rounded-lg flex items-center justify-center font-bold text-emerald-800 text-[10px]">
                          FOTO CAPTURADA COM SUCESSO
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono">GPS stamp: {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}</p>
                        <button
                          type="button"
                          onClick={() => setPhotoSnapped(false)}
                          className="text-[10px] text-red-500 font-bold hover:underline"
                        >
                          Apagar Foto
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPhotoSnapped(true)}
                        className="bg-slate-900 dark:bg-slate-800 hover:bg-black text-white text-[10px] px-4 py-2 rounded-lg font-bold flex items-center space-x-1 cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        <span>Capturar Foto do Ponto</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Digital Signature Drawing Board */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Assinatura Digital de Termo</h4>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 bg-slate-50 dark:bg-slate-950/30 text-center text-xs">
                    <canvas
                      ref={canvasRef}
                      width={250}
                      height={80}
                      onMouseDown={handleStartDraw}
                      onMouseMove={handleDrawing}
                      onMouseUp={handleEndDraw}
                      onMouseLeave={handleEndDraw}
                      className="border border-slate-150 dark:border-slate-750 rounded bg-white dark:bg-slate-900 block cursor-pencil mx-auto"
                    />
                    <div className="flex items-center justify-between mt-2.5 px-1 text-[10px]">
                      <span className="text-slate-450 font-medium">Assine no box acima com o mouse</span>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-red-500 hover:text-red-700 font-bold uppercase flex items-center space-x-0.5"
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Limpar</span>
                      </button>
                    </div>
                  </div>
                </div>

              </div>

              {/* Submit inspector form */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveReport}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <Save className="h-4 w-4" />
                  <span>{offlineMode ? "Salvar Localmente" : "Transmitir Relatório"}</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Synced historical reports & offline queues (7cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Status Message */}
          {syncStatusMsg && (
            <div className={`p-4 rounded-2xl border text-xs ${
              syncStatusMsg.includes("sucesso") || syncStatusMsg.includes("Sincronizando")
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-450"
            }`}>
              <div className="flex items-center space-x-2">
                <CloudLightning className="h-4.5 w-4.5 shrink-0 animate-pulse text-emerald-650" />
                <span className="font-semibold">{syncStatusMsg}</span>
              </div>
            </div>
          )}

          {/* Local Device Queue card */}
          {localQueue.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <div>
                    <h3 className="text-xs font-bold text-slate-950 dark:text-white uppercase tracking-wider">Fila Local do Coletor</h3>
                    <p className="text-[10px] text-slate-450">Relatórios salvos localmente sob modo offline.</p>
                  </div>
                </div>
                <button
                  onClick={handleTriggerManualSync}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg uppercase flex items-center space-x-1 cursor-pointer"
                >
                  <CloudLightning className="h-3.5 w-3.5" />
                  <span>Sincronizar Agora ({localQueue.length})</span>
                </button>
              </div>

              <div className="space-y-2">
                {localQueue.map((rep, i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{rep.locationName}</p>
                      <p className="text-[10px] text-slate-400">Inspector: {rep.inspectorName} • {rep.date}</p>
                    </div>
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase">Aguardando Conectividade</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical inspections block */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
                <span>Histórico de Relatórios Sincronizados</span>
              </h3>
            </div>

            {reports.length === 0 ? (
              <p className="text-center py-6 text-sm text-slate-500 italic">Nenhum relatório de campo sincronizado na nuvem ainda.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {reports.map((rep) => (
                  <div key={rep.id} className="p-4 border border-slate-150 dark:border-slate-850 bg-slate-50/15 dark:bg-slate-950/10 rounded-2xl space-y-3 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-snug">{rep.locationName}</p>
                        <p className="text-[10px] text-slate-450 mt-0.5">Inspetor: {rep.inspectorName} • Data: {new Date(rep.date).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[9px] font-extrabold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 uppercase flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span>Sincronizado</span>
                        </span>
                        {rep.qrCode && (
                          <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                            {rep.qrCode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Checklist recap */}
                    <div className="space-y-1.5 text-xs">
                      <span className="block text-[10px] font-extrabold uppercase text-slate-450 tracking-wider">Mapeamento Técnico de Vistoria:</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {rep.checklist.map((c, i) => (
                          <div key={i} className="flex items-start space-x-1.5">
                            <span className={`text-[10px] font-bold px-1.5 rounded uppercase shrink-0 ${
                              c.checked ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {c.checked ? "Sim" : "Não"}
                            </span>
                            <span className="text-slate-700 dark:text-slate-350">{c.question}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Evidence and signature stamp */}
                    <div className="flex items-center space-x-6 text-[10px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center space-x-1">
                        <Camera className="h-3.5 w-3.5 text-slate-400" />
                        <span>Foto Georreferenciada: <strong>Registrada</strong></span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <PenTool className="h-3.5 w-3.5 text-slate-400" />
                        <span>Assinatura Digital: <strong>Simulada/Verificada</strong></span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
