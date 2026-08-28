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
  Crosshair,
  Globe,
  Activity,
  Sliders,
  FileText,
  Download,
  Zap,
  CheckCircle2,
  Radio,
  Search,
  MapPin,
  Building2,
  Sparkles,
  TrendingDown,
  History,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  Flame,
  ExternalLink
} from "lucide-react";
import { Tenant, MonitoringParam } from "../types";
import { RealLeafletMap } from "./RealLeafletMap";

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

interface SentinelScene {
  id: string;
  satellite: string;
  instrument: string;
  acquisitionDate: string;
  cloudCover: number;
  resolution: string;
  tileId: string;
  spectralIndices?: {
    meanNdvi?: number;
    meanNdwi?: number;
    meanNdmi?: number;
    vegetationHealth?: string;
    sarBackscatterVV?: number;
    sarBackscatterVH?: number;
  };
}

interface SpectralPointResult {
  coordinates: { lat: number; lng: number };
  region: string;
  satellite: string;
  bands: {
    B02_Blue: number;
    B03_Green: number;
    B04_Red: number;
    B08_NIR: number;
    B11_SWIR: number;
  };
  spectralIndices: {
    NDVI: { value: number; description: string };
    NDWI: { value: number; description: string };
    NDMI: { value: number; description: string };
  };
  evaluation: {
    status: string;
    riskLevel: string;
    recommendation: string;
  };
}

interface NdviDegradationZone {
  id: string;
  title: string;
  polygonRatio: { xRatio: number; yRatio: number }[];
  baselineNdvi: number;
  currentNdvi: number;
  dropPercentage: number;
  severity: "Crítica" | "Alta" | "Média";
  areaHectares: number;
  cause: string;
  coords: { lat: number; lng: number };
  recommendedAction: string;
}

interface NdviDegradationResponse {
  baselineDate: string;
  currentDate: string;
  totalDegradedAreaHectares: number;
  averageNdviDrop: number;
  zoneCount: number;
  zones: NdviDegradationZone[];
}

interface GlobalBiome {
  id: string;
  name: string;
  continent: string;
  countryFlag: string;
  biomeType: string;
  coords: { lat: number; lng: number };
  baselineNdvi: number;
  expectedNdwi: number;
  sarBackscatter: string;
  riskLevel: "Crítico" | "Alto" | "Moderado" | "Baixo";
  riskDescription: string;
  vegetationCover: string;
  agencies: string[];
  associatedRegionKey: "Nordeste" | "Sul" | "Sudeste" | "Norte" | "Centro-Oeste";
  mapPositionRatio: { xRatio: number; yRatio: number };
}

const GLOBAL_BIOMES: GlobalBiome[] = [
  {
    id: "south_america_amazon",
    name: "Amazônia & Bacia Pluvial Equatorial",
    continent: "América do Sul",
    countryFlag: "🇧🇷",
    biomeType: "Floresta Tropical Densa Umbrófila",
    coords: { lat: -3.1190, lng: -60.0217 },
    baselineNdvi: 0.86,
    expectedNdwi: 0.22,
    sarBackscatter: "-7.5 dB (Dossel Fechado)",
    riskLevel: "Crítico",
    riskDescription: "Pressão por desmatamento não autorizado, queimadas em períodos secos e garimpo em bacias fluviais.",
    vegetationCover: "92% Dossel Fechado com Árvores de Alto Porte (>30m)",
    agencies: ["IBAMA", "ICMBio", "IPAAM/AM", "SEMAS/PA", "UNEP"],
    associatedRegionKey: "Norte",
    mapPositionRatio: { xRatio: 30, yRatio: 56 }
  },
  {
    id: "south_america_caatinga_cerrado",
    name: "Caatinga & Cerrado Neotropical",
    continent: "América do Sul",
    countryFlag: "🇧🇷",
    biomeType: "Savana Xerófila & Mata Seca",
    coords: { lat: -8.0476, lng: -34.8770 },
    baselineNdvi: 0.62,
    expectedNdwi: -0.15,
    sarBackscatter: "-12.2 dB (Espalhamento Moderado)",
    riskLevel: "Alto",
    riskDescription: "Risco de desertificação acelerada no semiárido, queimadas e supressão vegetal para energia.",
    vegetationCover: "65% Estrato Arbustivo com Cactáceas e Caducifólias",
    agencies: ["CPRH/PE", "INEMA/BA", "SEMACE/CE", "SUDENE", "IBAMA"],
    associatedRegionKey: "Nordeste",
    mapPositionRatio: { xRatio: 36, yRatio: 62 }
  },
  {
    id: "south_america_atlantic",
    name: "Mata Atlântica & Florestas de Encosta",
    continent: "América do Sul",
    countryFlag: "🇧🇷",
    biomeType: "Floresta Ombrófila Mista & Estacional",
    coords: { lat: -22.9068, lng: -43.1729 },
    baselineNdvi: 0.78,
    expectedNdwi: 0.08,
    sarBackscatter: "-9.1 dB (Estrutura Densa)",
    riskLevel: "Alto",
    riskDescription: "Fragmentação de habitat, expansão de contorno urbano e deslizamentos de terra em encostas.",
    vegetationCover: "78% Fragmentos de Floresta Tropical de Altitude",
    agencies: ["CETESB/SP", "INEA/RJ", "FEAM/MG", "IBAMA"],
    associatedRegionKey: "Sudeste",
    mapPositionRatio: { xRatio: 35, yRatio: 72 }
  },
  {
    id: "south_america_pampa",
    name: "Pampa & Mata de Araucárias",
    continent: "América do Sul",
    countryFlag: "🇧🇷",
    biomeType: "Campos Nativos & Floresta Ombrófila Mista",
    coords: { lat: -25.4284, lng: -49.2733 },
    baselineNdvi: 0.71,
    expectedNdwi: 0.05,
    sarBackscatter: "-10.8 dB (Coníferas & Gramíneas)",
    riskLevel: "Moderado",
    riskDescription: "Descaracterização de campos nativos por monoculturas e eventos de geada com perda de biomassa.",
    vegetationCover: "70% Gramíneas e Araucaria angustifolia",
    agencies: ["FEPAM/RS", "IAT/PR", "IMA/SC", "IBAMA"],
    associatedRegionKey: "Sul",
    mapPositionRatio: { xRatio: 33, yRatio: 78 }
  },
  {
    id: "south_america_pantanal",
    name: "Pantanal & Chaco Hídrico",
    continent: "América do Sul",
    countryFlag: "🇧🇷",
    biomeType: "Planície Alagável & Savana Úmida",
    coords: { lat: -15.7801, lng: -47.9292 },
    baselineNdvi: 0.74,
    expectedNdwi: 0.35,
    sarBackscatter: "-8.5 dB (Atenuação Hídrica)",
    riskLevel: "Crítico",
    riskDescription: "Incêndios em períodos de seca prolongada e alteração do pulso de inundação dos rios.",
    vegetationCover: "82% Vegetação Ripária e Campos Inundáveis",
    agencies: ["SEMA/MT", "IMASUL/MS", "IBAMA"],
    associatedRegionKey: "Centro-Oeste",
    mapPositionRatio: { xRatio: 32, yRatio: 68 }
  },
  {
    id: "north_america_boreal",
    name: "Taiga Boreal & Tundra Canadense",
    continent: "América do Norte",
    countryFlag: "🇨🇦",
    biomeType: "Taiga de Coníferas Subártica",
    coords: { lat: 56.1304, lng: -106.3468 },
    baselineNdvi: 0.65,
    expectedNdwi: 0.12,
    sarBackscatter: "-11.4 dB (Agulhas de Conífera)",
    riskLevel: "Alto",
    riskDescription: "Incêndios florestais catastróficos no verão e degradação do solo congelado (permafrost).",
    vegetationCover: "80% Picea mariana (Abeto Negro) e Pinus banksiana",
    agencies: ["Environment Canada", "USGS", "EPA"],
    associatedRegionKey: "Norte",
    mapPositionRatio: { xRatio: 18, yRatio: 22 }
  },
  {
    id: "north_america_temperate",
    name: "Pradarias Temperadas & Floresta Caducifólia",
    continent: "América do Norte",
    countryFlag: "🇺🇸",
    biomeType: "Pradarias do Centro & Floresta Temperada",
    coords: { lat: 39.8283, lng: -98.5795 },
    baselineNdvi: 0.68,
    expectedNdwi: -0.02,
    sarBackscatter: "-12.0 dB",
    riskLevel: "Moderado",
    riskDescription: "Sobre-exploração de aquíferos subterrâneos e erosão eólica de solos agrícolas.",
    vegetationCover: "75% Gramíneas Nativas e Carvalho-Norte-Americano",
    agencies: ["EPA USA", "USFS", "NOAA"],
    associatedRegionKey: "Centro-Oeste",
    mapPositionRatio: { xRatio: 20, yRatio: 32 }
  },
  {
    id: "europe_mediterranean",
    name: "Floresta Temperada & Bioma Mediterrâneo",
    continent: "Europa",
    countryFlag: "🇪🇺",
    biomeType: "Floresta Caducifólia & Matagal Sclerophyllous",
    coords: { lat: 48.8566, lng: 2.3522 },
    baselineNdvi: 0.72,
    expectedNdwi: 0.04,
    sarBackscatter: "-9.8 dB",
    riskLevel: "Moderado",
    riskDescription: "Estresse térmico prolongado no verão, secas em bacias e queimadas na zona costeira.",
    vegetationCover: "68% Faia, Carvalho e Oliveiras Nativas",
    agencies: ["EEA (European Environment Agency)", "Copernicus Land", "BfN"],
    associatedRegionKey: "Sudeste",
    mapPositionRatio: { xRatio: 48, yRatio: 28 }
  },
  {
    id: "africa_congo",
    name: "Bacia do Congo & Savanas do Sahel",
    continent: "África",
    countryFlag: "🇨🇩",
    biomeType: "Floresta Equatorial Densa Central",
    coords: { lat: -0.2280, lng: 15.8277 },
    baselineNdvi: 0.84,
    expectedNdwi: 0.18,
    sarBackscatter: "-8.0 dB (Dossel Tropical)",
    riskLevel: "Crítico",
    riskDescription: "Extração madeireira predatória e avanço da linha de desertificação ao sul do Saara.",
    vegetationCover: "88% Floresta Umbrófila de Baixada Equatorial",
    agencies: ["UNEP Africa", "COMIFAC", "African Wildlife Foundation"],
    associatedRegionKey: "Norte",
    mapPositionRatio: { xRatio: 52, yRatio: 54 }
  },
  {
    id: "asia_siberia",
    name: "Taiga Siberiana & Estepes Central-Asiáticas",
    continent: "Ásia",
    countryFlag: "🇷🇺",
    biomeType: "Floresta Boreal de Lariço & Estepe Árida",
    coords: { lat: 60.0000, lng: 100.0000 },
    baselineNdvi: 0.58,
    expectedNdwi: 0.08,
    sarBackscatter: "-13.5 dB",
    riskLevel: "Alto",
    riskDescription: "Queimadas de turfa com liberação de carbono e retração rápida da cobertura de neve.",
    vegetationCover: "72% Larix sibirica e Picea obovata",
    agencies: ["Ministry of Natural Resources Russia", "UNEP Asia"],
    associatedRegionKey: "Norte",
    mapPositionRatio: { xRatio: 74, yRatio: 20 }
  },
  {
    id: "asia_southeast",
    name: "Florestas Tropicais da Insulíndia & Himalaia",
    continent: "Ásia",
    countryFlag: "🇮🇩",
    biomeType: "Floresta Pluvial Tropical Insular",
    coords: { lat: -0.7893, lng: 113.9213 },
    baselineNdvi: 0.85,
    expectedNdwi: 0.25,
    sarBackscatter: "-7.2 dB",
    riskLevel: "Crítico",
    riskDescription: "Conversão de solos de turfeira para palma de óleo e incêndios de fumaça regional.",
    vegetationCover: "85% Dipterocarpáceas de Grande Porte",
    agencies: ["ASEAN Centre for Biodiversity", "KLHK Indonesia"],
    associatedRegionKey: "Norte",
    mapPositionRatio: { xRatio: 78, yRatio: 60 }
  },
  {
    id: "oceania_australia",
    name: "Outback Árido & Florestas de Queensland",
    continent: "Oceania",
    countryFlag: "🇦🇺",
    biomeType: "Savana Arbustiva Xerófila & Barreira Costeira",
    coords: { lat: -25.2744, lng: 133.7751 },
    baselineNdvi: 0.32,
    expectedNdwi: -0.28,
    sarBackscatter: "-15.2 dB",
    riskLevel: "Alto",
    riskDescription: "Incêndios catastróficos em eucaliptais e branqueamento de recifes costeiros em ondas de calor.",
    vegetationCover: "40% Eucaliptos Xerófilos e Acácias Nativas",
    agencies: ["DCCEEW Australia", "Great Barrier Reef Marine Authority"],
    associatedRegionKey: "Nordeste",
    mapPositionRatio: { xRatio: 84, yRatio: 74 }
  },
  {
    id: "antarctica_polar",
    name: "Deserto Polar Antártico & Crioesfera",
    continent: "Antártida",
    countryFlag: "🇦🇶",
    biomeType: "Tundra Polar & Manto de Gelo",
    coords: { lat: -75.2504, lng: -0.0713 },
    baselineNdvi: 0.02,
    expectedNdwi: -0.05,
    sarBackscatter: "-18.5 dB",
    riskLevel: "Crítico",
    riskDescription: "Desprendimento de icebergs maciços e aceleração do fluxo de geleiras pelo aquecimento do oceano.",
    vegetationCover: "< 2% Liquens, Musgos e Algas de Neve Costeiras",
    agencies: ["SCAR", "PROANTAR", "ATCM Secretariat"],
    associatedRegionKey: "Sul",
    mapPositionRatio: { xRatio: 55, yRatio: 92 }
  }
];

export default function GISTab({ tenant, params }: GISTabProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // States
  const [mapLayer, setMapLayer] = useState<"Satellite" | "Vector" | "Heatmap" | "NDVI" | "NDWI" | "SAR_Radar">("NDVI");
  const [selectedSatellite, setSelectedSatellite] = useState<"Sentinel-2" | "Sentinel-1">("Sentinel-2");
  const [hoverCoords, setHoverCoords] = useState({ lat: -8.0476, lng: -34.8770 });
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [droneFlying, setDroneFlying] = useState(false);
  const [dronePosition, setDronePosition] = useState({ x: 150, y: 150 });
  const [geojsonUploaded, setGeojsonUploaded] = useState(false);

  // Sentinel Satellite State
  const [sentinelScenes, setSentinelScenes] = useState<SentinelScene[]>([]);
  const [activeScene, setActiveScene] = useState<SentinelScene | null>(null);
  const [isLoadingSentinel, setIsLoadingSentinel] = useState<boolean>(false);
  const [inspectPoint, setInspectPoint] = useState<{ x: number; y: number } | null>({ x: 200, y: 150 });
  const [spectralAnalysis, setSpectralAnalysis] = useState<SpectralPointResult | null>(null);
  const [sentinelAlerts, setSentinelAlerts] = useState<any[]>([]);
  const [maxCloudCover, setMaxCloudCover] = useState<number>(15);

  // NDVI Degradation Overlay States
  const [showNdviDegradationOverlay, setShowNdviDegradationOverlay] = useState<boolean>(true);
  const [degradationData, setDegradationData] = useState<NdviDegradationResponse | null>(null);
  const [selectedDegradationZone, setSelectedDegradationZone] = useState<NdviDegradationZone | null>(null);
  const [timeSpan, setTimeSpan] = useState<"6m" | "12m" | "24m">("12m");

  // World Map Biome Selection States
  const [activeGisView, setActiveGisView] = useState<"WorldMap" | "LocalCanvas">("WorldMap");
  const [selectedGlobalBiomeId, setSelectedGlobalBiomeId] = useState<string>("south_america_caatinga_cerrado");
  const [selectedContinentFilter, setSelectedContinentFilter] = useState<string>("Todos");
  const [hoveredBiomeId, setHoveredBiomeId] = useState<string | null>(null);
  const [biomeSyncNotification, setBiomeSyncNotification] = useState<string | null>(null);

  // Technical Metadata & Sentinel Specs Side Panel State
  const [sentinelMetaTab, setSentinelMetaTab] = useState<"MSI" | "SAR" | "ORBIT">("MSI");

  const selectedGlobalBiome = GLOBAL_BIOMES.find(b => b.id === selectedGlobalBiomeId) || GLOBAL_BIOMES[1];

  const handleActivateBiomeMonitoring = (biome: GlobalBiome) => {
    setSelectedGlobalBiomeId(biome.id);
    setSelectedRegion(biome.associatedRegionKey);
    fetchSentinelData(biome.associatedRegionKey);
    
    setBiomeSyncNotification(`Constelação Copernicus reorientada para o bioma: ${biome.name} (${biome.continent})`);
    setTimeout(() => {
      setBiomeSyncNotification(null);
    }, 5000);

    setActiveGisView("LocalCanvas");
  };

  // Region Presets
  const [selectedRegion, setSelectedRegion] = useState<"Nordeste" | "Sul" | "Sudeste" | "Norte" | "Centro-Oeste">("Sul");

  // Real City Search & Nominatim Geocoding States
  const [citySearchQuery, setCitySearchQuery] = useState<string>("");
  const [isSearchingCity, setIsSearchingCity] = useState<boolean>(false);
  const [citySearchError, setCitySearchError] = useState<string | null>(null);
  const [customCityTarget, setCustomCityTarget] = useState<{ lat: number; lng: number; name: string } | null>({
    lat: -26.9194,
    lng: -49.0661,
    name: "Blumenau, Santa Catarina, Brasil"
  });

  // Google Maps Static & High-Res Satellite Snapshot States
  const [staticMapType, setStaticMapType] = useState<"satellite" | "hybrid" | "terrain">("satellite");
  const [staticMapZoom, setStaticMapZoom] = useState<number>(15);
  const [staticSnapshotInfo, setStaticSnapshotInfo] = useState<any>(null);
  const [isLoadingStaticSnapshot, setIsLoadingStaticSnapshot] = useState<boolean>(false);

  const fetchStaticSatelliteInfo = async (lat: number, lng: number, zoom: number, type: string) => {
    setIsLoadingStaticSnapshot(true);
    try {
      const res = await fetch(`/api/maps/static-satellite?lat=${lat}&lng=${lng}&zoom=${zoom}&maptype=${type}&width=640&height=400`);
      if (res.ok) {
        const data = await res.json();
        setStaticSnapshotInfo(data);
      }
    } catch (err) {
      console.error("Erro ao buscar snapshot de satélite:", err);
    } finally {
      setIsLoadingStaticSnapshot(false);
    }
  };

  useEffect(() => {
    const lat = customCityTarget ? customCityTarget.lat : -26.9194;
    const lng = customCityTarget ? customCityTarget.lng : -49.0661;
    fetchStaticSatelliteInfo(lat, lng, staticMapZoom, staticMapType);
  }, [customCityTarget, selectedRegion, staticMapZoom, staticMapType]);

  const PRESET_CITIES = [
    { label: "📍 Blumenau - SC", query: "Blumenau, Santa Catarina, Brasil", region: "Sul" as const, lat: -26.9194, lng: -49.0661 },
    { label: "📍 Florianópolis - SC", query: "Florianópolis, Santa Catarina, Brasil", region: "Sul" as const, lat: -27.5948, lng: -48.5482 },
    { label: "📍 Curitiba - PR", query: "Curitiba, Paraná, Brasil", region: "Sul" as const, lat: -25.4284, lng: -49.2733 },
    { label: "📍 São Paulo - SP", query: "São Paulo, SP, Brasil", region: "Sudeste" as const, lat: -23.5505, lng: -46.6333 },
    { label: "📍 Rio de Janeiro - RJ", query: "Rio de Janeiro, RJ, Brasil", region: "Sudeste" as const, lat: -22.9068, lng: -43.1729 },
    { label: "📍 Manaus - AM", query: "Manaus, Amazonas, Brasil", region: "Norte" as const, lat: -3.1190, lng: -60.0217 },
    { label: "📍 Recife - PE", query: "Recife, Pernambuco, Brasil", region: "Nordeste" as const, lat: -8.0476, lng: -34.8770 },
    { label: "📍 Brasília - DF", query: "Brasília, DF, Brasil", region: "Centro-Oeste" as const, lat: -15.7801, lng: -47.9292 },
  ];

  const handleSearchCity = async (overrideQuery?: string, overrideRegion?: "Nordeste" | "Sul" | "Sudeste" | "Norte" | "Centro-Oeste", presetCoords?: { lat: number; lng: number }) => {
    const query = (overrideQuery || citySearchQuery).trim();
    if (!query && !presetCoords) return;

    setIsSearchingCity(true);
    setCitySearchError(null);

    if (overrideRegion) {
      setSelectedRegion(overrideRegion);
    }

    if (presetCoords) {
      setCustomCityTarget({ lat: presetCoords.lat, lng: presetCoords.lng, name: query });
      await handleLeafletPointInspect({ lat: presetCoords.lat, lng: presetCoords.lng });
      setIsSearchingCity(false);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      if (!res.ok) {
        throw new Error("Erro na comunicação com o geocodificador.");
      }
      const data = await res.json();
      if (!data || data.length === 0) {
        setCitySearchError(`Nenhuma cidade ou município encontrado para "${query}". Tente buscar ex: "Blumenau SC" ou "São Paulo".`);
        return;
      }

      const top = data[0];
      const lat = parseFloat(top.lat);
      const lng = parseFloat(top.lon);
      const displayName = top.display_name;

      setCustomCityTarget({ lat, lng, name: displayName });

      // Automatically inspect satellite spectral signature for this newly geocoded city
      await handleLeafletPointInspect({ lat, lng });

    } catch (err: any) {
      console.error("Erro no geocodificador:", err);
      setCitySearchError("Erro ao obter coordenadas geográficas da cidade. Verifique o nome digitado.");
    } finally {
      setIsSearchingCity(false);
    }
  };

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
          color: "rgba(16, 185, 129, 0.35)",
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
          color: "rgba(239, 68, 68, 0.3)",
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
          color: "rgba(16, 185, 129, 0.35)",
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
          color: "rgba(239, 68, 68, 0.3)",
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
          color: "rgba(16, 185, 129, 0.3)",
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
          color: "rgba(239, 68, 68, 0.3)",
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
          color: "rgba(16, 185, 129, 0.35)",
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
          color: "rgba(239, 68, 68, 0.3)",
          description: "Ponto de outorga de água e descarte com sensores de turbidez automatizados."
        }
      ]
    },
    "Centro-Oeste": {
      label: "Centro-Oeste",
      tagline: "Corredor Agroindustrial / Bacia do Pantanal & Cerrado",
      biome: "Cerrado & Pantanal",
      agencies: ["SEMA/MT", "IMASUL/MS", "IBAMA"],
      baseLat: -15.7801,
      baseLng: -47.9292,
      features: [
        {
          name: "Reserva Legal Cerrado / Área de Recarga de Aquiífero",
          type: "Reserve" as const,
          coordinates: [
            { x: 90, y: 70 },
            { x: 180, y: 50 },
            { x: 210, y: 120 },
            { x: 130, y: 140 }
          ],
          color: "rgba(16, 185, 129, 0.35)",
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
          color: "rgba(239, 68, 68, 0.3)",
          description: "Unidade de tratamento biológico com análises constantes de DBO/DQO."
        }
      ]
    }
  };

  const currentRegionData = REGION_PRESETS[selectedRegion];
  const [gisFeatures, setGisFeatures] = useState<CustomGISFeature[]>(currentRegionData.features);

  // Update features when region or timeSpan changes
  useEffect(() => {
    setGisFeatures(REGION_PRESETS[selectedRegion].features);
    fetchSentinelData(selectedRegion);
  }, [selectedRegion, timeSpan]);

  // Query Copernicus Sentinel Scenes & NDVI Degradation Overlay Data from backend
  const fetchSentinelData = async (regionName: string) => {
    try {
      setIsLoadingSentinel(true);
      
      // 1. Fetch available Sentinel satellite scenes
      const resQuery = await fetch("/api/sentinel/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: regionName,
          satellite: selectedSatellite,
          maxCloudCover,
          dateRange: "30d"
        })
      });

      if (resQuery.ok) {
        const data = await resQuery.json();
        if (data.scenes && data.scenes.length > 0) {
          setSentinelScenes(data.scenes);
          setActiveScene(data.scenes[0]);
        }
      }

      // 2. Fetch point spectral analysis for default point
      const defaultLat = currentRegionData.baseLat;
      const defaultLng = currentRegionData.baseLng;

      const resSpectral = await fetch("/api/sentinel/spectral-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: defaultLat,
          lng: defaultLng,
          region: regionName,
          layer: mapLayer
        })
      });

      if (resSpectral.ok) {
        const spectralData = await resSpectral.json();
        setSpectralAnalysis(spectralData);
      }

      // 3. Fetch deforestation alerts
      const resAlerts = await fetch("/api/sentinel/deforestation-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: regionName,
          tenantId: tenant.id
        })
      });

      if (resAlerts.ok) {
        const alertsData = await resAlerts.json();
        setSentinelAlerts(alertsData.alerts || []);
      }

      // 4. Fetch historical NDVI degradation overlay data
      const resDegradation = await fetch("/api/sentinel/ndvi-degradation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: regionName,
          timeSpan
        })
      });

      if (resDegradation.ok) {
        const degData: NdviDegradationResponse = await resDegradation.json();
        setDegradationData(degData);
        if (degData.zones && degData.zones.length > 0) {
          setSelectedDegradationZone(degData.zones[0]);
        }
      }

    } catch (err) {
      console.error("[GISTab] Erro ao consultar dados de satélite Sentinel:", err);
    } finally {
      setIsLoadingSentinel(false);
    }
  };

  // Perform point spectral inspection on canvas click
  const handleCanvasClick = async (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setInspectPoint({ x, y });

    // Check if clicked near a degradation zone
    if (degradationData?.zones) {
      for (const zone of degradationData.zones) {
        const pts = zone.polygonRatio.map(p => ({
          x: p.xRatio * dimensions.width,
          y: p.yRatio * dimensions.height
        }));
        const centerX = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
        const centerY = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (dist < 60) {
          setSelectedDegradationZone(zone);
          break;
        }
      }
    }

    const baseLat = currentRegionData.baseLat;
    const baseLng = currentRegionData.baseLng;

    const lat = Number((baseLat - (y / dimensions.height) * 0.15).toFixed(6));
    const lng = Number((baseLng - (x / dimensions.width) * 0.25).toFixed(6));

    try {
      setIsLoadingSentinel(true);
      const res = await fetch("/api/sentinel/spectral-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          region: selectedRegion,
          layer: mapLayer
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSpectralAnalysis(data);
      }
    } catch (err) {
      console.error("[GISTab] Erro ao analisar espectro de ponto:", err);
    } finally {
      setIsLoadingSentinel(false);
    }
  };

  // Inspect exact geographic coordinates from Real Leaflet Map
  const handleLeafletPointInspect = async (coords: { lat: number; lng: number }) => {
    const { lat, lng } = coords;
    setHoverCoords({ lat, lng });

    try {
      setIsLoadingSentinel(true);
      const res = await fetch("/api/sentinel/spectral-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat,
          lng,
          region: selectedRegion,
          layer: mapLayer
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSpectralAnalysis(data);
      }
    } catch (err) {
      console.error("[GISTab] Erro ao analisar ponto no mapa real Leaflet:", err);
    } finally {
      setIsLoadingSentinel(false);
    }
  };

  // Fluid canvas resizing
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 400),
          height: Math.max(height, 380)
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Main Canvas render loop for Sentinel layers & vector shapes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // 1. Draw Satellite Background / Spectral Index Heatmap
    if (mapLayer === "NDVI") {
      // NDVI Index Heatmap Background (Green = Dense vegetation, Yellow = Stress, Red = Bare Soil/Water)
      const grad = ctx.createLinearGradient(0, 0, dimensions.width, dimensions.height);
      grad.addColorStop(0, "#022c22");   // Very dense green NIR
      grad.addColorStop(0.35, "#065f46"); // Green
      grad.addColorStop(0.65, "#854d0e"); // Olive/Yellow stress
      grad.addColorStop(1, "#1e293b");    // Bare soil/Urban slate
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Draw NDVI spectral pixel simulation grid
      for (let x = 0; x < dimensions.width; x += 40) {
        for (let y = 0; y < dimensions.height; y += 40) {
          const pseudoNdvi = 0.3 + (Math.sin(x * 0.05) + Math.cos(y * 0.05)) * 0.35;
          if (pseudoNdvi > 0.6) {
            ctx.fillStyle = "rgba(16, 185, 129, 0.25)"; // High NDVI Green
          } else if (pseudoNdvi > 0.35) {
            ctx.fillStyle = "rgba(245, 158, 11, 0.25)"; // Medium NDVI Yellow
          } else {
            ctx.fillStyle = "rgba(239, 68, 68, 0.2)";  // Low NDVI Red
          }
          ctx.fillRect(x, y, 38, 38);
        }
      }
    } else if (mapLayer === "NDWI") {
      // NDWI Water Surface Index (Deep Blue for rivers/dams/reservoirs)
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      // Water channel simulation
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 24;
      ctx.beginPath();
      ctx.moveTo(0, dimensions.height * 0.3);
      ctx.bezierCurveTo(
        dimensions.width * 0.3, dimensions.height * 0.1,
        dimensions.width * 0.6, dimensions.height * 0.7,
        dimensions.width, dimensions.height * 0.5
      );
      ctx.stroke();

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 10;
      ctx.stroke();
    } else if (mapLayer === "SAR_Radar") {
      // Sentinel-1 Synthetic Aperture Radar (Granular backscatter texture)
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      for (let i = 0; i < 200; i++) {
        const rx = (Math.sin(i * 12.3) * 0.5 + 0.5) * dimensions.width;
        const ry = (Math.cos(i * 7.1) * 0.5 + 0.5) * dimensions.height;
        ctx.fillRect(rx, ry, 6, 2);
      }
    } else if (mapLayer === "Satellite") {
      // True Color Sentinel RGB
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      ctx.fillStyle = "#064e3b"; // Forest patch
      ctx.beginPath();
      ctx.arc(180, 120, 85, 0, Math.PI * 2);
      ctx.fill();
    } else if (mapLayer === "Vector") {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      for (let i = 0; i < dimensions.width; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, dimensions.height);
        ctx.stroke();
      }
    } else if (mapLayer === "Heatmap") {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      const heatPoints = [
        { x: 300, y: 180, r: 110, color1: "rgba(239,68,68,0.5)", color2: "rgba(239,68,68,0)" },
        { x: 120, y: 220, r: 85, color1: "rgba(245,158,11,0.45)", color2: "rgba(245,158,11,0)" }
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

    // 2. Draw Vector GIS Polygon Shapes
    gisFeatures.forEach(feat => {
      ctx.fillStyle = feat.color;
      ctx.strokeStyle = feat.color.replace("0.35", "1.0").replace("0.3", "1.0");
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(feat.coordinates[0].x, feat.coordinates[0].y);
      for (let i = 1; i < feat.coordinates.length; i++) {
        ctx.lineTo(feat.coordinates[i].x, feat.coordinates[i].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      const centerX = feat.coordinates.reduce((sum, c) => sum + c.x, 0) / feat.coordinates.length;
      const centerY = feat.coordinates.reduce((sum, c) => sum + c.y, 0) / feat.coordinates.length;
      ctx.fillStyle = mapLayer === "Vector" ? "#0f172a" : "#ffffff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(feat.name.split(" ")[0] + " Area", centerX, centerY);
    });

    // 3. Draw Active Telemetry Sensors
    const activeParams = (params || []).filter(p => p && p.tenantId === tenant?.id);
    activeParams.forEach((param, idx) => {
      const x = 80 + (idx * 110) % (dimensions.width - 150);
      const y = 90 + (idx * 70) % (dimensions.height - 130);

      let pinColor = "#10b981";
      if (param.status === "Critical") pinColor = "#ef4444";
      else if (param.status === "Alert") pinColor = "#f59e0b";

      ctx.fillStyle = pinColor;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = pinColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 11, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = mapLayer === "Vector" ? "#0f172a" : "#ffffff";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${param.parameter.split(" ")[0]} (${param.value})`, x + 15, y + 3);
    });

    // 4. Draw Clicked Spectral Inspection Point Marker
    if (inspectPoint) {
      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(inspectPoint.x, inspectPoint.y, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#00e5ff";
      ctx.beginPath();
      ctx.arc(inspectPoint.x, inspectPoint.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Crosshair lines
      ctx.strokeStyle = "rgba(0, 229, 255, 0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(inspectPoint.x - 20, inspectPoint.y);
      ctx.lineTo(inspectPoint.x + 20, inspectPoint.y);
      ctx.moveTo(inspectPoint.x, inspectPoint.y - 20);
      ctx.lineTo(inspectPoint.x, inspectPoint.y + 20);
      ctx.stroke();
    }

    // 5. Draw Drone Position if flying
    if (droneFlying) {
      ctx.fillStyle = "#3b82f6";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(dronePosition.x, dronePosition.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(dronePosition.x, dronePosition.y, 35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. Draw Historical NDVI Degradation Overlay Layer (Decreasing Vegetation Index Overlay)
    if (showNdviDegradationOverlay && degradationData?.zones) {
      degradationData.zones.forEach((zone) => {
        const pts = zone.polygonRatio.map(p => ({
          x: p.xRatio * dimensions.width,
          y: p.yRatio * dimensions.height
        }));

        if (pts.length < 3) return;

        const isSelected = selectedDegradationZone?.id === zone.id;
        const isCritical = zone.severity === "Crítica";

        // Fill degradation polygon
        ctx.fillStyle = isCritical
          ? (isSelected ? "rgba(225, 29, 72, 0.55)" : "rgba(225, 29, 72, 0.38)")
          : (isSelected ? "rgba(245, 158, 11, 0.5)" : "rgba(245, 158, 11, 0.32)");

        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.fill();

        // GIS Diagonal Hatching Lines for clear visual overlay
        ctx.save();
        ctx.clip();
        ctx.strokeStyle = isCritical ? "rgba(225, 29, 72, 0.75)" : "rgba(245, 158, 11, 0.75)";
        ctx.lineWidth = 1.5;
        for (let pos = -dimensions.width; pos < dimensions.width * 2; pos += 10) {
          ctx.beginPath();
          ctx.moveTo(pos, 0);
          ctx.lineTo(pos + dimensions.height, dimensions.height);
          ctx.stroke();
        }
        ctx.restore();

        // Outer contour dashed border
        ctx.strokeStyle = isCritical ? "#f43f5e" : "#fbbf24";
        ctx.lineWidth = isSelected ? 3.5 : 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        // Center warning badge tag
        const centerX = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
        const centerY = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;

        const tagText = `ΔNDVI ${zone.dropPercentage}% (${zone.areaHectares} ha)`;
        ctx.font = "bold 10px monospace";
        const textWidth = ctx.measureText(tagText).width;

        ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
        ctx.fillRect(centerX - textWidth / 2 - 8, centerY - 11, textWidth + 16, 22);

        ctx.strokeStyle = isCritical ? "#f43f5e" : "#f59e0b";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(centerX - textWidth / 2 - 8, centerY - 11, textWidth + 16, 22);

        ctx.fillStyle = isCritical ? "#f43f5e" : "#fbbf24";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(tagText, centerX, centerY);
      });
    }

  }, [dimensions, mapLayer, gisFeatures, params, tenant, droneFlying, dronePosition, inspectPoint, showNdviDegradationOverlay, degradationData, selectedDegradationZone]);

  // Drone movement simulation
  useEffect(() => {
    if (!droneFlying) return;
    const interval = setInterval(() => {
      setDronePosition(prev => {
        let nextX = prev.x + (Math.random() - 0.45) * 12;
        let nextY = prev.y + (Math.random() - 0.5) * 10;

        if (nextX < 20 || nextX > dimensions.width - 20) nextX = dimensions.width / 2;
        if (nextY < 20 || nextY > dimensions.height - 20) nextY = dimensions.height / 2;

        return { x: nextX, y: nextY };
      });
    }, 150);

    return () => clearInterval(interval);
  }, [droneFlying, dimensions]);

  // Mouse hover coordinate tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const baseLat = currentRegionData.baseLat;
    const baseLng = currentRegionData.baseLng;

    const lat = baseLat - (y / dimensions.height) * 0.15;
    const lng = baseLng - (x / dimensions.width) * 0.25;

    setHoverCoords({ lat, lng });

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
    const geojsonZone: CustomGISFeature = {
      name: "Área de Supressão Autorizada GeoJSON_09",
      type: "Zone",
      coordinates: [
        { x: 30, y: 260 },
        { x: 120, y: 240 },
        { x: 100, y: 310 },
        { x: 40, y: 300 }
      ],
      color: "rgba(245, 158, 11, 0.35)",
      description: "Polígono importado do Shapefile estadual homologado."
    };
    setGisFeatures([...gisFeatures, geojsonZone]);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8" id="gis-module-container">
      
      {/* Header Banner with Copernicus Branding */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Cartografia Digital & Sensoriamento Remoto
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 uppercase tracking-widest">
              Copernicus Sentinel-2 & SAR
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitoramento de dossel vegetal (NDVI), corpos d'água (NDWI) e alertas de desmatamento por radar de abertura sintética (SAR).
          </p>
        </div>

        {/* Macrorregiões do Brasil Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          {(["Nordeste", "Sul", "Sudeste", "Norte", "Centro-Oeste"] as const).map((regionKey) => (
            <button
              key={regionKey}
              type="button"
              onClick={() => {
                setSelectedRegion(regionKey);
                setCustomCityTarget(null);
              }}
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

      {/* Header Banner with Copernicus Branding & Mode Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Cartografia Digital & Sensoriamento Remoto
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 uppercase tracking-widest">
              Copernicus Sentinel-2 & SAR
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitoramento de dossel vegetal (NDVI), corpos d'água (NDWI) e biomas globais com constelação de satélites europeus.
          </p>
        </div>

        {/* View Mode Switcher: Mapa Múndi vs Local GIS */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveGisView("WorldMap")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
              activeGisView === "WorldMap"
                ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Globe className="h-4 w-4" />
            <span>Mapa Múndi de Biomas</span>
            <span className="px-1.5 py-0.5 rounded-md text-[9px] bg-emerald-950/60 text-emerald-300 font-mono">
              13 Global
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveGisView("LocalCanvas")}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-2 ${
              activeGisView === "LocalCanvas"
                ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Satellite className="h-4 w-4" />
            <span>GIS & Imagens 10m Sentinel</span>
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {biomeSyncNotification && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <Radio className="h-4 w-4 animate-pulse text-emerald-500" />
            <span>{biomeSyncNotification}</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
            Copernicus Synced
          </span>
        </div>
      )}

      {/* WORLD MAP SECTION */}
      {activeGisView === "WorldMap" && (
        <div className="space-y-6">
          
          {/* Continent Filter Bar & World Map Card */}
          <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-emerald-500" />
                  <span>Mapa Múndi de Biomas Globais & Pontos de Monitoramento</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Clique em qualquer região do planeta para inspecionar os índices ecológicos de linha de base e acionar o monitoramento Sentinel.
                </p>
              </div>

              {/* Continent Filter Pills */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                {["Todos", "América do Sul", "América do Norte", "Europa", "África", "Ásia", "Oceania", "Antártida"].map((cont) => (
                  <button
                    key={cont}
                    type="button"
                    onClick={() => setSelectedContinentFilter(cont)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      selectedContinentFilter === cont
                        ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {cont}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG World Map Canvas */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 p-2 shadow-2xl">
              <svg viewBox="0 0 800 450" className="w-full h-auto rounded-xl select-none">
                {/* Graticule Lines */}
                <line x1="0" y1="225" x2="800" y2="225" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="400" y1="0" x2="400" y2="450" stroke="rgba(51, 65, 85, 0.4)" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="140" x2="800" y2="140" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="1" strokeDasharray="2 2" />
                <line x1="0" y1="310" x2="800" y2="310" stroke="rgba(51, 65, 85, 0.25)" strokeWidth="1" strokeDasharray="2 2" />

                <text x="12" y="220" fill="rgba(148, 163, 184, 0.4)" fontSize="9" fontFamily="monospace">Equador 0°</text>
                <text x="12" y="135" fill="rgba(148, 163, 184, 0.3)" fontSize="8" fontFamily="monospace">Trópico de Câncer 23.5°N</text>
                <text x="12" y="305" fill="rgba(148, 163, 184, 0.3)" fontSize="8" fontFamily="monospace">Trópico de Capricórnio 23.5°S</text>
                <text x="405" y="18" fill="rgba(148, 163, 184, 0.4)" fontSize="9" fontFamily="monospace">Meridiano 0°</text>

                {/* Continental Landmass Paths */}
                {/* North America */}
                <path d="M 40,80 Q 90,40 180,60 Q 230,100 200,160 Q 140,220 80,180 Z" fill="rgba(30, 41, 59, 0.85)" stroke="rgba(71, 85, 105, 0.6)" strokeWidth="1.5" />
                {/* South America */}
                <path d="M 180,210 Q 320,220 300,320 Q 260,410 200,390 Q 170,300 180,210 Z" fill="rgba(30, 41, 59, 0.85)" stroke="rgba(71, 85, 105, 0.6)" strokeWidth="1.5" />
                {/* Europe */}
                <path d="M 330,70 Q 420,60 450,110 Q 400,150 340,130 Z" fill="rgba(30, 41, 59, 0.85)" stroke="rgba(71, 85, 105, 0.6)" strokeWidth="1.5" />
                {/* Africa */}
                <path d="M 320,160 Q 460,170 470,270 Q 410,380 340,350 Q 310,250 320,160 Z" fill="rgba(30, 41, 59, 0.85)" stroke="rgba(71, 85, 105, 0.6)" strokeWidth="1.5" />
                {/* Asia */}
                <path d="M 450,50 Q 660,40 720,140 Q 640,240 500,190 Q 450,130 450,50 Z" fill="rgba(30, 41, 59, 0.85)" stroke="rgba(71, 85, 105, 0.6)" strokeWidth="1.5" />
                {/* Oceania / Australia */}
                <path d="M 600,260 Q 720,250 730,340 Q 650,400 590,340 Z" fill="rgba(30, 41, 59, 0.85)" stroke="rgba(71, 85, 105, 0.6)" strokeWidth="1.5" />
                {/* Antarctica */}
                <path d="M 100,430 Q 400,420 700,430 Q 760,445 40,445 Z" fill="rgba(30, 41, 59, 0.85)" stroke="rgba(71, 85, 105, 0.6)" strokeWidth="1.5" />

                {/* Hotspot Pins for Global Biomes */}
                {GLOBAL_BIOMES
                  .filter(b => selectedContinentFilter === "Todos" || b.continent === selectedContinentFilter)
                  .map(biome => {
                    const px = (biome.mapPositionRatio.xRatio / 100) * 800;
                    const py = (biome.mapPositionRatio.yRatio / 100) * 450;
                    const isSelected = selectedGlobalBiomeId === biome.id;
                    const isHovered = hoveredBiomeId === biome.id;

                    return (
                      <g
                        key={biome.id}
                        onClick={() => setSelectedGlobalBiomeId(biome.id)}
                        onMouseEnter={() => setHoveredBiomeId(biome.id)}
                        onMouseLeave={() => setHoveredBiomeId(null)}
                        className="cursor-pointer transition-all duration-300"
                      >
                        {/* Pulsing Outer Halo for Selected Biome */}
                        {isSelected && (
                          <circle cx={px} cy={py} r="20" fill="rgba(16, 185, 129, 0.25)" className="animate-ping" />
                        )}
                        <circle
                          cx={px}
                          cy={py}
                          r={isSelected ? "13" : "9"}
                          fill={isSelected ? "#10b981" : (isHovered ? "#38bdf8" : "#0284c7")}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? "3" : "2"}
                          className="transition-all"
                        />
                        <text
                          x={px}
                          y={py + 3}
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize={isSelected ? "11" : "8"}
                          fontWeight="bold"
                        >
                          {biome.countryFlag}
                        </text>

                        {/* Label Badge on Selection or Hover */}
                        {(isSelected || isHovered) && (
                          <g transform={`translate(${px}, ${py - 22})`}>
                            <rect
                              x="-65"
                              y="-14"
                              width="130"
                              height="22"
                              rx="6"
                              fill="rgba(15, 23, 42, 0.95)"
                              stroke={isSelected ? "#10b981" : "#38bdf8"}
                              strokeWidth="1.5"
                            />
                            <text x="0" y="-1" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                              {biome.name.split("&")[0]}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
              </svg>

              {/* World Map Overlay Legend Bar */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl flex flex-wrap items-center justify-between text-xs text-white gap-2">
                <div className="flex items-center space-x-3">
                  <span className="font-extrabold text-emerald-400 font-mono uppercase text-[10px] tracking-wider">
                    Legenda de Ícones:
                  </span>
                  <div className="flex items-center space-x-1.5 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Bioma Selecionado</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px]">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block"></span>
                    <span>Ponto Ativo de Monitoramento</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                  Constelação Copernicus Sentinel • Resolução 10m Multispectral
                </div>
              </div>
            </div>

            {/* Inspector Panel for Selected World Biome */}
            {selectedGlobalBiome && (
              <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-2xl text-white space-y-5 shadow-lg">
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{selectedGlobalBiome.countryFlag}</span>
                      <span className="text-xs font-mono font-extrabold uppercase text-emerald-400 tracking-wider">
                        {selectedGlobalBiome.continent}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold font-mono uppercase border ${
                        selectedGlobalBiome.riskLevel === "Crítico"
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          : selectedGlobalBiome.riskLevel === "Alto"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      }`}>
                        Risco: {selectedGlobalBiome.riskLevel}
                      </span>
                    </div>

                    <h3 className="text-xl font-extrabold tracking-tight">
                      {selectedGlobalBiome.name}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {selectedGlobalBiome.biomeType} • Lat {selectedGlobalBiome.coords.lat}, Lng {selectedGlobalBiome.coords.lng}
                    </p>
                  </div>

                  {/* Primary Action Button to Start Sentinel Monitoring */}
                  <button
                    type="button"
                    onClick={() => handleActivateBiomeMonitoring(selectedGlobalBiome)}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2 cursor-pointer ring-2 ring-emerald-500/40"
                  >
                    <Crosshair className="h-4 w-4" />
                    <span>Monitorar este Bioma com Satélite Sentinel</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Key Biome Indicators Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                      NDVI Linha de Base
                    </span>
                    <div className="text-lg font-mono font-extrabold text-emerald-400">
                      {selectedGlobalBiome.baselineNdvi}
                    </div>
                    <span className="text-[10px] text-slate-400">Índice Vegetal do Dossel</span>
                  </div>

                  <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                      NDWI Hídrico Esperado
                    </span>
                    <div className="text-lg font-mono font-extrabold text-cyan-400">
                      {selectedGlobalBiome.expectedNdwi}
                    </div>
                    <span className="text-[10px] text-slate-400">Teor de Água em Folhas</span>
                  </div>

                  <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                      Radar SAR Sentinel-1
                    </span>
                    <div className="text-sm font-mono font-extrabold text-purple-400 mt-1">
                      {selectedGlobalBiome.sarBackscatter}
                    </div>
                    <span className="text-[10px] text-slate-400">Retroespalhamento C-band</span>
                  </div>

                  <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">
                      Região Homologada
                    </span>
                    <div className="text-sm font-mono font-extrabold text-amber-400 mt-1">
                      {selectedGlobalBiome.associatedRegionKey} (Brasil/Global)
                    </div>
                    <span className="text-[10px] text-slate-400">Macrorregião no GIS</span>
                  </div>
                </div>

                {/* Additional Biome Characteristics & Regulatory Bodies */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2">
                    <span className="font-extrabold uppercase text-slate-400 tracking-wider text-[10px] flex items-center space-x-1">
                      <Flame className="h-3.5 w-3.5 text-amber-500" />
                      <span>Fatores de Estresse & Ameaças Ambientais</span>
                    </span>
                    <p className="text-slate-200 leading-relaxed">
                      {selectedGlobalBiome.riskDescription}
                    </p>
                    <div className="text-[11px] text-slate-400">
                      <strong>Estrutura de Vegetação:</strong> {selectedGlobalBiome.vegetationCover}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2">
                    <span className="font-extrabold uppercase text-slate-400 tracking-wider text-[10px] flex items-center space-x-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Órgãos de Fiscalização & Acordos Internacionais</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedGlobalBiome.agencies.map((agency) => (
                        <span
                          key={agency}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold bg-slate-800 text-slate-200 border border-slate-700"
                        >
                          {agency}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Quick World Biomes Grid Cards */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
              <Globe className="h-4 w-4 text-emerald-500" />
              <span>Biomas Globais Mapeados no Sistema ({GLOBAL_BIOMES.length})</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {GLOBAL_BIOMES.map((b) => {
                const isSelected = selectedGlobalBiomeId === b.id;
                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedGlobalBiomeId(b.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{b.countryFlag}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">{b.continent}</span>
                    </div>

                    <div>
                      <h5 className="text-xs font-extrabold text-slate-900 dark:text-white">
                        {b.name}
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {b.biomeType}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-mono">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">NDVI {b.baselineNdvi}</span>
                      <span className={`px-1.5 py-0.5 rounded font-extrabold ${
                        b.riskLevel === "Crítico" ? "bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-300" : "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                      }`}>
                        {b.riskLevel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Selected Region & Satellite Info Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 text-white shadow-md">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Satellite className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-cyan-400 uppercase tracking-wider font-mono">
                {currentRegionData.label} • {currentRegionData.biome}
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Orbita Ativa
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">{currentRegionData.tagline}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Última Passagem de Satélite:</div>
            <div className="text-emerald-400 font-mono font-bold">{activeScene ? new Date(activeScene.acquisitionDate).toLocaleDateString("pt-BR") : "28/07/2026"}</div>
          </div>
          <button
            type="button"
            onClick={() => fetchSentinelData(selectedRegion)}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Sincronizar Copernicus</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Interactive Map Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4" ref={containerRef}>
          
          {/* Controls Bar for Satellite Bands & Layers */}
          <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Layers className="h-3.5 w-3.5 text-cyan-500" />
                <span>Índice Espectral:</span>
              </span>

              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setMapLayer("NDVI")}
                  className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase transition-all ${mapLayer === "NDVI" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                  title="Índice de Vegetação (NIR / Red)"
                >
                  🌿 NDVI (Dossel)
                </button>
                <button
                  onClick={() => setMapLayer("NDWI")}
                  className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase transition-all ${mapLayer === "NDWI" ? "bg-cyan-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                  title="Índice de Água (Green / NIR)"
                >
                  💧 NDWI (Hídrico)
                </button>
                <button
                  onClick={() => setMapLayer("SAR_Radar")}
                  className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase transition-all ${mapLayer === "SAR_Radar" ? "bg-purple-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                  title="Radar de Abertura Sintética Sentinel-1"
                >
                  📡 Radar SAR
                </button>
                <button
                  onClick={() => setMapLayer("Satellite")}
                  className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase transition-all ${mapLayer === "Satellite" ? "bg-slate-900 dark:bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                >
                  📷 Cor Real (RGB)
                </button>
                <button
                  onClick={() => setMapLayer("Vector")}
                  className={`text-[10px] font-extrabold px-3 py-1.5 rounded-lg uppercase transition-all ${mapLayer === "Vector" ? "bg-slate-900 dark:bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                >
                  🗺️ Vetor GIS
                </button>
              </div>
            </div>

            {/* Drone flight & NDVI Degradation Overlay toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowNdviDegradationOverlay(!showNdviDegradationOverlay)}
                className={`text-[11px] font-extrabold px-3 py-2 rounded-xl border flex items-center space-x-1.5 transition-all cursor-pointer ${
                  showNdviDegradationOverlay
                    ? "bg-rose-600 border-rose-500 text-white shadow-md ring-2 ring-rose-500/20"
                    : "bg-slate-50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                }`}
                title="Ativar/Desativar camada de sobreposição de degradação vegetacional histórica"
              >
                {showNdviDegradationOverlay ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Overlay ΔNDVI {showNdviDegradationOverlay ? "Ativo" : "Inativo"}</span>
                {degradationData && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] bg-rose-950/60 text-rose-200 font-mono">
                    {degradationData.totalDegradedAreaHectares} ha
                  </span>
                )}
              </button>

              <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 px-1 flex items-center">
                  <History className="h-3 w-3 mr-1 text-slate-400" />
                  Base:
                </span>
                {(["6m", "12m", "24m"] as const).map((ts) => (
                  <button
                    key={ts}
                    onClick={() => setTimeSpan(ts)}
                    className={`text-[10px] font-extrabold px-2 py-1 rounded-lg uppercase transition-all ${
                      timeSpan === ts
                        ? "bg-slate-900 dark:bg-slate-700 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    {ts === "6m" && "6M"}
                    {ts === "12m" && "1 Ano"}
                    {ts === "24m" && "2 Anos"}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setDroneFlying(!droneFlying)}
                className={`text-[11px] font-bold px-3 py-2 rounded-xl border flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  droneFlying 
                    ? "bg-blue-600 border-blue-600 text-white animate-pulse" 
                    : "bg-slate-50 dark:bg-slate-950/20 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                }`}
              >
                <Compass className="h-3.5 w-3.5" />
                <span>{droneFlying ? "Desligar Drone" : "Voo de Drone"}</span>
              </button>

              <button
                onClick={() => {
                  setInspectPoint(null);
                  setGisFeatures(gisFeatures.slice(0, 2));
                  setGeojsonUploaded(false);
                }}
                className="text-[11px] font-bold p-2 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-50"
                title="Resetar Marcadores"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* City Search & Geocoding Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-2xl shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Busca de Cidades & Localidades no Brasil</span>
                    <span className="px-1.5 py-0.5 text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md font-mono">
                      Geocodificação em Tempo Real
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Localização atual: <strong className="text-emerald-400 font-mono">{customCityTarget?.name || `Macrorregião ${selectedRegion}`}</strong>
                  </p>
                </div>
              </div>

              {/* Search Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchCity();
                }}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <div className="relative flex-1 sm:w-72">
                  <input
                    type="text"
                    value={citySearchQuery}
                    onChange={(e) => setCitySearchQuery(e.target.value)}
                    placeholder="Digite a cidade (ex: Blumenau, SC)..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-xs rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                  />
                  <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingCity}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer whitespace-nowrap"
                >
                  {isSearchingCity ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <Search className="h-3.5 w-3.5" />
                  )}
                  <span>{isSearchingCity ? "Buscando..." : "Buscar Cidade"}</span>
                </button>
              </form>
            </div>

            {/* Error Message if geocoding fails */}
            {citySearchError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs px-3 py-2 rounded-xl flex items-center justify-between">
                <span>{citySearchError}</span>
                <button
                  type="button"
                  onClick={() => setCitySearchError(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Quick City Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <span className="text-[10px] font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
                <Building2 className="h-3 w-3 text-cyan-400" />
                <span>Atalhos Rápidos:</span>
              </span>
              {PRESET_CITIES.map((city) => (
                <button
                  key={city.label}
                  type="button"
                  onClick={() => handleSearchCity(city.query, city.region, { lat: city.lat, lng: city.lng })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    customCityTarget?.name.includes(city.query.split(",")[0])
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {city.label}
                </button>
              ))}
            </div>
          </div>

          {/* Real Leaflet Interactive Satellite & Topographic Map Container */}
          <div className="relative border border-slate-200 dark:border-slate-800 bg-slate-950 rounded-2xl overflow-hidden shadow-md h-[440px]">
            <RealLeafletMap
              region={selectedRegion}
              baseLat={customCityTarget ? customCityTarget.lat : currentRegionData.baseLat}
              baseLng={customCityTarget ? customCityTarget.lng : currentRegionData.baseLng}
              mapLayer={mapLayer}
              onPointInspect={handleLeafletPointInspect}
              inspectPoint={spectralAnalysis ? { lat: spectralAnalysis.coordinates.lat, lng: spectralAnalysis.coordinates.lng, ndvi: spectralAnalysis.indices?.NDVI?.value } : null}
              showNdviDegradationOverlay={showNdviDegradationOverlay}
            />
          </div>

          {/* Google Maps Static Satellite Imagery Snapshot Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
                  <Satellite className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Imagens de Satélite Reais de Alta Resolução</span>
                    <span className="px-2 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md font-mono font-bold">
                      Google Maps Platform API
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Captura georreferenciada em tempo real com escala submétrica ({staticSnapshotInfo?.groundSamplingDistanceMeters || 1.18}m por pixel)
                  </p>
                </div>
              </div>

              {/* Satellite Type Selector & Zoom Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setStaticMapType("satellite")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      staticMapType === "satellite"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Satélite
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaticMapType("hybrid")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      staticMapType === "hybrid"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Híbrido
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaticMapType("terrain")}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      staticMapType === "terrain"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Terreno
                  </button>
                </div>

                {/* Zoom Level Pills */}
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  {[12, 14, 16, 18].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setStaticMapZoom(z)}
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-md transition-all cursor-pointer ${
                        staticMapZoom === z
                          ? "bg-cyan-600 text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {z}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Static Image Box & Geographic Telemetry */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
              {/* Satellite Image Display */}
              <div className="lg:col-span-2 relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 group min-h-[260px] flex items-center justify-center">
                {isLoadingStaticSnapshot ? (
                  <div className="flex flex-col items-center justify-center space-y-2 py-12 text-slate-400">
                    <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                    <span className="text-xs font-mono">Carregando imagem georreferenciada Google Maps...</span>
                  </div>
                ) : (
                  <>
                    <img
                      src={staticSnapshotInfo?.staticMapUrl || `https://maps.googleapis.com/maps/api/staticmap?center=${customCityTarget?.lat || -26.9194},${customCityTarget?.lng || -49.0661}&zoom=${staticMapZoom}&size=640x400&maptype=${staticMapType}&scale=2`}
                      alt={`Google Maps Satellite Image ${customCityTarget?.name}`}
                      className="w-full h-auto max-h-[320px] object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        // Direct high-res satellite tile fallback
                        e.currentTarget.src = `https://mt1.google.com/vt/lyrs=${staticMapType === 'hybrid' ? 'y' : staticMapType === 'terrain' ? 'p' : 's'}&x=11140&y=15100&z=${staticMapZoom}`;
                      }}
                    />
                    
                    {/* Overlay Geographic Grid Badge */}
                    <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-[10px] font-mono text-emerald-400 flex items-center space-x-2 shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>Coordenadas: {(customCityTarget ? customCityTarget.lat : -26.9194).toFixed(4)}°, {(customCityTarget ? customCityTarget.lng : -49.0661).toFixed(4)}°</span>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-slate-900/85 backdrop-blur-md border border-slate-800 px-3 py-1 rounded-xl text-[9px] font-mono text-slate-300 shadow-lg">
                      ©2026 Google / Maxar Technologies / CNES Airbus
                    </div>
                  </>
                )}
              </div>

              {/* Georeferenced Metadata & Scale Telemetry */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Telemetria do Mosaico de Satélite</span>
                </h5>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
                    <span className="text-slate-400">Provedor:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Google Maps Platform</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
                    <span className="text-slate-400">Resolução Amostral (GSD):</span>
                    <span className="font-bold text-emerald-400">{staticSnapshotInfo?.groundSamplingDistanceMeters || 1.18} m/pixel</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
                    <span className="text-slate-400">Nível de Zoom Digital:</span>
                    <span className="font-bold text-cyan-400">{staticMapZoom}x</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800/80 pb-1.5">
                    <span className="text-slate-400">Camada Espectral:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{staticMapType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Chave Google Secrets:</span>
                    <span className={`font-bold ${staticSnapshotInfo?.hasApiKey ? "text-emerald-400" : "text-emerald-400"}`}>
                      {staticSnapshotInfo?.hasApiKey ? "Ativa (Google Secrets)" : "Integração Direct Sat Tiles"}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href={staticSnapshotInfo?.staticMapUrl || `https://mt1.google.com/vt/lyrs=s&x=11140&y=15100&z=${staticMapZoom}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    <span>Abrir Mosaico em Alta Resolução</span>
                    <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>
          </div>


          {/* Copernicus Satellite Scene List Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center space-x-1.5">
                <Globe className="h-4 w-4 text-cyan-500" />
                <span>Cenas Disponíveis da Constelação Copernicus</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">Resolução Espacial: 10m/px</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sentinelScenes.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => setActiveScene(sc)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    activeScene?.id === sc.id
                      ? "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-500 text-slate-900 dark:text-white ring-2 ring-cyan-500/20"
                      : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">{sc.satellite}</span>
                    <span className="text-[9px] font-mono text-slate-400">Nuvem: {sc.cloudCover}%</span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 truncate mt-1">{sc.id}</p>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 flex items-center justify-between font-semibold">
                    <span>{new Date(sc.acquisitionDate).toLocaleDateString("pt-BR")}</span>
                    {sc.spectralIndices?.meanNdvi && (
                      <span className="text-emerald-500">NDVI {sc.spectralIndices.meanNdvi}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Historical NDVI Degradation Overlay Analysis Panel */}
          <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
                  <TrendingDown className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
                    <span>Análise de Degradação Vegetal Histórica (Overlay ΔNDVI)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-rose-500/10 text-rose-500 border border-rose-500/30 uppercase">
                      Sentinel-2 Delta
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Comparação temporal de índice de vegetação por refletância de infravermelho próximo (B08 NIR vs B04 Red).
                  </p>
                </div>
              </div>

              {degradationData && (
                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-slate-400">Período:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    {degradationData.baselineDate} <ArrowRight className="inline h-3 w-3 text-rose-500 mx-1" /> {degradationData.currentDate}
                  </span>
                </div>
              )}
            </div>

            {/* KPI Summary Cards */}
            {degradationData ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400 tracking-wider">
                    Área Total Degradada
                  </span>
                  <div className="text-xl font-extrabold text-rose-600 dark:text-rose-300 font-mono mt-1">
                    {degradationData.totalDegradedAreaHectares} ha
                  </div>
                  <span className="text-[10px] text-slate-500">Superfície sob alerta de desfolha</span>
                </div>

                <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                    Queda Média de NDVI
                  </span>
                  <div className="text-xl font-extrabold text-amber-600 dark:text-amber-300 font-mono mt-1">
                    {degradationData.averageNdviDrop}%
                  </div>
                  <span className="text-[10px] text-slate-500">Perda de densidade fotossintética</span>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Zonas Críticas Mapeadas
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
                    {degradationData.zoneCount} Zonas
                  </div>
                  <span className="text-[10px] text-emerald-500 font-bold">Camada Ativa no Mapa GIS</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                Processando modelo de sobreposição delta de vegetação...
              </div>
            )}

            {/* Degraded Zones Comparison Detail Cards */}
            {degradationData?.zones && degradationData.zones.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-widest flex items-center space-x-1">
                    <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                    <span>Polígonos de Degradação para Vistoria em Campo</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Clique para destacar no mapa</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {degradationData.zones.map((zone) => {
                    const isSelected = selectedDegradationZone?.id === zone.id;
                    return (
                      <div
                        key={zone.id}
                        onClick={() => setSelectedDegradationZone(zone)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 ${
                          isSelected
                            ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-500 ring-2 ring-rose-500/20 shadow-md"
                            : "bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                zone.severity === "Crítica"
                                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              }`}>
                                {zone.severity}
                              </span>
                              <span className="text-xs font-mono font-bold text-slate-400">{zone.id}</span>
                            </div>
                            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white mt-1">
                              {zone.title}
                            </h4>
                          </div>

                          <div className="text-right font-mono">
                            <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                              {zone.dropPercentage}%
                            </span>
                            <div className="text-[10px] text-slate-400">{zone.areaHectares} ha</div>
                          </div>
                        </div>

                        {/* NDVI Comparison Progress Meter */}
                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-emerald-500 font-bold">NDVI Histórico: {zone.baselineNdvi}</span>
                            <span className="text-rose-500 font-bold">NDVI Atual: {zone.currentNdvi}</span>
                          </div>
                          
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full"
                              style={{ width: `${(zone.currentNdvi / zone.baselineNdvi) * 100}%` }}
                              title={`NDVI Retido (${((zone.currentNdvi / zone.baselineNdvi) * 100).toFixed(0)}%)`}
                            />
                            <div
                              className="bg-rose-500 h-full animate-pulse"
                              style={{ width: `${100 - (zone.currentNdvi / zone.baselineNdvi) * 100}%` }}
                              title="Perda de Vegetação"
                            />
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
                          <div><strong>Causa Suspeita:</strong> {zone.cause}</div>
                          <div className="text-rose-600 dark:text-rose-400 font-semibold">
                            <strong>Ação:</strong> {zone.recommendedAction}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Sentinel Spectral Inspector & Anomaly Alerts (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Spectral Point Analysis Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                  <Activity className="h-4 w-4 text-emerald-500" />
                  <span>Inspeção Espectral de Ponto</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Assinatura de refletância Sentinel-2</p>
              </div>
              {isLoadingSentinel && (
                <div className="animate-spin text-cyan-500">
                  <Radio className="h-4 w-4" />
                </div>
              )}
            </div>

            {spectralAnalysis ? (
              <div className="space-y-4">
                {/* Coordinates & Status */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>LAT: {spectralAnalysis.coordinates.lat}°</span>
                    <span>LNG: {spectralAnalysis.coordinates.lng}°</span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      spectralAnalysis.evaluation.riskLevel === "Baixo"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                    }`}>
                      {spectralAnalysis.evaluation.riskLevel} Risco
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {spectralAnalysis.evaluation.status}
                    </span>
                  </div>
                </div>

                {/* Spectral Indices Grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <div className="text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400">NDVI (Dossel)</div>
                    <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-300 mt-0.5 font-mono">
                      {spectralAnalysis.spectralIndices.NDVI.value}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <div className="text-[9px] font-bold uppercase text-cyan-600 dark:text-cyan-400">NDWI (Água)</div>
                    <div className="text-base font-extrabold text-cyan-600 dark:text-cyan-300 mt-0.5 font-mono">
                      {spectralAnalysis.spectralIndices.NDWI.value}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="text-[9px] font-bold uppercase text-purple-600 dark:text-purple-400">NDMI (Umidade)</div>
                    <div className="text-base font-extrabold text-purple-600 dark:text-purple-300 mt-0.5 font-mono">
                      {spectralAnalysis.spectralIndices.NDMI.value}
                    </div>
                  </div>
                </div>

                {/* Sentinel Bands Reflectance Bar Chart Visualizer */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Refletância por Banda Espectral (%):</span>
                  
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-mono">B02 (Azul 490nm):</span>
                      <span className="font-bold font-mono">{(spectralAnalysis.bands.B02_Blue * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${Math.min(spectralAnalysis.bands.B02_Blue * 200, 100)}%` }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-mono">B03 (Verde 560nm):</span>
                      <span className="font-bold font-mono">{(spectralAnalysis.bands.B03_Green * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(spectralAnalysis.bands.B03_Green * 200, 100)}%` }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-mono">B04 (Vermelho 665nm):</span>
                      <span className="font-bold font-mono">{(spectralAnalysis.bands.B04_Red * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: `${Math.min(spectralAnalysis.bands.B04_Red * 200, 100)}%` }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-mono">B08 (Infravermelho NIR 842nm):</span>
                      <span className="font-bold font-mono text-emerald-400">{(spectralAnalysis.bands.B08_NIR * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: `${Math.min(spectralAnalysis.bands.B08_NIR * 150, 100)}%` }} />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                  <strong>Recomendação IA NexaBot:</strong> {spectralAnalysis.evaluation.recommendation}
                </p>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Carregando dados espectrais do satélite Copernicus...
              </div>
            )}
          </div>

          {/* Satellite Deforestation & Canopy Anomaly Alerts */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center space-x-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Alertas de Supressão & Radar SAR</span>
              </h3>
              <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-extrabold">
                {sentinelAlerts.length} Registros
              </span>
            </div>

            <div className="space-y-3">
              {sentinelAlerts.map((alt) => (
                <div key={alt.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-amber-500 uppercase">{alt.alertType}</span>
                    <span className="text-[9px] font-mono text-slate-400">{new Date(alt.date).toLocaleDateString("pt-BR")}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{alt.locationName}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>Área: <strong>{alt.areaHectares} ha</strong></span>
                    <span className="text-red-500 font-bold font-mono">Variação NDVI: {alt.ndviDropPercent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dedicated Technical Metadata, Spatial Resolution & Revisit Side Panel */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                    <Satellite className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Metadados & Resolução Sentinel
                    </h3>
                    <p className="text-[10px] text-slate-400">Transparência técnica dos sensores geospaciais</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[9px] font-mono font-extrabold bg-cyan-500/10 text-cyan-500 border border-cyan-500/30">
                  ESA Copernicus
                </span>
              </div>

              {/* Sub-tabs for Technical Sensor Details */}
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 mt-3 text-[10px] font-extrabold">
                <button
                  type="button"
                  onClick={() => setSentinelMetaTab("MSI")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    sentinelMetaTab === "MSI"
                      ? "bg-slate-900 dark:bg-slate-700 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Sentinel-2 (MSI)
                </button>
                <button
                  type="button"
                  onClick={() => setSentinelMetaTab("SAR")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    sentinelMetaTab === "SAR"
                      ? "bg-slate-900 dark:bg-slate-700 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Sentinel-1 (SAR)
                </button>
                <button
                  type="button"
                  onClick={() => setSentinelMetaTab("ORBIT")}
                  className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer ${
                    sentinelMetaTab === "ORBIT"
                      ? "bg-slate-900 dark:bg-slate-700 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  Órbita & Cena
                </button>
              </div>
            </div>

            {/* Tab 1 Content: Sentinel-2 MSI (Optico Multispectral) */}
            {sentinelMetaTab === "MSI" && (
              <div className="space-y-3 text-xs">
                {/* Revisit Time & Resolution Highlights */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-0.5">
                    <span className="text-[9px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                      Tempo de Revisita
                    </span>
                    <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-300 font-mono">
                      5 Dias
                    </div>
                    <span className="text-[9px] text-slate-400">Constelação 2A + 2B</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 space-y-0.5">
                    <span className="text-[9px] font-extrabold uppercase text-cyan-600 dark:text-cyan-400">
                      Resolução Espacial
                    </span>
                    <div className="text-base font-extrabold text-cyan-600 dark:text-cyan-300 font-mono">
                      10m / pixel
                    </div>
                    <span className="text-[9px] text-slate-400">Bandas RGB & NIR</span>
                  </div>
                </div>

                {/* Detailed Spectral Resolution Bands Breakdown */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Resolução por Banda Espectral:
                  </span>

                  <div className="space-y-1.5 text-[11px] font-mono">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-emerald-500">10 metros:</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1">B02(Azul), B03(Verde), B04(Vermelho), B08(NIR)</span>
                      </div>
                      <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">Alta</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-amber-500">20 metros:</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1">B05/B06/B07 (Red Edge), B11/B12 (SWIR)</span>
                      </div>
                      <span className="text-[9px] font-extrabold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">Média</span>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-purple-500">60 metros:</span>
                        <span className="text-slate-500 dark:text-slate-400 ml-1">B01 (Aerosol), B09 (Vapor H2O), B10 (Cirrus)</span>
                      </div>
                      <span className="text-[9px] font-extrabold bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Atmosf.</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] space-y-1 text-slate-600 dark:text-slate-400">
                  <div><strong>Swath (Faixa de Varredura):</strong> 290 km de largura</div>
                  <div><strong>Resolução Radiométrica:</strong> 12 bits (4.096 níveis de cinza)</div>
                  <div><strong>Processamento:</strong> L2A Bottom-Of-Atmosphere (BOA) com Sen2Cor</div>
                </div>
              </div>
            )}

            {/* Tab 2 Content: Sentinel-1 SAR (Radar) */}
            {sentinelMetaTab === "SAR" && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-0.5">
                    <span className="text-[9px] font-extrabold uppercase text-purple-600 dark:text-purple-400">
                      Revisita SAR
                    </span>
                    <div className="text-base font-extrabold text-purple-600 dark:text-purple-300 font-mono">
                      6 - 12 Dias
                    </div>
                    <span className="text-[9px] text-slate-400">Radar Ativo C-Band</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-0.5">
                    <span className="text-[9px] font-extrabold uppercase text-purple-600 dark:text-purple-400">
                      Resolução Espacial
                    </span>
                    <div className="text-base font-extrabold text-purple-600 dark:text-purple-300 font-mono">
                      5m x 20m
                    </div>
                    <span className="text-[9px] text-slate-400">Modo IW (Interferometric)</span>
                  </div>
                </div>

                <div className="space-y-2 text-[11px]">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">Frequência Central:</span>
                      <span className="font-mono text-purple-400 font-bold">5.405 GHz (Banda C)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">Polarização Dual:</span>
                      <span className="font-mono text-cyan-400 font-bold">VV + VH e HH + HV</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">Ângulo de Incidência:</span>
                      <span className="font-mono text-slate-400">20° - 45°</span>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-300 space-y-1">
                    <span className="font-extrabold uppercase text-[10px] text-purple-400 flex items-center space-x-1">
                      <Zap className="h-3 w-3" />
                      <span>Vantagem do Sensor Radar:</span>
                    </span>
                    <p className="text-[10px] text-slate-300 leading-relaxed">
                      Capaz de penetrar cobertura densa de nuvens, névoa e operar em escuridão total, garantindo monitoramento ininterrupto de desmatamento ilegal.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3 Content: Órbita & Telemetria da Cena */}
            {sentinelMetaTab === "ORBIT" && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Sistema Datum:</span>
                    <span className="font-bold text-emerald-400">WGS 84 / UTM 24S</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Altitude Orbital:</span>
                    <span className="font-bold text-slate-200">786 km (Heliossíncrona)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Inclinação Orbital:</span>
                    <span className="font-bold text-slate-200">98.62°</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Tile Sentinel:</span>
                    <span className="font-bold text-cyan-400">T24MZA_20260728</span>
                  </div>
                </div>

                {/* Calculation Transparency Equations */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-white space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Fórmulas dos Índices Espectrais:
                  </span>
                  <div className="space-y-1 font-mono text-[10px]">
                    <div className="p-1.5 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                      <strong>NDVI</strong> = (B08_NIR - B04_Red) / (B08_NIR + B04_Red)
                    </div>
                    <div className="p-1.5 rounded bg-slate-950 text-cyan-400 border border-slate-800">
                      <strong>NDWI</strong> = (B03_Green - B08_NIR) / (B03_Green + B08_NIR)
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Import GeoJSON/Shapefile Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">Importar Camadas Vetoriais</h3>
            </div>
            <button
              onClick={handleUploadGeoJSON}
              disabled={geojsonUploaded}
              className={`w-full text-xs font-bold py-3 rounded-xl border flex items-center justify-center space-x-2 transition-colors cursor-pointer ${
                geojsonUploaded
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-slate-900 dark:bg-slate-800 text-white hover:bg-black border-slate-900"
              }`}
            >
              <Upload className="h-4 w-4" />
              <span>{geojsonUploaded ? "GeoJSON_09 Carregado!" : "Importar GeoJSON do IBAMA/CAR"}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}

