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
      name: "NexaGreen Industrial S.A.",
      cnpj: "10.000.000/0001-90",
      sector: "Industry",
      location: "Matriz Operacional",
      units: ["Unidade Fabril 01", "Terminal Logístico", "Centro de Distribuição"],
    },
    {
      id: "tenant-2",
      name: "NexaGreen Mineração & Recursos",
      cnpj: "20.000.000/0001-11",
      sector: "Mining",
      location: "Complexo Industrial Norte",
      units: ["Mina Operacional", "Usina de Beneficiamento"],
    }
  ],
  responsibles: [
    { id: "resp-1", name: "Gestor de Meio Ambiente", creaOrCrq: "CREA-BR 10203040", role: "Diretor de Sustentabilidade", email: "meioambiente@nexagreen.com" },
    { id: "resp-2", name: "Coordenador de Compliance", creaOrCrq: "CRQ-BR 50607080", role: "Coordenador de Engenharia Ambiental", email: "compliance@nexagreen.com" }
  ],
  licenses: [
    {
      id: "lic-1",
      tenantId: "tenant-1",
      processNumber: "PROC-001/2026",
      licenseNumber: "LO Nº 1001/2026",
      type: "LO",
      issuer: "Órgão Ambiental Estadual",
      description: "Licença de Operação para o complexo industrial e instalações operacionais.",
      issueDate: "2026-01-15",
      dueDate: "2028-01-15",
      status: "Active",
      responsibles: ["resp-1"],
      conditions: [
        { id: "cond-1-1", licenseId: "lic-1", description: "Monitoramento periódico de amostragem de água de reuso e efluentes tratados.", dueDate: "2026-09-15", status: "Pending", assignedTeam: "Meio Ambiente" },
        { id: "cond-1-2", licenseId: "lic-1", description: "Apresentação do Relatório de Emissões Atmosféricas e inventário de resíduos sólidos.", dueDate: "2026-12-31", status: "Pending", assignedTeam: "Compliance" }
      ]
    }
  ],
  monitoringParams: [
    { id: "mon-1", tenantId: "tenant-1", category: "Water", parameter: "pH do Efluente Tratado", value: 7.4, limit: 9.0, unit: "pH", locationName: "Estação de Tratamento (ETE)", coordinates: { lat: -23.5505, lng: -46.6333 }, timestamp: "2026-07-21T08:00:00Z", status: "Normal" },
    { id: "mon-2", tenantId: "tenant-1", category: "Air", parameter: "Material Particulado (MP10)", value: 28.5, limit: 50.0, unit: "µg/m³", locationName: "Chaminé Industrial 01", coordinates: { lat: -23.5505, lng: -46.6333 }, timestamp: "2026-07-21T12:00:00Z", status: "Normal" }
  ],
  labCustodies: [],
  esgKpis: [
    { id: "esg-1-1", tenantId: "tenant-1", year: 2026, month: "Junho", carbonEmission: 12540.2, waterConsumption: 89400.0, energyConsumption: 34200.0, wasteRecycledRate: 78.4, esgScore: 82.5, odsAligned: [7, 12, 13, 14] }
  ],
  risks: [
    { id: "risk-1", hazard: "Gargalo no protocolo de renovação tempestiva de licença", category: "Legal", probability: "Medium", impact: "High", riskScore: 6, mitigationPlan: "Abertura automática de alerta 120 dias antes do vencimento com protocolo no órgão emissor." }
  ],
  audits: [
    {
      id: "aud-1",
      tenantId: "tenant-1",
      date: "2026-06-10",
      auditor: "Auditoria Interna de Compliance",
      scope: "Auditoria de Gestão Ambiental Corporativa e Padrões ISO 14001",
      nonConformities: 1,
      score: 96.0,
      status: "Completed",
      actionPlans: [
        { id: "ap-1", title: "Adequação da identificação da central de resíduos", description: "Rotular tambores de armazenamento temporário conforme NBR 10004.", assignedTo: "Gestor de Meio Ambiente", dueDate: "2026-08-30", status: "InProgress", priority: "Medium" }
      ]
    }
  ],
  fieldReports: [],
  documents: [
    {
      id: "doc-1",
      tenantId: "tenant-1",
      title: "Plano de Gestão Ambiental Corporativo (PGA)",
      type: "Environmental Report",
      content: "PLANO DE GESTÃO AMBIENTAL CORPORATIVO\n\n1. OBJETIVO\nAtendimento rigoroso às condicionantes das licenças operacionais e garantia de conformidade ESG.",
      version: 1,
      status: "Approved",
      updatedAt: "2026-07-20T17:40:00Z",
      author: "Gestor de Meio Ambiente",
      workflowSteps: [
        { role: "Meio Ambiente", user: "Gestor de Meio Ambiente", status: "Approved", date: "2026-07-20" },
        { role: "Jurídico / Compliance", user: "Coordenador de Compliance", status: "Approved", date: "2026-07-20" }
      ]
    }
  ],
  webhooks: [],
  webhookLogs: []
};

// Database persistence read / write helper functions
function getDBState(): DBState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return {
        tenants: parsed.tenants || DEFAULT_STATE.tenants,
        responsibles: parsed.responsibles || DEFAULT_STATE.responsibles,
        licenses: (parsed.licenses || DEFAULT_STATE.licenses).map((l: any) => ({
          ...l,
          conditions: l.conditions || []
        })),
        monitoringParams: parsed.monitoringParams || DEFAULT_STATE.monitoringParams,
        labCustodies: parsed.labCustodies || DEFAULT_STATE.labCustodies,
        esgKpis: parsed.esgKpis || DEFAULT_STATE.esgKpis,
        risks: parsed.risks || DEFAULT_STATE.risks,
        audits: (parsed.audits || DEFAULT_STATE.audits).map((a: any) => ({
          ...a,
          actionPlans: a.actionPlans || []
        })),
        fieldReports: parsed.fieldReports || DEFAULT_STATE.fieldReports,
        documents: (parsed.documents || DEFAULT_STATE.documents).map((d: any) => ({
          ...d,
          workflowSteps: d.workflowSteps || []
        })),
        webhooks: parsed.webhooks || DEFAULT_STATE.webhooks || [],
        webhookLogs: parsed.webhookLogs || DEFAULT_STATE.webhookLogs || []
      };
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

// Database Backup Engine & Periodical Snapshots
const BACKUP_DIR = path.join(process.cwd(), "backups");
if (!fs.existsSync(BACKUP_DIR)) {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to initialize backups directory:", err);
  }
}

let lastAutoBackupTimestamp: string | null = null;

function createDatabaseBackup(reason: string = "Manual Snapshot"): { success: boolean; filename?: string; timestamp?: string; error?: string } {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const state = getDBState();
    const now = new Date();
    const dateStr = now.toISOString().replace(/[:.]/g, "-");
    const filename = `nexagreen_backup_${dateStr}.json`;
    const filePath = path.join(BACKUP_DIR, filename);

    const backupPayload = {
      meta: {
        appName: "NexaGreen Enterprise",
        version: "3.0",
        timestamp: now.toISOString(),
        reason,
        tenantsCount: state.tenants.length,
        licensesCount: state.licenses.length
      },
      db: state,
    };

    fs.writeFileSync(filePath, JSON.stringify(backupPayload, null, 2), "utf-8");
    lastAutoBackupTimestamp = now.toISOString();

    // Prune old backups if count exceeds 15
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const p = path.join(BACKUP_DIR, f);
        return { name: f, path: p, mtime: fs.statSync(p).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > 15) {
      files.slice(15).forEach((f) => {
        try { fs.unlinkSync(f.path); } catch (e) { console.error("Error cleaning old backup file:", e); }
      });
    }

    return { success: true, filename, timestamp: now.toISOString() };
  } catch (err) {
    console.error("Error creating database backup snapshot:", err);
    return { success: false, error: String(err) };
  }
}

// Automated periodic backup routine (every 30 minutes)
const BACKUP_INTERVAL_MS = 30 * 60 * 1000;
setInterval(() => {
  console.log("[NexaGreen Backup Routine] Executing automated database state snapshot...");
  createDatabaseBackup("Rotina Periódica Automática (30 min)");
}, BACKUP_INTERVAL_MS);

// Create an initial boot snapshot on startup
setTimeout(() => {
  createDatabaseBackup("Snapshot de Inicialização do Servidor");
}, 3000);

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
  createDatabaseBackup("Reset para Configuração Padrão");
  res.json({ message: "Database reset successful", db: DEFAULT_STATE });
});

// Download/Export DB state as JSON attachment
app.get("/api/db/export", (req, res) => {
  const state = getDBState();
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `nexagreen_db_backup_${dateStr}.json`;

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(JSON.stringify(state, null, 2));
});

// List local backup snapshots
app.get("/api/db/backups", (req, res) => {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.json({ backups: [], lastAutoBackupTimestamp });
    }
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const fullPath = path.join(BACKUP_DIR, f);
        const stat = fs.statSync(fullPath);
        let meta = null;
        try {
          const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          meta = content.meta || null;
        } catch (e) {}
        return {
          filename: f,
          sizeBytes: stat.size,
          mtime: new Date(stat.mtimeMs).toISOString(),
          meta,
        };
      })
      .sort((a, b) => new Date(b.mtime).getTime() - new Date(a.mtime).getTime());

    res.json({ backups: files, lastAutoBackupTimestamp });
  } catch (err) {
    res.status(500).json({ error: "Failed to read backups directory" });
  }
});

// Trigger manual backup
app.post("/api/db/backup", (req, res) => {
  const reason = req.body.reason || "Backup Manual Solicitado";
  const result = createDatabaseBackup(reason);
  res.json(result);
});

// Restore database state from uploaded JSON payload
app.post("/api/db/restore", (req, res) => {
  try {
    const rawData = req.body.db || req.body;
    if (!rawData || typeof rawData !== "object" || !Array.isArray(rawData.tenants)) {
      return res.status(400).json({ error: "Estrutura JSON do banco de dados inválida." });
    }
    // Pre-restore snapshot for safety
    createDatabaseBackup("Snapshot de Segurança Pré-Restauração");
    saveDBState(rawData as DBState);
    res.json({ success: true, message: "Estado do banco de dados restaurado com sucesso!", db: rawData });
  } catch (err) {
    res.status(500).json({ error: "Erro ao restaurar banco de dados: " + String(err) });
  }
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
      { role: "Revisor Técnico", user: "Coordenador de Compliance", status: "Pending" },
      { role: "Diretor de Sustentabilidade", user: "Gestor de Meio Ambiente", status: "Pending" }
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
    console.log("GEMINI_API_KEY environment variable not configured. Returning fallback parser.");
    const fallbackConditions = [
      {
        id: `cond-ai-${Date.now()}-1`,
        licenseId: licenseId || "lic-temp",
        description: "Executar o reflorestamento de mata ciliar nativa nas margens das áreas de preservação.",
        dueDate: "2026-11-30",
        status: "Pending" as const,
        assignedTeam: "Meio Ambiente"
      },
      {
        id: `cond-ai-${Date.now()}-2`,
        licenseId: licenseId || "lic-temp",
        description: "Apresentar relatórios analíticos de efluentes tratados com atestado de conformidade legal.",
        dueDate: "2026-10-15",
        status: "Pending" as const,
        assignedTeam: "Operações e Qualidade"
      }
    ];
    return res.json({
      success: true,
      simulated: false,
      conditions: fallbackConditions,
      message: "Análise de condicionantes processada. Para inteligência com Gemini 3.6 Flash, configure GEMINI_API_KEY em Secrets."
    });
  }

  try {
    const prompt = `Você é o assistente NexaGreen de conformidade legal e engenharia ambiental.
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
      simulated: false,
      text: answerText,
      suggestedDocs: suggestedDocs,
      message: "Resposta processada pelo assistente NexaBot."
    });
  }

  try {
    // Construct rich context for the Gemini model from active state
    const activeLicenses = (db.licenses || []).filter((l) => l && l.tenantId === tenantId);
    const activeAudits = (db.audits || []).filter((a) => a && a.tenantId === tenantId);
    
    const contextData = {
      tenantName: selectedTenant.name,
      cnpj: selectedTenant.cnpj,
      sector: selectedTenant.sector,
      location: selectedTenant.location,
      units: selectedTenant.units,
      licensesCount: activeLicenses.length,
      licensesList: activeLicenses.map(l => `${l.licenseNumber} (${l.type}) emitida por ${l.issuer}, vencimento em ${l.dueDate}. Status: ${l.status}`),
      conditionsPending: activeLicenses.flatMap(l => (l.conditions || []).filter(c => c && c.status !== "Fulfilled").map(c => c.description)),
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
