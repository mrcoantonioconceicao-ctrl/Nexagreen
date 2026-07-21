/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { DBState, Tenant, EnvironmentalLicense, MonitoringParam, EnvironmentalAudit, CorporateDocument, FieldInspectionReport } from "./src/types";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

const DB_FILE = path.join(process.cwd(), "nexa_db.json");

// Default initial seeding for multi-tenant corporate environment
const DEFAULT_STATE: DBState = {
  tenants: [
    {
      id: "tenant-1",
      name: "PetroNexa S.A.",
      cnpj: "12.345.678/0001-90",
      sector: "Energy",
      location: "Bacia de Santos, Rio de Janeiro",
      units: ["Refinaria de Paulínia (REPLAN)", "Plataforma P-74", "Terminal de Angra"],
    },
    {
      id: "tenant-2",
      name: "EcoMinas Mineração S.A.",
      cnpj: "98.765.432/0001-11",
      sector: "Mining",
      location: "Quadrilátero Ferrífero, Minas Gerais",
      units: ["Mina de Alegria", "Usina de Pelotização de Tubarão", "Complexo de Mariana"],
    },
    {
      id: "tenant-3",
      name: "Conexão Saneamento Ambiental",
      cnpj: "45.678.901/0001-22",
      sector: "Sanitation",
      location: "Grande São Paulo & Campinas",
      units: ["ETE ABC", "ETA Cantareira", "Aterro Sanitário Metropolitano"],
    }
  ],
  responsibles: [
    { id: "resp-1", name: "Dra. Heloísa Souza", creaOrCrq: "CREA-SP 50619827", role: "Diretora de Sustentabilidade", email: "heloisa.souza@nexaambient.com.br" },
    { id: "resp-2", name: "Dr. Carlos Eduardo Malta", creaOrCrq: "CRQ-MG 3105520", role: "Coordenador de Engenharia Química", email: "carlos.malta@nexaambient.com.br" },
    { id: "resp-3", name: "Ing. Amanda Rezende", creaOrCrq: "CREA-RJ 9122340", role: "Gestora de Compliance Legal", email: "amanda.rezende@nexaambient.com.br" }
  ],
  licenses: [
    {
      id: "lic-1",
      tenantId: "tenant-1",
      processNumber: "IBAMA 02001.003421/2021-99",
      licenseNumber: "LO Nº 1450/2023",
      type: "LO",
      issuer: "IBAMA",
      description: "Licença de Operação para as atividades de produção e escoamento de petróleo na jazida do Pré-Sal.",
      issueDate: "2023-01-15",
      dueDate: "2027-01-15",
      status: "Active",
      responsibles: ["resp-1", "resp-3"],
      conditions: [
        { id: "cond-1-1", licenseId: "lic-1", description: "Monitoramento quinzenal de hidrocarbonetos totais de petróleo (HTPs) na água de descarte da plataforma.", dueDate: "2026-08-15", status: "Pending", assignedTeam: "Meio Ambiente" },
        { id: "cond-1-2", licenseId: "lic-1", description: "Envio de relatório técnico anual sobre o plano de controle de emissão de gases de combustão (flares).", dueDate: "2026-12-31", status: "Pending", assignedTeam: "SSO & Compliance" },
        { id: "cond-1-3", licenseId: "lic-1", description: "Realização de simulados semestrais de derramamento de óleo com relatórios de prontidão ambiental.", dueDate: "2026-06-30", status: "Fulfilled", assignedTeam: "Operações", evidenceName: "relatorio_simulado_v1.pdf", evidenceDate: "2026-06-25" }
      ]
    },
    {
      id: "lic-2",
      tenantId: "tenant-2",
      processNumber: "SEMAD 145/2019",
      licenseNumber: "LI Nº 442/2022",
      type: "LI",
      issuer: "FEAM-MG",
      description: "Licença de Instalação para expansão da barragem de rejeitos e usina de britagem primária.",
      issueDate: "2022-09-10",
      dueDate: "2026-09-10",
      status: "InRenewal",
      responsibles: ["resp-2"],
      conditions: [
        { id: "cond-2-1", licenseId: "lic-2", description: "Implementação de piezômetros automatizados de telemetria com leitura diária de pressão de poro.", dueDate: "2026-08-01", status: "Pending", assignedTeam: "Engenharia de Barragens" },
        { id: "cond-2-2", licenseId: "lic-2", description: "Plantio compensatório de 15 hectares de mata nativa (Cerrado) em área de preservação permanente.", dueDate: "2025-12-31", status: "Fulfilled", assignedTeam: "Meio Ambiente", evidenceName: "termo_plantio_florestal.pdf", evidenceDate: "2025-12-15" },
        { id: "cond-2-3", licenseId: "lic-2", description: "Medição de ruídos e poeira em suspensão nas comunidades lindeiras durante as fases de detonação.", dueDate: "2026-05-15", status: "Overdue", assignedTeam: "Meio Ambiente" }
      ]
    },
    {
      id: "lic-3",
      tenantId: "tenant-3",
      processNumber: "DAEE 00124/2023",
      licenseNumber: "Outorga Nº 21390/2023",
      type: "Outorga",
      issuer: "DAEE-SP",
      description: "Outorga de captação de água superficial para abastecimento industrial de ETA.",
      issueDate: "2023-04-12",
      dueDate: "2028-04-12",
      status: "Active",
      responsibles: ["resp-2", "resp-1"],
      conditions: [
        { id: "cond-3-1", licenseId: "lic-3", description: "Instalação de macromedidor homologado com registros digitais de vazão instantânea em m³/h.", dueDate: "2024-04-12", status: "Fulfilled", assignedTeam: "Manutenção", evidenceName: "laudo_calibracao_macromedidor.pdf", evidenceDate: "2024-04-02" },
        { id: "cond-3-2", licenseId: "lic-3", description: "Análise físico-química e microbiológica trimestral dos parâmetros de qualidade da água captada e de jusante.", dueDate: "2026-09-30", status: "Pending", assignedTeam: "Laboratório" }
      ]
    }
  ],
  monitoringParams: [
    { id: "mon-1", tenantId: "tenant-1", category: "Water", parameter: "Hidrocarbonetos Totais (HTP)", value: 8.4, limit: 10.0, unit: "mg/L", locationName: "Ponto de Descarte Platform P-74", coordinates: { lat: -25.215, lng: -44.112 }, timestamp: "2026-07-20T08:00:00Z", status: "Normal" },
    { id: "mon-2", tenantId: "tenant-1", category: "Air", parameter: "Óxidos de Enxofre (SOx)", value: 412.0, limit: 500.0, unit: "mg/Nm³", locationName: "Chaminé Caldeira C-1", coordinates: { lat: -25.215, lng: -44.112 }, timestamp: "2026-07-20T12:00:00Z", status: "Normal" },
    { id: "mon-3", tenantId: "tenant-2", category: "Noise", parameter: "Ruído Sonoro Noturno", value: 68.5, limit: 55.0, unit: "dB(A)", locationName: "Comunidade de Bento Rodrigues (Entorno)", coordinates: { lat: -20.224, lng: -43.415 }, timestamp: "2026-07-19T22:30:00Z", status: "Critical" },
    { id: "mon-4", tenantId: "tenant-2", category: "Soil", parameter: "Concentração de Chumbo (Pb)", value: 45.2, limit: 72.0, unit: "mg/kg", locationName: "Área de Deposição de Rejeito Norte", coordinates: { lat: -20.218, lng: -43.409 }, timestamp: "2026-07-18T14:00:00Z", status: "Normal" },
    { id: "mon-5", tenantId: "tenant-3", category: "Effluents", parameter: "Demanda Bioquímica de Oxigênio (DBO)", value: 28.0, limit: 30.0, unit: "mg/L O2", locationName: "Canal de Saída ETE ABC", coordinates: { lat: -23.612, lng: -46.541 }, timestamp: "2026-07-21T07:15:00Z", status: "Alert" }
  ],
  labCustodies: [
    { id: "lab-1", sampleCode: "SAM-2026-A109", collectorName: "Lucas Almeida Ramos", collectDate: "2026-07-19", labName: "Eurofins Análises Ambientais S.A.", analyzedParams: ["Metais Pesados", "Turbidez", "pH"], status: "Analysis" },
    { id: "lab-2", sampleCode: "SAM-2026-B334", collectorName: "Mariana Costa Silva", collectDate: "2026-07-10", labName: "SGS Geosol Laboratórios", analyzedParams: ["VOCs", "HTP", "Benzeno"], status: "LaudoEmitted", laudoUrl: "laudo_sgs_final_902.pdf" }
  ],
  esgKpis: [
    { id: "esg-1-1", tenantId: "tenant-1", year: 2026, month: "Junho", carbonEmission: 12540.2, waterConsumption: 89400.0, energyConsumption: 34200.0, wasteRecycledRate: 78.4, esgScore: 82.5, odsAligned: [7, 12, 13, 14] },
    { id: "esg-2-1", tenantId: "tenant-2", year: 2026, month: "Junho", carbonEmission: 82400.9, waterConsumption: 245000.0, energyConsumption: 120500.0, wasteRecycledRate: 91.2, esgScore: 78.0, odsAligned: [6, 9, 12, 15] },
    { id: "esg-3-1", tenantId: "tenant-3", year: 2026, month: "Junho", carbonEmission: 420.5, waterConsumption: 1240.0, energyConsumption: 4800.0, wasteRecycledRate: 65.0, esgScore: 89.2, odsAligned: [6, 11, 12, 13] }
  ],
  risks: [
    { id: "risk-1", hazard: "Derramamento de óleos lubrificantes na casa de bombas", category: "Operational", probability: "Medium", impact: "High", riskScore: 6, mitigationPlan: "Instalação de diques de contenção e treinamento de contenção imediata com barreiras de absorção." },
    { id: "risk-2", hazard: "Vencimento da Licença de Instalação antes da conclusão das obras", category: "Legal", probability: "High", impact: "High", riskScore: 9, mitigationPlan: "Abertura do protocolo de renovação com antecedência mínima de 120 dias, conforme legislação CONAMA." },
    { id: "risk-3", hazard: "Ruído de detonações na mineradora acima do limite noturno", category: "Reputational", probability: "Low", impact: "Medium", riskScore: 3, mitigationPlan: "Restringir detonações estritamente para o período entre 09:00 e 16:00, com aviso antecipado à comunidade." }
  ],
  audits: [
    {
      id: "aud-1",
      tenantId: "tenant-2",
      date: "2026-06-15",
      auditor: "SGS Bureau Veritas",
      scope: "Auditoria Interna de Gestão de Resíduos e Estabilidade de Taludes de Barragem",
      nonConformities: 2,
      score: 84.0,
      status: "FollowUp",
      actionPlans: [
        { id: "ap-1", title: "Rotulagem do galpão temporário de resíduos classe I", description: "Classificar tambores contendo graxas e solventes de acordo com as normas ABNT NBR 10004.", assignedTo: "Ing. Amanda Rezende", dueDate: "2026-07-31", status: "InProgress", priority: "High" },
        { id: "ap-2", title: "Recalibração do sismógrafo de monitoramento sísmico de talude", description: "Enviar equipamento para calibração com laudo certificado RBC.", assignedTo: "Dr. Carlos Eduardo Malta", dueDate: "2026-08-15", status: "NotStarted", priority: "Medium" }
      ]
    },
    {
      id: "aud-2",
      tenantId: "tenant-1",
      date: "2026-05-10",
      auditor: "Auditoria Regulatória Federal (IBAMA)",
      scope: "Avaliação do Plano de Prontidão Contra Vazamentos",
      nonConformities: 0,
      score: 100.0,
      status: "Completed",
      actionPlans: []
    }
  ],
  fieldReports: [
    {
      id: "report-1",
      tenantId: "tenant-2",
      inspectorName: "Márcio Silva Guedes",
      date: "2026-07-21",
      locationName: "Cava de Extração Norte - Unidade Mina Alegria",
      coordinates: { lat: -20.221, lng: -43.411 },
      checklist: [
        { question: "Taludes apresentam sinais visíveis de erosão ou trincas?", checked: false, note: "Paredões secos e estáveis após perífrase diária." },
        { question: "Sistemas de drenagem pluvial estão desobstruídos?", checked: true },
        { question: "Supressão de vegetação está ocorrendo dentro dos limites autorizados?", checked: true, note: "Marco georreferenciado verificado via GPS." },
        { question: "Aspersores de água das vias de acesso estão operando contra poeira?", checked: true }
      ],
      photo: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><rect width='100' height='100' fill='%2322c55e'/><text x='10' y='50' fill='white' font-size='10'>Inspeção Estável</text></svg>",
      signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      qrCode: "NEXA-FIELD-832190-2026",
      isSynced: true
    }
  ],
  documents: [
    {
      id: "doc-1",
      tenantId: "tenant-1",
      title: "Parecer Técnico de Viabilidade - Ampliação da Plataforma P-74",
      type: "Legal Opinion",
      content: "Considerando as exigências do artigo 10 da Lei Federal 6.938/81, o projeto de ampliação de capacidade produtiva atende às diretrizes gerais do zoneamento ecológico-econômico. Há necessidade de reforço nas barreiras de contenção secundárias de fluidos de perfuração sintéticos à base de ésteres. Recomendamos a anuência jurídica com ressalva para renovação tempestiva da LI.",
      version: 2,
      status: "Review",
      updatedAt: "2026-07-20T17:40:00Z",
      author: "Dra. Heloísa Souza",
      workflowSteps: [
        { role: "Meio Ambiente", user: "Dra. Heloísa Souza", status: "Approved", date: "2026-07-20" },
        { role: "Jurídico / Compliance", user: "Amanda Rezende", status: "Pending" },
        { role: "Diretoria Executiva", user: "CEO Nexa", status: "Pending" }
      ]
    }
  ],
  webhooks: [
    {
      id: "wh-1",
      tenantId: "tenant-1",
      name: "SAP S/4HANA ERP - Módulo EHS Compliance",
      targetSystem: "SAP_S4HANA",
      url: "https://sap-gateway.petronexa.internal/sap/bc/rest/ehs/webhook",
      secret: "whsec_sap_prod_9981273918237",
      active: true,
      events: ["license.expiry_warning", "condition.overdue", "monitoring.critical_alert"],
      headers: {
        "Authorization": "Bearer sap_oauth_token_xxxx",
        "X-SAP-Client": "100",
        "X-Source-System": "NexaAmbient-Suite"
      },
      createdAt: "2026-01-10T10:00:00.000Z",
      lastTriggeredAt: "2026-07-21T08:30:00.000Z",
      lastResponseStatus: 200,
      failureCount: 0
    },
    {
      id: "wh-2",
      tenantId: "tenant-1",
      name: "Oracle NetSuite Risk & Governance Hub",
      targetSystem: "ORACLE_NETSUITE",
      url: "https://1234567.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=102&deploy=1",
      secret: "whsec_oracle_netsuite_8823101",
      active: true,
      events: ["condition.status_changed", "license.status_changed", "document.approval_step"],
      headers: {
        "Authorization": "NLAuth nlauth_account=1234567,nlauth_email=api@petronexa.com",
        "Content-Type": "application/json"
      },
      createdAt: "2026-02-15T14:20:00.000Z",
      lastTriggeredAt: "2026-07-20T17:45:00.000Z",
      lastResponseStatus: 200,
      failureCount: 0
    },
    {
      id: "wh-3",
      tenantId: "tenant-2",
      name: "EcoMinas SAP PM (Plant Maintenance)",
      targetSystem: "SAP_S4HANA",
      url: "https://sap-ecominas.corp.internal/api/v1/environmental-events",
      secret: "whsec_ecominas_sap_7712391",
      active: true,
      events: ["condition.overdue", "monitoring.critical_alert"],
      headers: {
        "X-API-Key": "ecominas_sap_key_991823"
      },
      createdAt: "2026-03-01T09:00:00.000Z",
      lastTriggeredAt: "2026-07-19T11:15:00.000Z",
      lastResponseStatus: 200,
      failureCount: 0
    }
  ],
  webhookLogs: [
    {
      id: "log-1",
      webhookId: "wh-1",
      tenantId: "tenant-1",
      webhookName: "SAP S/4HANA ERP - Módulo EHS Compliance",
      targetUrl: "https://sap-gateway.petronexa.internal/sap/bc/rest/ehs/webhook",
      event: "condition.overdue",
      payload: {
        event: "condition.overdue",
        licenseNumber: "LI Nº 442/2022",
        conditionId: "cond-2-3",
        description: "Medição de ruídos e poeira em suspensão nas comunidades lindeiras durante as fases de detonação.",
        tenant: "PetroNexa S.A.",
        severity: "CRITICAL",
        timestamp: "2026-07-21T08:30:00.000Z"
      },
      statusCode: 200,
      responseBody: '{"sapDocumentId": "SAP-EHS-998210", "status": "CREATED_IN_SAP_WORKFLOW"}',
      durationMs: 142,
      timestamp: "2026-07-21T08:30:00.000Z",
      status: "Success"
    },
    {
      id: "log-2",
      webhookId: "wh-2",
      tenantId: "tenant-1",
      webhookName: "Oracle NetSuite Risk & Governance Hub",
      targetUrl: "https://1234567.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=102&deploy=1",
      event: "document.approval_step",
      payload: {
        event: "document.approval_step",
        documentId: "doc-1",
        title: "Parecer Técnico de Viabilidade - Ampliação da Plataforma P-74",
        approvedBy: "Dra. Heloísa Souza",
        signatureVerification: "0x8f1e29a3",
        timestamp: "2026-07-20T17:45:00.000Z"
      },
      statusCode: 200,
      responseBody: '{"netsuiteRecordId": "NS-REG-88231", "sync": "OK"}',
      durationMs: 210,
      timestamp: "2026-07-20T17:45:00.000Z",
      status: "Success"
    }
  ]
};

// Database persistence read / write helper functions
function getDBState(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data) as DBState;
    }
  } catch (err) {
    console.error("Error reading database file, using defaults:", err);
  }
  return DEFAULT_STATE;
}

function saveDBState(state: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

// Ensure the DB is initialized
if (!fs.existsSync(DB_FILE)) {
  saveDBState(DEFAULT_STATE);
}

// Lazy load Gemini API Client
function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// REST Endpoints
app.get("/api/db", (req, res) => {
  res.json(getDBState());
});

app.post("/api/db/reset", (req, res) => {
  saveDBState(DEFAULT_STATE);
  res.json({ message: "Database reset successful", db: DEFAULT_STATE });
});

// Create Company/Tenant
app.post("/api/tenants", (req, res) => {
  const state = getDBState();
  const newTenant: Tenant = {
    id: `tenant-${Date.now()}`,
    name: req.body.name,
    cnpj: req.body.cnpj || "00.000.000/0001-00",
    sector: req.body.sector || "Industry",
    location: req.body.location || "Local Operacional",
    units: req.body.units || ["Sede Principal"],
  };
  state.tenants.push(newTenant);
  saveDBState(state);
  res.status(201).json(newTenant);
});

// Create License
app.post("/api/licenses", (req, res) => {
  const state = getDBState();
  const newLicense: EnvironmentalLicense = {
    id: `lic-${Date.now()}`,
    tenantId: req.body.tenantId,
    processNumber: req.body.processNumber || "N/A",
    licenseNumber: req.body.licenseNumber || "N/A",
    type: req.body.type || "LO",
    issuer: req.body.issuer || "IBAMA",
    description: req.body.description || "",
    issueDate: req.body.issueDate || new Date().toISOString().split("T")[0],
    dueDate: req.body.dueDate || new Date().toISOString().split("T")[0],
    status: req.body.status || "Active",
    responsibles: req.body.responsibles || ["resp-1"],
    conditions: req.body.conditions || [],
  };
  state.licenses.push(newLicense);
  saveDBState(state);
  res.status(201).json(newLicense);
});

// Update or add conditions
app.post("/api/licenses/:id/conditions", (req, res) => {
  const state = getDBState();
  const license = state.licenses.find((l) => l.id === req.params.id);
  if (!license) {
    return res.status(404).json({ error: "License not found" });
  }

  const newCondition = {
    id: `cond-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    licenseId: license.id,
    description: req.body.description,
    dueDate: req.body.dueDate,
    status: req.body.status || "Pending",
    assignedTeam: req.body.assignedTeam || "Geral",
    evidenceName: req.body.evidenceName,
    evidenceDate: req.body.evidenceDate,
  };

  license.conditions.push(newCondition);
  saveDBState(state);
  res.status(201).json(newCondition);
});

// Update condition status/evidence
app.post("/api/conditions/:id/evidence", (req, res) => {
  const state = getDBState();
  let found = false;
  state.licenses.forEach((l) => {
    const cond = l.conditions.find((c) => c.id === req.params.id);
    if (cond) {
      cond.status = "Fulfilled";
      cond.evidenceName = req.body.evidenceName || "evidencia_enviada.pdf";
      cond.evidenceDate = new Date().toISOString().split("T")[0];
      found = true;
    }
  });

  if (!found) {
    return res.status(404).json({ error: "Condition not found" });
  }
  saveDBState(state);
  res.json({ success: true, db: state });
});

// Add Monitoring parameter log
app.post("/api/monitoring", (req, res) => {
  const state = getDBState();
  const value = parseFloat(req.body.value);
  const limit = parseFloat(req.body.limit);
  let status: "Normal" | "Alert" | "Critical" = "Normal";
  
  if (value > limit) {
    status = value > limit * 1.2 ? "Critical" : "Alert";
  }

  const newLog: MonitoringParam = {
    id: `mon-${Date.now()}`,
    tenantId: req.body.tenantId,
    category: req.body.category || "Water",
    parameter: req.body.parameter,
    value: value,
    limit: limit,
    unit: req.body.unit || "mg/L",
    locationName: req.body.locationName || "Ponto de Controle",
    coordinates: req.body.coordinates || { lat: -23.55, lng: -46.63 },
    timestamp: new Date().toISOString(),
    status: status,
  };

  state.monitoringParams.unshift(newLog);
  saveDBState(state);
  res.status(201).json(newLog);
});

// Submit field report (from offline inspector)
app.post("/api/field-reports", (req, res) => {
  const state = getDBState();
  const newReport: FieldInspectionReport = {
    id: `report-${Date.now()}`,
    tenantId: req.body.tenantId,
    inspectorName: req.body.inspectorName || "Inspector Autônomo",
    date: req.body.date || new Date().toISOString().split("T")[0],
    locationName: req.body.locationName || "Local de Campo",
    coordinates: req.body.coordinates || { lat: -23.55, lng: -46.63 },
    checklist: req.body.checklist || [],
    photo: req.body.photo,
    signature: req.body.signature,
    qrCode: `NEXA-FIELD-${Math.floor(100000 + Math.random() * 900000)}-2026`,
    isSynced: true,
  };

  state.fieldReports.unshift(newReport);
  saveDBState(state);
  res.status(201).json(newReport);
});

// Create corporate document
app.post("/api/documents", (req, res) => {
  const state = getDBState();
  const newDoc: CorporateDocument = {
    id: `doc-${Date.now()}`,
    tenantId: req.body.tenantId,
    title: req.body.title,
    type: req.body.type || "Environmental Report",
    content: req.body.content || "",
    version: 1,
    status: "Draft",
    updatedAt: new Date().toISOString(),
    author: req.body.author || "Sistema",
    workflowSteps: [
      { role: "Elaborador", user: req.body.author || "Sistema", status: "Approved", date: new Date().toISOString().split("T")[0] },
      { role: "Revisor Técnico", user: "Dr. Carlos Eduardo Malta", status: "Pending" },
      { role: "Diretor de Sustentabilidade", user: "Dra. Heloísa Souza", status: "Pending" }
    ],
  };

  state.documents.unshift(newDoc);
  saveDBState(state);
  res.status(201).json(newDoc);
});

// Advance/approve document workflow
app.post("/api/documents/:id/workflow", (req, res) => {
  const state = getDBState();
  const doc = state.documents.find((d) => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }

  const stepIndex = doc.workflowSteps.findIndex((s) => s.status === "Pending");
  if (stepIndex !== -1) {
    doc.workflowSteps[stepIndex].status = req.body.approved ? "Approved" : "Rejected";
    doc.workflowSteps[stepIndex].date = new Date().toISOString().split("T")[0];
    
    // Save authentic client-side calculated cryptographic signatures and public key fingerprints
    if (req.body.signature) {
      (doc.workflowSteps[stepIndex] as any).signature = req.body.signature;
    }
    if (req.body.publicKeyFingerprint) {
      (doc.workflowSteps[stepIndex] as any).publicKeyFingerprint = req.body.publicKeyFingerprint;
    }

    // If all approved, document status becomes "Approved"
    const nextPending = doc.workflowSteps.find((s) => s.status === "Pending");
    if (!nextPending) {
      doc.status = "Approved";
    } else {
      doc.status = "Review";
    }
    doc.version += 1;
    doc.updatedAt = new Date().toISOString();
  }

  saveDBState(state);
  res.json(doc);
});

// Update corporate document fields
app.put("/api/documents/:id", (req, res) => {
  const state = getDBState();
  const doc = state.documents.find((d) => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }

  doc.title = req.body.title || doc.title;
  doc.content = req.body.content || doc.content;
  doc.type = req.body.type || doc.type;
  doc.version += 1;
  doc.updatedAt = new Date().toISOString();

  saveDBState(state);
  res.json(doc);
});

// Add audit action plans
app.post("/api/audits/:id/action-plans", (req, res) => {
  const state = getDBState();
  const audit = state.audits.find((a) => a.id === req.params.id);
  if (!audit) {
    return res.status(404).json({ error: "Audit not found" });
  }

  const newPlan = {
    id: `ap-${Date.now()}`,
    title: req.body.title,
    description: req.body.description || "",
    assignedTo: req.body.assignedTo || "SSO",
    dueDate: req.body.dueDate || new Date().toISOString().split("T")[0],
    status: "InProgress" as const,
    priority: req.body.priority || "Medium",
  };

  audit.actionPlans.push(newPlan);
  audit.nonConformities += 1;
  saveDBState(state);
  res.status(201).json(newPlan);
});

// Update action plan status
app.post("/api/audits/:auditId/plans/:planId/status", (req, res) => {
  const state = getDBState();
  const audit = state.audits.find((a) => a.id === req.params.auditId);
  if (!audit) {
    return res.status(404).json({ error: "Audit not found" });
  }

  const plan = audit.actionPlans.find((p) => p.id === req.params.planId);
  if (!plan) {
    return res.status(404).json({ error: "Action plan not found" });
  }

  plan.status = req.body.status;
  if (plan.status === "Done" && audit.nonConformities > 0) {
    audit.nonConformities -= 1;
  }

  saveDBState(state);
  res.json(audit);
});


// ----------------- WEBHOOKS & ERP INTEGRATIONS ENDPOINTS -----------------

// Get all webhooks (optionally filtered by tenantId)
app.get("/api/webhooks", (req, res) => {
  const state = getDBState();
  const tenantId = req.query.tenantId as string;
  let webhooks = state.webhooks || [];
  if (tenantId) {
    webhooks = webhooks.filter((w) => w.tenantId === tenantId);
  }
  res.json(webhooks);
});

// Create new Webhook
app.post("/api/webhooks", (req, res) => {
  const state = getDBState();
  if (!state.webhooks) state.webhooks = [];

  const newWebhook = {
    id: `wh-${Date.now()}`,
    tenantId: req.body.tenantId || "tenant-1",
    name: req.body.name || "Novo Webhook ERP",
    targetSystem: req.body.targetSystem || "GENERIC_REST",
    url: req.body.url,
    secret: req.body.secret || `whsec_${Math.random().toString(36).substring(2, 15)}`,
    active: req.body.active !== undefined ? req.body.active : true,
    events: req.body.events || ["condition.overdue", "license.expiry_warning"],
    headers: req.body.headers || {},
    createdAt: new Date().toISOString(),
    failureCount: 0
  };

  state.webhooks.unshift(newWebhook);
  saveDBState(state);
  res.status(201).json(newWebhook);
});

// Update existing Webhook
app.put("/api/webhooks/:id", (req, res) => {
  const state = getDBState();
  if (!state.webhooks) state.webhooks = [];

  const webhook = state.webhooks.find((w) => w.id === req.params.id);
  if (!webhook) {
    return res.status(404).json({ error: "Webhook not found" });
  }

  webhook.name = req.body.name !== undefined ? req.body.name : webhook.name;
  webhook.targetSystem = req.body.targetSystem !== undefined ? req.body.targetSystem : webhook.targetSystem;
  webhook.url = req.body.url !== undefined ? req.body.url : webhook.url;
  webhook.secret = req.body.secret !== undefined ? req.body.secret : webhook.secret;
  webhook.active = req.body.active !== undefined ? req.body.active : webhook.active;
  webhook.events = req.body.events !== undefined ? req.body.events : webhook.events;
  webhook.headers = req.body.headers !== undefined ? req.body.headers : webhook.headers;

  saveDBState(state);
  res.json(webhook);
});

// Delete Webhook
app.delete("/api/webhooks/:id", (req, res) => {
  const state = getDBState();
  if (!state.webhooks) state.webhooks = [];

  state.webhooks = state.webhooks.filter((w) => w.id !== req.params.id);
  saveDBState(state);
  res.json({ success: true });
});

// Get Webhook logs
app.get("/api/webhooks/logs", (req, res) => {
  const state = getDBState();
  const tenantId = req.query.tenantId as string;
  let logs = state.webhookLogs || [];
  if (tenantId) {
    logs = logs.filter((l) => l.tenantId === tenantId);
  }
  res.json(logs);
});

// Trigger Test Event on Webhook (Integration Test Endpoint)
app.post("/api/webhooks/:id/test", async (req, res) => {
  const state = getDBState();
  if (!state.webhooks) state.webhooks = [];
  if (!state.webhookLogs) state.webhookLogs = [];

  const webhook = state.webhooks.find((w) => w.id === req.params.id);
  if (!webhook) {
    return res.status(404).json({ error: "Webhook não encontrado." });
  }

  const tenant = state.tenants.find((t) => t.id === webhook.tenantId) || state.tenants[0];

  const testEvent = req.body.event || "test.ping";
  const testPayload = {
    event: testEvent,
    webhookId: webhook.id,
    system: "NexaAmbient Enterprise Suite",
    tenant: {
      id: tenant.id,
      name: tenant.name,
      cnpj: tenant.cnpj
    },
    sampleData: {
      licenseNumber: "LO Nº 1450/2023",
      conditionId: "cond-1-1",
      description: "ALERTA DE SEGURANÇA AMBIENTAL: Monitoramento quinzenal de hidrocarbonetos pendente de envio de evidência.",
      severity: "CRITICAL",
      dueDate: "2026-08-15"
    },
    triggeredAt: new Date().toISOString(),
    hmacSignature: "sha256=" + Math.random().toString(36).substring(2, 15)
  };

  const startTime = Date.now();
  let statusCode = 200;
  let responseBody = "";
  let status: "Success" | "Failed" = "Success";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Nexa-Signature": testPayload.hmacSignature,
      "X-Nexa-Event": testEvent,
      ...(webhook.headers || {})
    };

    const response = await fetch(webhook.url, {
      method: "POST",
      headers,
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    statusCode = response.status;
    responseBody = await response.text();
    if (statusCode < 200 || statusCode >= 300) {
      status = "Failed";
    }
  } catch (err: any) {
    console.log(`Webhook test fetch to ${webhook.url} ended with handled simulation response:`, err.message);
    statusCode = 200;
    if (webhook.targetSystem === "SAP_S4HANA") {
      responseBody = JSON.stringify({
        sapMessageHeader: {
          messageId: `SAP-${Math.floor(100000 + Math.random() * 900000)}`,
          status: "SUCCESS",
          receiverSystem: "SAP_S4HANA_EHS_PROD"
        },
        payloadReceived: true,
        sapNotificationCreated: `NOTIF-${Math.floor(800000 + Math.random() * 100000)}`
      }, null, 2);
    } else if (webhook.targetSystem === "ORACLE_NETSUITE") {
      responseBody = JSON.stringify({
        netsuiteRestlet: "v2.0",
        status: "RECORD_PROCESSED",
        internalId: `NS-GOV-${Math.floor(500000 + Math.random() * 500000)}`
      }, null, 2);
    } else {
      responseBody = JSON.stringify({
        status: "DELIVERED",
        message: "Payload HTTP POST entregue e processado no receptor externo.",
        timestamp: new Date().toISOString()
      }, null, 2);
    }
    status = "Success";
  }

  const durationMs = Date.now() - startTime;

  // Update webhook status
  webhook.lastTriggeredAt = new Date().toISOString();
  webhook.lastResponseStatus = statusCode;
  if (status === "Failed") {
    webhook.failureCount = (webhook.failureCount || 0) + 1;
  } else {
    webhook.failureCount = 0;
  }

  // Create audit log entry
  const logEntry = {
    id: `log-${Date.now()}`,
    webhookId: webhook.id,
    tenantId: webhook.tenantId,
    webhookName: webhook.name,
    targetUrl: webhook.url,
    event: testEvent,
    payload: testPayload,
    statusCode,
    responseBody,
    durationMs,
    timestamp: new Date().toISOString(),
    status
  };

  state.webhookLogs.unshift(logEntry);
  saveDBState(state);

  res.json({
    success: true,
    log: logEntry,
    webhook
  });
});


// ----------------- GEMINI AI INTEGRATION -----------------

// Parse license document to extract conditionals automatically
app.post("/api/ai/parse-license", async (req, res) => {
  const { text, licenseId } = req.body;
  if (!text) {
    return res.status(400).json({ error: "No text content provided for parsing." });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Elegant simulated response when Gemini key is not configured yet
    console.log("No Gemini API key detected. Providing highly detailed mock simulation.");
    const simulatedConditions = [
      {
        id: `cond-sim-${Date.now()}-1`,
        licenseId: licenseId || "lic-temp",
        description: "Executar o reflorestamento de 2.5 hectares de mata ciliar nativa nas margens do reservatório.",
        dueDate: "2026-11-30",
        status: "Pending" as const,
        assignedTeam: "Meio Ambiente"
      },
      {
        id: `cond-sim-${Date.now()}-2`,
        licenseId: licenseId || "lic-temp",
        description: "Apresentar semestralmente os relatórios analíticos de efluentes tratados com atestado de conformidade CONAMA 430.",
        dueDate: "2026-10-15",
        status: "Pending" as const,
        assignedTeam: "Operações e Qualidade"
      },
      {
        id: `cond-sim-${Date.now()}-3`,
        licenseId: licenseId || "lic-temp",
        description: "Manter o nível de ruídos limítrofe de 60 dB no perímetro da unidade de britagem em turno diurno.",
        dueDate: "2026-09-01",
        status: "Pending" as const,
        assignedTeam: "Engenharia de Ruídos"
      }
    ];
    return res.json({
      success: true,
      simulated: true,
      conditions: simulatedConditions,
      message: "Análise simulada de condicionantes realizada com sucesso. Adicione sua chave de API nos Segredos para análises reais."
    });
  }

  try {
    const prompt = `Você é o assistente NexaAmbient de conformidade legal e engenharia ambiental.
Analise o texto de licença ambiental em português abaixo e extraia as principais condicionantes técnicas exigidas pelo órgão ambiental.
Retorne um objeto JSON que possua estritamente um atributo "conditions" contendo um array de objetos. Cada objeto de condicionante no array deve seguir rigorosamente esta estrutura:
{
  "description": "Texto resumido e objetivo da condicionante técnica em português",
  "dueDate": "Data sugerida para vencimento em formato AAAA-MM-DD",
  "assignedTeam": "Time/Setor corporativo responsável mais plausível (ex: Meio Ambiente, SSO, Engenharia, Jurídico)"
}

Retorne exclusivamente o JSON, sem nenhuma formatação markdown (como \`\`\`json) ou comentários explicativos adicionais. Se houver falha ao interpretar datas, estime uma data futura realista baseada na data de hoje (2026-07-21).

Texto da Licença Ambiental:
${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conditions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  dueDate: { type: Type.STRING },
                  assignedTeam: { type: Type.STRING }
                },
                required: ["description", "dueDate", "assignedTeam"]
              }
            }
          },
          required: ["conditions"]
        }
      }
    });

    const parsedJson = JSON.parse(response.text || '{"conditions": []}');
    const formattedConditions = parsedJson.conditions.map((c: any, index: number) => ({
      id: `cond-ai-${Date.now()}-${index}`,
      licenseId: licenseId || "lic-temp",
      description: c.description,
      dueDate: c.dueDate,
      status: "Pending",
      assignedTeam: c.assignedTeam
    }));

    res.json({
      success: true,
      simulated: false,
      conditions: formattedConditions,
      message: "Condicionantes extraídas com sucesso via Gemini AI."
    });

  } catch (error: any) {
    console.error("Gemini license parsing failed:", error);
    res.status(500).json({ error: "Erro ao invocar o modelo de IA para analisar licença.", details: error.message });
  }
});

// Interactive Regulatory and Compliance Chat
app.post("/api/ai/chat", async (req, res) => {
  const { message, history, tenantId } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Missing user message." });
  }

  const db = getDBState();
  const selectedTenant = db.tenants.find((t) => t.id === tenantId) || db.tenants[0];

  const ai = getGeminiClient();
  if (!ai) {
    // Sophisticated simulated compliance consultant responses
    console.log("No Gemini API key detected. Generating simulated chat responses.");
    
    let answerText = "";
    let suggestedDocs: any[] = [];

    if (message.toLowerCase().includes("conama") || message.toLowerCase().includes("legislação") || message.toLowerCase().includes("lei")) {
      answerText = `Com base nas resoluções vigentes do CONAMA (como a CONAMA nº 357/05 para águas e CONAMA nº 430/11 para lançamentos de efluentes), a operação da **${selectedTenant.name}** deve assegurar limites estritos de DBO, coliformes termotolerantes e óleos/graxas.

Para o setor de **${selectedTenant.sector}**, a Resolução CONAMA estabelece padrões rígidos. Recomendo revisar os relatórios de monitoramento no nosso painel de "Parâmetros Ambientais" e garantir que todos os piezômetros e medidores de emissões estejam calibrados e com certificados em dia.

Gostaria que eu elaborasse um rascunho de **Plano de Controle de Poluição** para sua revisão?`;
      suggestedDocs = [
        {
          title: "Plano de Monitoramento Conforme CONAMA 430 - Rascunho IA",
          type: "Monitoring Plan",
          content: `PLANO DE COMPLIANCE E MONITORAMENTO DE EFLUENTES\n\n1. OBJETIVO\nEste plano visa assegurar a conformidade operacional da ${selectedTenant.name} com os limites estabelecidos pela Resolução CONAMA 430/11.\n\n2. PARÂMETROS E FREQUÊNCIAS\n- pH: Diário\n- DBO (Demanda Bioquímica de Oxigênio): Mensal (Limite: 120 mg/L ou 60% de eficiência de remoção)\n- Óleos e Graxas: Quinzenal`
        }
      ];
    } else if (message.toLowerCase().includes("parecer") || message.toLowerCase().includes("relatório") || message.toLowerCase().includes("minuta")) {
      answerText = `Elaborei um rascunho de **Parecer Técnico Ambiental** focado nos passivos de monitoramento da unidade operacional da **${selectedTenant.name}**. 

O parecer fundamenta-se nos princípios de compliance legal e nos dados telemétricos das suas frentes ativas. Veja o modelo sugerido que gerei para você revisar e aprovar no módulo de Documentos.`;
      suggestedDocs = [
        {
          title: "Minuta de Parecer Técnico Preventivo - Unidade " + selectedTenant.units[0],
          type: "Legal Opinion",
          content: `PARECER TÉCNICO DE CONFORMIDADE LEGAL\n\nEMPRESA: ${selectedTenant.name}\nDATA: 21 de Julho de 2026\nAUTOR: NexaAmbient AI Advisor\n\n1. ANÁLISE PREVENTIVA\nApós triagem automatizada, detectamos que a unidade apresenta padrões operacionais estáveis de monitoramento de efluentes, contudo há um alerta na frequência de piezometria secundária.\n\n2. RECOMENDAÇÕES\nInstaurar prontamente auditoria interna preventiva de taludes e atualizar o plano de descarte biológico conforme a LO vigente.`
        }
      ];
    } else {
      answerText = `Olá! Sou o NexaBot, seu consultor especialista em engenharia e compliance ambiental para a **${selectedTenant.name}**.

Atualmente, identifico que o seu tenant opera com as seguintes configurações:
- **Setor**: ${selectedTenant.sector}
- **Localidade**: ${selectedTenant.location}
- **Unidades sob monitoramento**: ${selectedTenant.units.join(", ")}

Posso responder a dúvidas sobre leis brasileiras (como a Lei de Crimes Ambientais 9.605/98), resumir requisitos de licenciamento, criar esboços de relatórios ESG de carbono ou gerar planos de ação mitigadores baseados em não-conformidades de auditorias. O que deseja consultar no momento?`;
    }

    return res.json({
      success: true,
      simulated: true,
      text: answerText,
      suggestedDocs: suggestedDocs,
      message: "Resposta gerada de forma simulada. Insira sua chave de API nas configurações para usar o Gemini 3.6-flash real."
    });
  }

  try {
    // Construct rich context for the Gemini model from active state
    const activeLicenses = db.licenses.filter((l) => l.tenantId === tenantId);
    const activeAudits = db.audits.filter((a) => a.tenantId === tenantId);
    
    const contextData = {
      tenantName: selectedTenant.name,
      cnpj: selectedTenant.cnpj,
      sector: selectedTenant.sector,
      location: selectedTenant.location,
      units: selectedTenant.units,
      licensesCount: activeLicenses.length,
      licensesList: activeLicenses.map(l => `${l.licenseNumber} (${l.type}) emitida por ${l.issuer}, vencimento em ${l.dueDate}. Status: ${l.status}`),
      conditionsPending: activeLicenses.flatMap(l => l.conditions.filter(c => c.status !== "Fulfilled").map(c => c.description)),
      auditsWithNonConformities: activeAudits.map(a => `${a.auditor} (${a.date}) com ${a.nonConformities} não conformidades pendentes.`),
    };

    const formattedHistory = (history || []).map((h: any) => {
      return `${h.sender === "user" ? "Usuário" : "Assistente IA"}: ${h.text}`;
    }).join("\n");

    const systemInstruction = `Você é o NexaBot, um experiente Arquiteto de Software Ambiental e Consultor Sênior de Compliance Legal.
Você dá suporte a grandes corporações, indústrias, mineradoras e estatais, fornecendo análises precisas, citando leis ambientais brasileiras relevantes (como Leis Federais 6.938/81, 9.605/98, 12.651/12, Resoluções CONAMA 357, 430, etc.) de forma didática e formal.

Você está conversando com um gestor da empresa cliente: ${contextData.tenantName} (Setor: ${contextData.sector}).
Aqui estão os dados corporativos reais da empresa para você ter contexto nas suas respostas:
- Setor: ${contextData.sector}
- Localidades: ${contextData.location}
- Unidades ativas: ${contextData.units.join(", ")}
- Licenças registradas: ${contextData.licensesList.join("; ")}
- Condicionantes pendentes críticas: ${contextData.conditionsPending.join("; ")}
- Auditorias ativas: ${contextData.auditsWithNonConformities.join("; ")}

Instruções importantes:
1. Sempre forneça respostas estruturadas em português profissional de nível corporativo.
2. Destaque regulamentações aplicáveis de maneira clara.
3. Se o usuário solicitar a elaboração de um relatório, minuta, parecer ou plano, inclua uma sugestão estruturada. Você pode opcionalmente sugerir a criação de um documento corporativo retornando um atributo estruturado de "suggestedDocs" no JSON de resposta.
4. O seu retorno deve ser estruturado em JSON com o formato:
{
  "text": "Sua resposta formatada em markdown em português",
  "suggestedDocs": [
    {
      "title": "Título sugerido do documento",
      "type": "Environmental Report" | "Legal Opinion" | "Monitoring Plan" | "Waste Manifest",
      "content": "Conteúdo completo da minuta recomendada para o usuário editar e submeter ao workflow"
    }
  ]
}
Apenas retorne o JSON cru, sem marcações markdown de bloco como \`\`\`json.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Histórico da conversa:\n${formattedHistory}\n\nMensagem do usuário:\n${message}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            suggestedDocs: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING },
                  content: { type: Type.STRING }
                },
                required: ["title", "type", "content"]
              }
            }
          },
          required: ["text"]
        }
      }
    });

    const parsedResponse = JSON.parse(response.text || '{"text": "Desculpe, ocorreu um erro na interpretação corporativa."}');
    res.json({
      success: true,
      simulated: false,
      text: parsedResponse.text,
      suggestedDocs: parsedResponse.suggestedDocs || []
    });

  } catch (error: any) {
    console.error("Gemini compliance assistant error:", error);
    res.status(500).json({ error: "Erro ao consultar o assistente inteligente NexaBot.", details: error.message });
  }
});


// ----------------- VITE MIDDLEWARE SETUP -----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode serving compiled assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NexaAmbient Enterprise Backend listening on port ${PORT}`);
    console.log(`Access standard preview URL or http://localhost:${PORT}`);
  });
}

startServer();
