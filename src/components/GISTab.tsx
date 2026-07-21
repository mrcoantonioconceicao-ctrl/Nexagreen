/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Map, 
  Layers, 
  Satellite, 
  Upload, 
  Compass, 
  Cpu, 
  AlertTriangle,
  Play,
  RotateCcw,
  MousePointer,
  Crosshair
} from "lucide-react";
import { Tenant, MonitoringParam } from "../types";

interface GISTabProps {
  tenant: Tenant;
  params: MonitoringParam[];
}

interface CustomGISFeature {
  name: string;
  type: "Reserve" | "Dam" | "Zone";
  coordinates: { x: number; y: number }[];
  color: string;
  description: string;
}

export default function GISTab({ tenant, params }: GISTabProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [mapLayer, setMapLayer] = useState<"Satellite" | "Vector" | "Heatmap">("Vector");
  const [hoverCoords, setHoverCoords] = useState({ lat: -23.5500, lng: -46.6333 });
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [droneFlying, setDroneFlying] = useState(false);
  const [dronePosition, setDronePosition] = useState({ x: 150, y: 150 });
  const [geojsonUploaded, setGeojsonUploaded] = useState(false);

  // Custom vector polygons relative to canvas center
  const [selectedRegion, setSelectedRegion] = useState<"Nordeste" | "Sul" | "Sudeste" | "Norte" | "Centro-Oeste">("Nordeste");

  const REGION_PRESETS = {
    Nordeste: {
      label: "Nordeste",
      tagline: "Complexo Portuário de Suape / Camaçari / Pecém / Eólicas do Sertão",
      biome: "Caatinga & Mata Atlântica",
      agencies: ["CPRH/PE", "INEMA/BA", "SEMACE/CE", "SUDENE", "IBAMA"],
      baseLat: -8.0476,
      baseLng: -34.8770,
      features: [
        {
          name: "Área de Preservação Caatinga Nativa & Parque Eólico",
          type: "Reserve" as const,
          coordinates: [
            { x: 90, y: 70 },
            { x: 190, y: 50 },
            { x: 230, y: 120 },
            { x: 130, y: 150 }
          ],
          color: "rgba(16, 185, 129, 0.25)",
          description: "Zona de compensação ambiental de caatinga preservada e área de amortecimento de parque gerador eólico no sertão."
        },
        {
          name: "Terminal Marítimo & Dique de Suape/Pecém",
          type: "Dam" as const,
          coordinates: [
            { x: 270, y: 150 },
            { x: 370, y: 140 },
            { x: 390, y: 230 },
            { x: 300, y: 250 }
          ],
          color: "rgba(239, 68, 68, 0.25)",
          description: "Bacia de recepção de efluentes tratados com monitoramento de dispersão na zona costeira sob regência CPRH/INEMA."
        }
      ]
    },
    Sul: {
      label: "Sul",
      tagline: "Polo Petroquímico de Triunfo / Paranaguá / Vale do Itajaí",
      biome: "Pampa & Mata de Araucárias",
      agencies: ["FEPAM/RS", "IAT/PR", "IMA/SC", "IBAMA"],
      baseLat: -25.4284,
      baseLng: -49.2733,
      features: [
        {
          name: "Reserva de Floresta Ombrófila Mista (Araucárias)",
          type: "Reserve" as const,
          coordinates: [
            { x: 100, y: 80 },
            { x: 200, y: 60 },
            { x: 220, y: 130 },
            { x: 120, y: 140 }
          ],
          color: "rgba(16, 185, 129, 0.25)",
          description: "Área protegida de vegetação nativa de mata de araucária com programas estaduais FEPAM e IAT."
        },
        {
          name: "Estação Industrial do Polo Petroquímico",
          type: "Dam" as const,
          coordinates: [
            { x: 280, y: 160 },
            { x: 380, y: 150 },
            { x: 390, y: 220 },
            { x: 310, y: 240 }
          ],
          color: "rgba(239, 68, 68, 0.25)",
          description: "Unidade de tratamento e descarte de efluentes industriais com medidores de vazão em tempo real."
        }
      ]
    },
    Sudeste: {
      label: "Sudeste",
      tagline: "Bacia de Santos / Vale do Paraíba / Serra do Mar",
      biome: "Mata Atlântica & Cerrado",
      agencies: ["CETESB/SP", "INEA/RJ", "FEAM/MG", "IBAMA"],
      baseLat: -22.9068,
      baseLng: -43.1729,
      features: [
        {
          name: "Área de Preservação Compensatória (Serra do Mar)",
          type: "Reserve" as const,
          coordinates: [
            { x: 100, y: 80 },
            { x: 180, y: 60 },
            { x: 220, y: 110 },
            { x: 140, y: 140 }
          ],
          color: "rgba(16, 185, 129, 0.2)",
          description: "Zona de reflorestamento de Mata Atlântica vinculada às licenças ambientais estaduais CETESB/INEA."
        },
        {
          name: "Dique de Decantação Principal",
          type: "Dam" as const,
          coordinates: [
            { x: 280, y: 160 },
            { x: 360, y: 150 },
            { x: 380, y: 220 },
            { x: 310, y: 240 }
          ],
          color: "rgba(239, 68, 68, 0.2)",
          description: "Barragem monitorada por piezômetros telemétricos contra fadiga estrutural."
        }
      ]
    },
    Norte: {
      label: "Norte",
      tagline: "Polo Industrial de Manaus / Província Mineral de Carajás",
      biome: "Amazônia",
      agencies: ["IPAAM/AM", "SEMAS/PA", "IBAMA"],
      baseLat: -3.1190,
      baseLng: -60.0217,
      features: [
        {
          name: "Cinturão de Proteção da Bacia Amazônica",
          type: "Reserve" as const,
          coordinates: [
            { x: 80, y: 60 },
            { x: 190, y: 40 },
            { x: 230, y: 120 },
            { x: 110, y: 150 }
          ],
          color: "rgba(16, 185, 129, 0.3)",
          description: "Cinturão verde de floresta densa amazônica sob monitoramento do IPAAM e SEMAS."
        },
        {
          name: "Bacia de Captação e Tratamento Fluviométrico",
          type: "Dam" as const,
          coordinates: [
            { x: 260, y: 150 },
            { x: 360, y: 140 },
            { x: 370, y: 210 },
            { x: 290, y: 230 }
          ],
          color: "rgba(239, 68, 68, 0.25)",
          description: "Ponto de outorga de água e descarte com sensores de turbidez automatizados."
        }
      ]
    },
    "Centro-Oeste": {
      label: "Centro-Oeste",
      tagline: "Corredor Agroindustrial / Bacia do Pantanal & Cerrado",
      biome: "Cerrado & Pantanal",
      agencies: ["SEMA/MT", "IMASUL/MS", "IBAMA"],
      baseLat: -15.7975,
      baseLng: -47.8919,
      features: [
        {
          name: "Reserva Legal Cerrado / Área de Recarga de Aquífero",
          type: "Reserve" as const,
          coordinates: [
            { x: 90, y: 70 },
            { x: 180, y: 50 },
            { x: 210, y: 120 },
            { x: 130, y: 140 }
          ],
          color: "rgba(16, 185, 129, 0.25)",
          description: "Área de reserva legal cadastrada no CAR (Sicar) protegendo matas de galeria."
        },
        {
          name: "Lagoa de Estabilização de Resíduos Agroindustriais",
          type: "Dam" as const,
          coordinates: [
            { x: 270, y: 160 },
            { x: 370, y: 150 },
            { x: 380, y: 220 },
            { x: 290, y: 240 }
          ],
          color: "rgba(239, 68, 68, 0.25)",
          description: "Unidade de tratamento biológico com análises constantes de DBO/DQO."
        }
      ]
    }
  };

  const currentRegionData = REGION_PRESETS[selectedRegion];

  const [gisFeatures, setGisFeatures] = useState<CustomGISFeature[]>(currentRegionData.features);

  // Update features when region changes
  useEffect(() => {
    setGisFeatures(REGION_PRESETS[selectedRegion].features);
  }, [selectedRegion]);

  // Handle resizing of canvas fluidly
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // set dimensions clamped
        setDimensions({
          width: Math.max(width, 400),
          height: Math.max(height, 350)
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Main Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear background
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw Map background layer based on selection
    if (mapLayer === "Satellite") {
      // Draw grid-like patterns simulating satellite textures
      ctx.fillStyle = "#1e293b"; // Slate background
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Grass-like plots
      ctx.fillStyle = "#0f172a";
      for (let i = 0; i < dimensions.width; i += 80) {
        ctx.fillRect(i, 0, 40, dimensions.height);
      }
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      for (let i = 0; i < dimensions.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, dimensions.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(dimensions.width, i);
        ctx.stroke();
      }
      ctx.fillStyle = "#022c22"; // Dense green forests patches
      ctx.beginPath();
      ctx.arc(150, 100, 70, 0, Math.PI * 2);
      ctx.fill();
    } else if (mapLayer === "Vector") {
      ctx.fillStyle = "#f8fafc"; // Very clean off-white
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Roads lines
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(0, dimensions.height / 2);
      ctx.lineTo(dimensions.width, dimensions.height / 2);
      ctx.moveTo(dimensions.width / 2, 0);
      ctx.lineTo(dimensions.width / 2, dimensions.height);
      ctx.stroke();

      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (mapLayer === "Heatmap") {
      // White canvas first
      ctx.fillStyle = "#020617"; // Dark night
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw heat points simulating air pollutants concentrations or spills
      const heatPoints = [
        { x: 300, y: 180, r: 100, color1: "rgba(239,68,68,0.45)", color2: "rgba(239,68,68,0)" },
        { x: 120, y: 220, r: 80, color1: "rgba(245,158,11,0.4)", color2: "rgba(245,158,11,0)" }
      ];

      heatPoints.forEach(p => {
        const gradient = ctx.createRadialGradient(p.x, p.y, 5, p.x, p.y, p.r);
        gradient.addColorStop(0, p.color1);
        gradient.addColorStop(1, p.color2);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Draw polygons / GIS shapes
    gisFeatures.forEach(feat => {
      ctx.fillStyle = feat.color;
      ctx.strokeStyle = feat.color.replace("0.2", "1.0");
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(feat.coordinates[0].x, feat.coordinates[0].y);
      for (let i = 1; i < feat.coordinates.length; i++) {
        ctx.lineTo(feat.coordinates[i].x, feat.coordinates[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Write label in center
      const centerX = feat.coordinates.reduce((sum, c) => sum + c.x, 0) / feat.coordinates.length;
      const centerY = feat.coordinates.reduce((sum, c) => sum + c.y, 0) / feat.coordinates.length;
      ctx.fillStyle = mapLayer === "Heatmap" ? "#fff" : "#1e293b";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(feat.name.split(" ")[0] + " Area", centerX, centerY);
    });

    // Draw active tenant parameter monitoring points
    const activeParams = (params || []).filter(p => p && p.tenantId === tenant?.id);
    activeParams.forEach((param, idx) => {
      // Map params arbitrarily to map quadrants for visual interest
      const x = 80 + (idx * 110) % (dimensions.width - 150);
      const y = 90 + (idx * 70) % (dimensions.height - 130);

      // Draw point of interest pin
      let pinColor = "#10b981"; // normal Green
      if (param.status === "Critical") pinColor = "#ef4444"; // red
      else if (param.status === "Alert") pinColor = "#f59e0b"; // orange

      ctx.fillStyle = pinColor;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // outer pulsing ring
      ctx.strokeStyle = pinColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.stroke();

      // Label
      ctx.fillStyle = mapLayer === "Heatmap" ? "#fff" : "#0f172a";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${param.parameter.split(" ")[0]} (${param.value})`, x + 15, y + 3);
    });

    // Draw Drone Position if flying
    if (droneFlying) {
      ctx.fillStyle = "#3b82f6"; // Blue drone
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dronePosition.x, dronePosition.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw scanner sight range
      ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(dronePosition.x, dronePosition.y, 35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

  }, [dimensions, mapLayer, gisFeatures, params, tenant, droneFlying, dronePosition]);

  // Drone movement simulation loop
  useEffect(() => {
    if (!droneFlying) return;
    const interval = setInterval(() => {
      setDronePosition(prev => {
        let nextX = prev.x + (Math.random() - 0.45) * 12;
        let nextY = prev.y + (Math.random() - 0.5) * 10;

        // Clamp
        if (nextX < 20 || nextX > dimensions.width - 20) nextX = dimensions.width / 2;
        if (nextY < 20 || nextY > dimensions.height - 20) nextY = dimensions.height / 2;

        return { x: nextX, y: nextY };
      });
    }, 150);

    return () => clearInterval(interval);
  }, [droneFlying, dimensions]);

  // Track mouse coordinates over canvas and map to simulated lat/lng
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert pixels to regional realistic coordinate simulation
    const baseLat = currentRegionData.baseLat;
    const baseLng = currentRegionData.baseLng;

    const lat = baseLat - (y / dimensions.height) * 0.15;
    const lng = baseLng - (x / dimensions.width) * 0.25;

    setHoverCoords({ lat, lng });

    // Simple collision detection with GIS Features
    let hoverFeatureName: string | null = null;
    gisFeatures.forEach(feat => {
      const centerX = feat.coordinates.reduce((sum, c) => sum + c.x, 0) / feat.coordinates.length;
      const centerY = feat.coordinates.reduce((sum, c) => sum + c.y, 0) / feat.coordinates.length;
      
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      if (distance < 50) {
        hoverFeatureName = feat.name;
      }
    });
    setSelectedFeature(hoverFeatureName);
  };

  const handleUploadGeoJSON = () => {
    setGeojsonUploaded(true);
    // Append a new polygon to the features list simulating a GeoJSON upload
    const geojsonZone: CustomGISFeature = {
      name: "Área de Supressão Autorizada GeoJSON_09",
      type: "Zone",
      coordinates: [
        { x: 30, y: 260 },
        { x: 120, y: 240 },
        { x: 100, y: 310 },
        { x: 40, y: 300 }
      ],
      color: "rgba(245, 158, 11, 0.25)",
      description: "Polígono importado do Shapefile estadual homologado."
    };
    setGisFeatures([...gisFeatures, geojsonZone]);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8" id="gis-module-container">
      
      {/* Title & Region Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Cartografia Digital & GIS Corporativo
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Mapeamento georreferenciado multi-camadas de limites operacionais, outorgas e polígonos por macrorregião.
          </p>
        </div>

        {/* Macrorregiões do Brasil Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {(["Nordeste", "Sul", "Sudeste", "Norte", "Centro-Oeste"] as const).map((regionKey) => (
            <button
              key={regionKey}
              type="button"
              onClick={() => setSelectedRegion(regionKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedRegion === regionKey
                  ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {regionKey === "Nordeste" && "🌵 "}
              {regionKey === "Sul" && "🌲 "}
              {regionKey === "Sudeste" && "🏭 "}
              {regionKey === "Norte" && "🌳 "}
              {regionKey === "Centro-Oeste" && "🌾 "}
              {regionKey}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Region Information Banner */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200">
        <div className="flex items-center space-x-2.5">
          <span className="font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-mono">
            {currentRegionData.label}
          </span>
          <span className="font-semibold">{currentRegionData.tagline}</span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-emerald-700 dark:text-emerald-300">
          <span>Bioma Predominante: <strong>{currentRegionData.biome}</strong></span>
          <span>•</span>
          <span>Órgãos Regionais: <strong>{currentRegionData.agencies.join(", ")}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Map display (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4" ref={containerRef}>
          
          {/* Map Top controls bar */}
          <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <Layers className="h-4.5 w-4.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Camadas Ativas:</span>
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-850">
                <button
                  onClick={() => setMapLayer("Vector")}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase ${mapLayer === "Vector" ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white" : "text-slate-505"}`}
                >
                  Vetor
                </button>
                <button
                  onClick={() => setMapLayer("Satellite")}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase ${mapLayer === "Satellite" ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white" : "text-slate-505"}`}
                >
                  Satélite
                </button>
                <button
                  onClick={() => setMapLayer("Heatmap")}
                  className={`text-[10px] font-bold px-3 py-1.5 rounded-md uppercase ${mapLayer === "Heatmap" ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-white" : "text-slate-505"}`}
                >
                  Poluentes
                </button>
              </div>
            </div>

            {/* Drone toggle controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDroneFlying(!droneFlying)}
                className={`text-[11px] font-bold px-3 py-2 rounded-xl border flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  droneFlying 
                    ? "bg-blue-600 border-blue-600 text-white animate-pulse" 
                    : "bg-slate-50 dark:bg-slate-950/20 text-slate-650 dark:text-slate-400 border-slate-250 dark:border-slate-850 hover:bg-slate-100"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>{droneFlying ? "Desligar Drone" : "Voo de Drone"}</span>
              </button>

              <button
                onClick={() => {
                  setGisFeatures(gisFeatures.slice(0, 2));
                  setGeojsonUploaded(false);
                }}
                className="text-[11px] font-bold px-2.5 py-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-50"
                title="Resetar Camadas Importadas"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="relative border border-slate-200 dark:border-slate-800 bg-slate-900 rounded-2xl overflow-hidden shadow-sm h-[420px]">
            <canvas
              ref={canvasRef}
              width={dimensions.width}
              height={380}
              onMouseMove={handleMouseMove}
              className="w-full h-full cursor-crosshair block"
            />

            {/* Latitude/Longitude overlay footer */}
            <div className="absolute bottom-4 left-4 bg-slate-950/85 backdrop-blur border border-slate-800/80 p-2.5 rounded-xl flex items-center space-x-4 text-slate-200 text-[10px] font-mono shadow">
              <div className="flex items-center space-x-1">
                <Crosshair className="h-3 w-3 text-emerald-400" />
                <span>LAT: <strong>{hoverCoords.lat.toFixed(6)}°</strong></span>
              </div>
              <div className="flex items-center space-x-1">
                <MousePointer className="h-3 w-3 text-cyan-400" />
                <span>LNG: <strong>{hoverCoords.lng.toFixed(6)}°</strong></span>
              </div>
              <span className="text-slate-550 hidden sm:inline">| CRS: SIRGAS 2000 (UTM 23S)</span>
            </div>
          </div>

        </div>

        {/* Right Column: Attribute data & file imports (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Spatial shape context display panel */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest">Informação Espacial</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Passe o cursor sobre os polígonos no mapa corporativo.</p>
            </div>

            {selectedFeature ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-2 animate-fade-in">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase">{selectedFeature}</h4>
                <p className="text-[11px] text-slate-650 dark:text-slate-450 leading-relaxed">
                  {gisFeatures.find(f => f.name === selectedFeature)?.description || "Nenhuma descrição disponível."}
                </p>
                <div className="text-[10px] text-emerald-600 font-semibold pt-1">
                  • Geometria: POLÍGONO VETORIAL
                </div>
              </div>
            ) : (
              <div className="p-4 text-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 py-8">
                Nenhum polígono selecionado. Posicione o cursor sobre as frentes demarcadas.
              </div>
            )}
          </div>

          {/* Import Shapefile / GeoJSON */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest">Importar Camadas Externas</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Integração bidirecional de shapefiles ou GeoJSON.</p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
              Carregue o traçado de licenciamento fornecido pela consultoria ambiental ou órgão estadual em formato de arquivo vetorial.
            </p>

            <button
              onClick={handleUploadGeoJSON}
              disabled={geojsonUploaded}
              className={`w-full text-xs font-bold py-3 rounded-xl border flex items-center justify-center space-x-2 transition-colors cursor-pointer ${
                geojsonUploaded
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-slate-900 dark:bg-slate-800 text-white hover:bg-black hover:border-black border-slate-900"
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>{geojsonUploaded ? "GeoJSON_09 Carregado!" : "Carregar GeoJSON de Teste"}</span>
            </button>

            {geojsonUploaded && (
              <div className="p-3 bg-emerald-50/55 dark:bg-emerald-950/20 text-[10px] rounded-lg border border-emerald-100 text-emerald-800 dark:text-emerald-450">
                O polígono <strong>"Área de Supressão Autorizada"</strong> foi plotado com sucesso nas coordenadas SIRGAS 2000 correspondentes às condicionantes.
              </div>
            )}
          </div>

          {/* Drone Telemetry flight info */}
          {droneFlying && (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-2xl text-xs space-y-2 animate-fade-in">
              <div className="flex items-center space-x-1.5 text-blue-800">
                <Cpu className="h-4 w-4 animate-spin-slow text-blue-650" />
                <span className="font-extrabold uppercase">Varredura de Drone Ativa</span>
              </div>
              <p className="text-[11px] text-blue-750">
                Mapeamento termográfico registrando imagens de alta definição das frentes ativas de produção e barreira de contenção secundária.
              </p>
              <div className="text-[10px] font-mono text-slate-500 bg-white/70 p-1.5 rounded border border-blue-100">
                XY: ({dronePosition.x.toFixed(1)}, {dronePosition.y.toFixed(1)}) | SENSOR: RGB-NIR
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
