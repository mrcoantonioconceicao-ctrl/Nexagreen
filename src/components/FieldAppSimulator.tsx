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
  Navigation,
  Upload,
  X,
  RefreshCw,
  Image as ImageIcon,
  Eye,
  AlertCircle
} from "lucide-react";
import { Tenant, FieldInspectionReport } from "../types";

interface FieldAppSimulatorProps {
  tenant: Tenant;
  onSubmitReport: (reportData: any) => Promise<void>;
  reports: FieldInspectionReport[];
}

export default function FieldAppSimulator({ tenant, onSubmitReport, reports }: FieldAppSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Camera & Photo States
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);

  const [signatureDrawn, setSignatureDrawn] = useState(false);
  const [localQueue, setLocalQueue] = useState<any[]>([]);
  const [syncStatusMsg, setSyncStatusMsg] = useState("");

  // Canvas signature logic
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    // Generate slight mock GPS variations for realistic coordinates
    const interval = setInterval(() => {
      setGpsCoords(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.0001,
        lng: prev.lng + (Math.random() - 0.5) * 0.0001
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Start live device camera stream
  const startCamera = async () => {
    setCameraError(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn("Camera stream failed:", err);
      setCameraError("Câmera não disponível no ambiente atual ou permissão negada. Você também pode enviar uma foto salva do seu dispositivo.");
    }
  };

  // Stop live camera stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture current frame from video with GPS stamp
  const capturePhotoFromVideo = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Geotag watermark banner at bottom
    const bannerHeight = Math.max(40, Math.floor(canvas.height * 0.12));
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

    ctx.fillStyle = "#10b981"; // emerald
    ctx.font = "bold 14px sans-serif";
    ctx.fillText(`NexaField Geotag • GPS: ${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}`, 12, canvas.height - (bannerHeight * 0.55));

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "11px sans-serif";
    ctx.fillText(`Local: ${locationName} | Data: ${new Date().toLocaleString("pt-BR")}`, 12, canvas.height - (bannerHeight * 0.2));

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedPhoto(dataUrl);
    stopCamera();
  };

  // Handle uploaded photo from file input
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width || 800;
        canvas.height = img.height || 600;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Watermark stamp
        const bannerHeight = Math.max(38, Math.floor(canvas.height * 0.09));
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(0, canvas.height - bannerHeight, canvas.width, bannerHeight);

        ctx.fillStyle = "#10b981";
        ctx.font = `bold ${Math.max(12, Math.floor(bannerHeight * 0.35))}px sans-serif`;
        ctx.fillText(`NexaField Geotag • GPS: ${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}`, 12, canvas.height - (bannerHeight * 0.5));

        ctx.fillStyle = "#ffffff";
        ctx.font = `${Math.max(10, Math.floor(bannerHeight * 0.28))}px sans-serif`;
        ctx.fillText(`Local: ${locationName} | ${new Date().toLocaleString("pt-BR")}`, 12, canvas.height - (bannerHeight * 0.18));

        setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.85));
        stopCamera();
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
    const signatureDataUrl = signatureDrawn && canvasRef.current 
      ? canvasRef.current.toDataURL("image/png") 
      : undefined;

    // Collect report object
    const reportData = {
      tenantId: tenant.id,
      inspectorName: inspector,
      date: new Date().toISOString().split("T")[0],
      locationName,
      coordinates: gpsCoords,
      checklist,
      photo: capturedPhoto || undefined,
      signature: signatureDataUrl
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
    setCapturedPhoto(null);
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
    <div className="p-6 lg:p-8 space-y-8 relative" id="field-module-container">
      
      {/* Hidden File Input for Device Photo Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        capture="environment"
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Lightbox Photo Preview Modal */}
      {previewPhotoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Evidência Fotográfica Georreferenciada</h3>
              </div>
              <button 
                onClick={() => setPreviewPhotoModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center max-h-[420px]">
              <img src={previewPhotoModal} alt="Evidência Fotográfica" className="w-full h-auto object-contain max-h-[420px]" />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewPhotoModal(null)}
                className="bg-slate-900 dark:bg-slate-800 hover:bg-black text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Coleta e Fiscalização de Campo (Offline & Câmera)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Ferramenta de conformidade ambiental. Capture fotos com GPS carimbado e envie vistorias em tempo real.
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
            <div className="bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden flex flex-col h-[660px] text-slate-850 z-10 pt-4 relative">
              
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

                {/* Camera & Georeferenced Photo Section */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Captura Fotográfica de Evidência</h4>
                  
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950/20 text-xs space-y-2.5">
                    
                    {/* Live Camera View */}
                    {isCameraActive ? (
                      <div className="space-y-2">
                        <div className="relative rounded-lg overflow-hidden border border-emerald-500/50 bg-black h-48 flex items-center justify-center">
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-slate-900/80 text-emerald-400 text-[9px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                            GPS: {gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}
                          </div>
                        </div>

                        {cameraError && (
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg text-[10px] text-amber-800 dark:text-amber-300 flex items-start space-x-1">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span>{cameraError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={capturePhotoFromVideo}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] py-2 rounded-lg font-bold flex items-center justify-center space-x-1"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>Fotografar</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-[10px] py-2 rounded-lg font-bold flex items-center justify-center space-x-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    ) : capturedPhoto ? (
                      /* Captured Photo Preview */
                      <div className="space-y-2">
                        <div className="relative rounded-lg overflow-hidden border border-emerald-500/60 shadow-sm bg-slate-950 group">
                          <img src={capturedPhoto} alt="Evidência do Ponto" className="w-full h-32 object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => setPreviewPhotoModal(capturedPhoto)}
                              className="bg-white/90 text-slate-900 p-1.5 rounded-full shadow"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>Foto Carimbada com GPS</span>
                          </span>

                          <div className="flex space-x-2">
                            <button
                              type="button"
                              onClick={startCamera}
                              className="text-slate-600 dark:text-slate-400 font-bold hover:underline"
                            >
                              Refazer
                            </button>
                            <button
                              type="button"
                              onClick={() => setCapturedPhoto(null)}
                              className="text-red-500 font-bold hover:underline"
                            >
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Camera Activation & Upload Buttons */
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="w-full bg-slate-900 dark:bg-slate-800 hover:bg-black text-white text-[11px] py-2.5 rounded-lg font-bold flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                        >
                          <Camera className="h-4 w-4 text-emerald-400" />
                          <span>Abrir Câmera do Dispositivo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-slate-100 dark:bg-slate-950/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] py-2 rounded-lg font-bold flex items-center justify-center space-x-1.5 border border-slate-200 dark:border-slate-800 cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5 text-slate-500" />
                          <span>Carregar Foto da Galeria</span>
                        </button>
                      </div>
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
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

                    {/* Photo Evidence & Signature Thumbnails */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500">
                      <div className="flex items-center space-x-3">
                        {rep.photo ? (
                          <div className="flex items-center space-x-2">
                            {rep.photo.startsWith("data:image") ? (
                              <button 
                                onClick={() => setPreviewPhotoModal(rep.photo!)}
                                className="flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-lg font-bold hover:underline"
                              >
                                <Camera className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Ver Foto Anexada</span>
                              </button>
                            ) : (
                              <div className="flex items-center space-x-1">
                                <Camera className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Foto Georreferenciada: Registrada</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-slate-400">
                            <Camera className="h-3.5 w-3.5" />
                            <span>Sem Foto</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-1">
                          <PenTool className="h-3.5 w-3.5 text-slate-400" />
                          <span>Assinatura Digital: {rep.signature ? "Completada" : "Pendente"}</span>
                        </div>
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

