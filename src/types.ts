/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Multi-tenant Corporate Entities
export interface Tenant {
  id: string;
  name: string;
  cnpj: string;
  sector: "Mining" | "Energy" | "Industry" | "Sanitation" | "Agribusiness";
  location: string;
  logoUrl?: string;
  units: string[];
}

// Technical Manager / Compliance Officer
export interface TechnicalResponsible {
  id: string;
  name: string;
  creaOrCrq: string;
  role: string;
  email: string;
}

// Environmental Licensing
export type LicenseType = "LP" | "LI" | "LO" | "Authorization" | "Outorga";
export type LicenseStatus = "Active" | "Expired" | "InRenewal" | "Suspended";

export interface Condition {
  id: string;
  licenseId: string;
  description: string;
  dueDate: string;
  status: "Fulfilled" | "Pending" | "Overdue";
  assignedTeam: string;
  evidenceName?: string;
  evidenceDate?: string;
}

export interface EnvironmentalLicense {
  id: string;
  tenantId: string;
  processNumber: string;
  licenseNumber: string;
  type: LicenseType;
  issuer: string; // e.g. IBAMA, FEAM, CETESB
  description: string;
  issueDate: string;
  dueDate: string;
  status: LicenseStatus;
  responsibles: string[]; // TechnicalResponsible IDs
  conditions: Condition[];
}

// Monitoring & Parameters (Water, Air, Soil, Noise, etc.)
export interface MonitoringParam {
  id: string;
  tenantId: string;
  category: "Water" | "Soil" | "Air" | "Noise" | "Fauna" | "Flora" | "Effluents" | "Waste";
  parameter: string; // pH, PM2.5, Noise (dB), CO2 (t), etc.
  value: number;
  limit: number;
  unit: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  status: "Normal" | "Alert" | "Critical";
}

// Laboratories & Chains of Custody
export interface LabCustody {
  id: string;
  sampleCode: string;
  collectorName: string;
  collectDate: string;
  labName: string;
  analyzedParams: string[];
  status: "Collected" | "InTransit" | "Analysis" | "LaudoEmitted";
  laudoUrl?: string;
}

// ESG Carbon & Indicators
export interface EsgKpi {
  id: string;
  tenantId: string;
  year: number;
  month: string;
  carbonEmission: number; // Scope 1 + 2 + 3 in tCO2e
  waterConsumption: number; // m3
  energyConsumption: number; // MWh
  wasteRecycledRate: number; // %
  esgScore: number; // 0-100
  odsAligned: number[]; // e.g. [6, 7, 12, 13, 15]
}

// Compliance, Risks & Audits
export interface RiskMatrixItem {
  id: string;
  hazard: string;
  category: "Legal" | "Operational" | "Reputational" | "Financial";
  probability: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High";
  riskScore: number; // Prob * Impact matrix calculated value (1-9)
  mitigationPlan: string;
}

export interface AuditActionPlan {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: "NotStarted" | "InProgress" | "Done";
  priority: "Low" | "Medium" | "High";
}

export interface EnvironmentalAudit {
  id: string;
  tenantId: string;
  date: string;
  auditor: string;
  scope: string;
  nonConformities: number;
  score: number; // 0-100
  status: "Scheduled" | "Completed" | "FollowUp";
  actionPlans: AuditActionPlan[];
}

// Field Offline App Simulator Reports
export interface FieldInspectionReport {
  id: string;
  tenantId: string;
  inspectorName: string;
  date: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  checklist: {
    question: string;
    checked: boolean;
    note?: string;
  }[];
  photo?: string; // base64 or reference placeholder
  signature?: string; // base64 canvas signature
  qrCode?: string; // Verification identifier
  isSynced: boolean;
}

// Document Editor & BPMN Approval Workflow
export type DocumentStatus = "Draft" | "Review" | "Approved" | "Archived";
export interface ApprovalStep {
  role: string;
  user: string;
  status: "Pending" | "Approved" | "Rejected";
  date?: string;
}

export interface CorporateDocument {
  id: string;
  tenantId: string;
  title: string;
  type: "Environmental Report" | "Legal Opinion" | "Monitoring Plan" | "Waste Manifest";
  content: string;
  version: number;
  status: DocumentStatus;
  updatedAt: string;
  author: string;
  workflowSteps: ApprovalStep[];
}

// AI Assistant Chat Messages
export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  suggestedDocs?: { title: string; type: string; content: string }[];
}

// Webhook & ERP System Integrations (SAP, Oracle, Custom APIs)
export type WebhookEvent =
  | "license.expiry_warning"
  | "license.status_changed"
  | "condition.overdue"
  | "condition.status_changed"
  | "monitoring.critical_alert"
  | "document.approval_step";

export interface WebhookConfig {
  id: string;
  tenantId: string;
  name: string;
  targetSystem: "SAP_S4HANA" | "ORACLE_NETSUITE" | "SALESFORCE" | "MS_TEAMS" | "GENERIC_REST";
  url: string;
  secret: string;
  active: boolean;
  events: WebhookEvent[];
  headers?: Record<string, string>;
  createdAt: string;
  lastTriggeredAt?: string;
  lastResponseStatus?: number;
  failureCount: number;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  tenantId: string;
  webhookName: string;
  targetUrl: string;
  event: WebhookEvent | "test.ping";
  payload: any;
  statusCode: number;
  responseBody: string;
  durationMs: number;
  timestamp: string;
  status: "Success" | "Failed";
}

// Full Database State wrapper
export interface DBState {
  tenants: Tenant[];
  responsibles: TechnicalResponsible[];
  licenses: EnvironmentalLicense[];
  monitoringParams: MonitoringParam[];
  labCustodies: LabCustody[];
  esgKpis: EsgKpi[];
  risks: RiskMatrixItem[];
  audits: EnvironmentalAudit[];
  fieldReports: FieldInspectionReport[];
  documents: CorporateDocument[];
  webhooks?: WebhookConfig[];
  webhookLogs?: WebhookLog[];
}

// RBAC & Authentication Types
export type UserRole = "Administrador" | "Técnico" | "Auditor";

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  department: string;
  tenantId: string;
  avatarUrl?: string;
}
