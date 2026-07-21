/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Webhook, 
  Plus, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Key, 
  Globe, 
  Code2, 
  Database, 
  Layers, 
  Activity, 
  Terminal, 
  Cpu, 
  Copy, 
  Check, 
  Trash2, 
  Settings2, 
  ShieldCheck, 
  ExternalLink,
  Radio,
  FileCode
} from "lucide-react";
import { Tenant, WebhookConfig, WebhookLog, WebhookEvent } from "../types";

interface IntegrationsTabProps {
  tenant: Tenant;
  webhooks: WebhookConfig[];
  webhookLogs: WebhookLog[];
  onAddWebhook: (webhookData: Partial<WebhookConfig>) => Promise<void>;
  onUpdateWebhook: (id: string, webhookData: Partial<WebhookConfig>) => Promise<void>;
  onDeleteWebhook: (id: string) => Promise<void>;
  onTestWebhook: (id: string, event: WebhookEvent) => Promise<any>;
  isDbUpdating: boolean;
}

const EVENT_LABELS: Record<WebhookEvent, { label: string; desc: string }> = {
  "license.expiry_warning": {
    label: "Vencimento de Licença Ambiental",
    desc: "Disparado 90, 60 e 30 dias antes da expiração de licenças LO, LI ou LP."
  },
  "license.status_changed": {
    label: "Mudança de Status da Licença",
    desc: "Altera entre Ativa, Em Renovação, Suspensa ou Vencida."
  },
  "condition.overdue": {
    label: "Condicionante Crítica Vencida",
    desc: "Notificação quando o prazo limite de uma exigência legal é ultrapassado."
  },
  "condition.status_changed": {
    label: "Atualização em Condicionante",
    desc: "Quando o status de uma condicionante é alterado ou cumprido."
  },
  "monitoring.critical_alert": {
    label: "Alerta Crítico de Telemetria Ambiental",
    desc: "Disparado quando medições de efluentes, água, ar ou ruídos extrapolam o limite CONAMA."
  },
  "document.approval_step": {
    label: "Etapa de Aprovação do Parecer",
    desc: "Notifica sobre assinaturas criptográficas ICP-Brasil em documentos ambientais."
  }
};

const ERP_PRESETS = [
  {
    system: "SAP_S4HANA",
    name: "SAP S/4HANA ERP (EHS & PM)",
    icon: "SAP",
    color: "from-blue-600 to-indigo-700",
    defaultUrl: "https://sap-gateway.empresa.com/sap/bc/rest/ehs/webhook",
    defaultHeaders: JSON.stringify({ "Authorization": "Bearer sap_oauth_token", "X-SAP-Client": "100" }, null, 2)
  },
  {
    system: "ORACLE_NETSUITE",
    name: "Oracle NetSuite Cloud Governance",
    icon: "ORACLE",
    color: "from-red-600 to-orange-700",
    defaultUrl: "https://1234567.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=102",
    defaultHeaders: JSON.stringify({ "Authorization": "NLAuth nlauth_account=1234567" }, null, 2)
  },
  {
    system: "SALESFORCE",
    name: "Salesforce Net Zero Cloud",
    icon: "SF",
    color: "from-sky-500 to-blue-600",
    defaultUrl: "https://services.salesforce.com/services/apexrest/EnvironmentalAlerts",
    defaultHeaders: JSON.stringify({ "Authorization": "Bearer sf_oauth_token" }, null, 2)
  },
  {
    system: "GENERIC_REST",
    name: "Endpoint REST Customizado / Webhook Server",
    icon: "REST",
    color: "from-emerald-600 to-teal-700",
    defaultUrl: "https://api.empresa.com/v1/webhooks/environmental",
    defaultHeaders: JSON.stringify({ "Content-Type": "application/json", "X-API-Key": "sua_chave_aqui" }, null, 2)
  }
];

export default function IntegrationsTab({
  tenant,
  webhooks = [],
  webhookLogs = [],
  onAddWebhook,
  onUpdateWebhook,
  onDeleteWebhook,
  onTestWebhook,
  isDbUpdating
}: IntegrationsTabProps) {
  const [subTab, setSubTab] = useState<"endpoints" | "logs" | "docs">("endpoints");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  // Form State for Webhook creation
  const [formName, setFormName] = useState("");
  const [formTargetSystem, setFormTargetSystem] = useState<any>("SAP_S4HANA");
  const [formUrl, setFormUrl] = useState("");
  const [formSecret, setFormSecret] = useState(`whsec_${Math.random().toString(36).substring(2, 15)}`);
  const [formEvents, setFormEvents] = useState<WebhookEvent[]>([
    "condition.overdue",
    "license.expiry_warning",
    "monitoring.critical_alert"
  ]);
  const [formHeadersText, setFormHeadersText] = useState("{\n  \"Content-Type\": \"application/json\"\n}");

  const tenantWebhooks = webhooks.filter((w) => w.tenantId === tenant.id);
  const tenantLogs = webhookLogs.filter((l) => l.tenantId === tenant.id);

  const handleCopySecret = (secret: string) => {
    navigator.clipboard.writeText(secret);
    setCopiedKey(secret);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSelectPreset = (preset: typeof ERP_PRESETS[0]) => {
    setFormTargetSystem(preset.system);
    setFormName(`${preset.name} - ${tenant.name.split(" ")[0]}`);
    setFormUrl(preset.defaultUrl);
    setFormHeadersText(preset.defaultHeaders);
  };

  const handleToggleEvent = (eventKey: WebhookEvent) => {
    if (formEvents.includes(eventKey)) {
      setFormEvents(formEvents.filter((e) => e !== eventKey));
    } else {
      setFormEvents([...formEvents, eventKey]);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUrl) {
      alert("Por favor informe a URL de destino do Webhook.");
      return;
    }

    let parsedHeaders = {};
    try {
      if (formHeadersText.trim()) {
        parsedHeaders = JSON.parse(formHeadersText);
      }
    } catch (err) {
      alert("Formato JSON de cabeçalhos inválido.");
      return;
    }

    await onAddWebhook({
      tenantId: tenant.id,
      name: formName || `Webhook ${formTargetSystem}`,
      targetSystem: formTargetSystem,
      url: formUrl,
      secret: formSecret,
      events: formEvents,
      headers: parsedHeaders,
      active: true
    });

    setIsModalOpen(false);
    // Reset form
    setFormName("");
    setFormUrl("");
  };

  const handleTriggerTest = async (whId: string, event: WebhookEvent = "condition.overdue") => {
    setTestingId(whId);
    setTestResult(null);
    try {
      const res = await onTestWebhook(whId, event);
      setTestResult(res);
    } catch (err) {
      alert("Falha ao disparar evento de teste no Webhook.");
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto" id="integrations-tab">
      
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest mb-1">
            <Webhook className="h-4 w-4" />
            <span>Integrações Externas & ERPs</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Central de Webhooks & Notificações Assíncronas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Sincronização em tempo real entre o <strong>NexaAmbient</strong> e sistemas ERPs corporativos (SAP S/4HANA, Oracle NetSuite, Salesforce) para disparo de alertas de condicionantes e licenças.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Webhook ERP</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2">
        <button
          onClick={() => setSubTab("endpoints")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            subTab === "endpoints"
              ? "bg-slate-900 dark:bg-emerald-600 text-white shadow"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Endpoints Configurados ({tenantWebhooks.length})</span>
        </button>

        <button
          onClick={() => setSubTab("logs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            subTab === "logs"
              ? "bg-slate-900 dark:bg-emerald-600 text-white shadow"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Histórico de Entregas & Logs ({tenantLogs.length})</span>
        </button>

        <button
          onClick={() => setSubTab("docs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
            subTab === "docs"
              ? "bg-slate-900 dark:bg-emerald-600 text-white shadow"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>Documentação JSON & Assinatura HMAC</span>
        </button>
      </div>

      {/* TAB 1: ENDPOINTS CONFIGURADOS */}
      {subTab === "endpoints" && (
        <div className="space-y-6">
          
          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Integradores Ativos</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {tenantWebhooks.filter(w => w.active).length} / {tenantWebhooks.length}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Radio className="h-6 w-6 animate-pulse" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Taxa de Sucesso (HTTP 200)</p>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  99.8%
                </p>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notificações Disparadas</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {tenantLogs.length}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-blue-600 dark:text-blue-400">
                <Send className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Assinatura Criptográfica</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                  HMAC-SHA256
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-950/50 rounded-xl text-purple-600 dark:text-purple-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Test Modal Overlay if a test was performed */}
          {testResult && (
            <div className="bg-emerald-950/90 border border-emerald-500/50 rounded-3xl p-6 text-white space-y-4 shadow-2xl relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                  <h3 className="font-bold text-lg">Teste de Disparo de Webhook Executado</h3>
                </div>
                <button
                  onClick={() => setTestResult(null)}
                  className="text-xs font-bold bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300 cursor-pointer"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Status HTTP</p>
                  <p className="text-emerald-400 font-extrabold text-sm mt-0.5">{testResult.log.statusCode} OK</p>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Latência de Entrega</p>
                  <p className="text-white font-extrabold text-sm mt-0.5">{testResult.log.durationMs} ms</p>
                </div>
                <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  <p className="text-slate-400 uppercase font-semibold text-[10px]">Assinatura Criptográfica</p>
                  <p className="text-emerald-300 font-mono text-[11px] truncate mt-0.5">{testResult.log.payload.hmacSignature}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <p className="text-emerald-400 font-sans font-bold text-[11px] uppercase mb-2">Payload Enviado (POST)</p>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto max-h-40">{JSON.stringify(testResult.log.payload, null, 2)}</pre>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <p className="text-emerald-400 font-sans font-bold text-[11px] uppercase mb-2">Resposta do Sistema Externo</p>
                  <pre className="text-[11px] text-slate-300 overflow-x-auto max-h-40">{testResult.log.responseBody}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Webhooks List */}
          {tenantWebhooks.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 border border-slate-200 dark:border-slate-800 text-center space-y-4">
              <Webhook className="h-12 w-12 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Nenhum Webhook Configurado para {tenant.name}</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Adicione um endpoint HTTP para receber notificações em tempo real sobre licenças a vencer ou não-conformidades críticas no SAP S/4HANA ou Oracle.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Cadastrar Primeiro Webhook
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {tenantWebhooks.map((wh) => {
                const presetInfo = ERP_PRESETS.find(p => p.system === wh.targetSystem) || ERP_PRESETS[3];
                return (
                  <div
                    key={wh.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all space-y-5"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-150 dark:border-slate-800">
                      <div className="flex items-start space-x-3">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${presetInfo.color} text-white font-black text-xs uppercase tracking-widest shadow-md shrink-0`}>
                          {presetInfo.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">{wh.name}</h3>
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              wh.active 
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800" 
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            }`}>
                              {wh.active ? "Ativo" : "Inativo"}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-1 truncate">
                            <Globe className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                            <span className="truncate">{wh.url}</span>
                          </p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTriggerTest(wh.id, "condition.overdue")}
                          disabled={testingId === wh.id}
                          className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-all disabled:opacity-50"
                        >
                          <Send className={`h-3.5 w-3.5 ${testingId === wh.id ? "animate-spin text-emerald-500" : ""}`} />
                          <span>{testingId === wh.id ? "Testando..." : "Disparar Teste ERP"}</span>
                        </button>

                        <button
                          onClick={() => onUpdateWebhook(wh.id, { active: !wh.active })}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          {wh.active ? "Pausar" : "Ativar"}
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja remover o webhook "${wh.name}"?`)) {
                              onDeleteWebhook(wh.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                          title="Excluir Webhook"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Events Badges Grid */}
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Eventos Assinados ({wh.events.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {wh.events.map((ev) => (
                          <span
                            key={ev}
                            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span>{EVENT_LABELS[ev]?.label || ev}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Metadata Details Bar */}
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Chave de Assinatura HMAC</span>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <code className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-800 font-mono text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                            {wh.secret}
                          </code>
                          <button
                            onClick={() => handleCopySecret(wh.secret)}
                            className="p-1 text-slate-500 hover:text-emerald-600 cursor-pointer"
                            title="Copiar Secret"
                          >
                            {copiedKey === wh.secret ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Último Disparo</span>
                        <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                          {wh.lastTriggeredAt ? new Date(wh.lastTriggeredAt).toLocaleString("pt-BR") : "Nunca disparado"}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold block text-[10px] uppercase">Última Resposta HTTP</span>
                        <div className="flex items-center space-x-1 mt-0.5">
                          <span className={`font-bold ${wh.lastResponseStatus === 200 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                            {wh.lastResponseStatus ? `${wh.lastResponseStatus} OK` : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTÓRICO DE LOGS */}
      {subTab === "logs" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-150 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Audit Log de Entregas do Webhook</h2>
            </div>
            <span className="text-xs text-slate-500 font-semibold">{tenantLogs.length} registros capturados</span>
          </div>

          {tenantLogs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">Nenhum log registrado para este tenant.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    <th className="py-3 px-3">Data/Hora</th>
                    <th className="py-3 px-3">Sistema / Webhook</th>
                    <th className="py-3 px-3">Evento</th>
                    <th className="py-3 px-3">Status HTTP</th>
                    <th className="py-3 px-3">Latência</th>
                    <th className="py-3 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-xs">
                  {tenantLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                        {log.webhookName}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono text-[11px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                          {log.event}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          log.statusCode >= 200 && log.statusCode < 300 
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                        }`}>
                          {log.statusCode} {log.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-500">
                        {log.durationMs} ms
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Ver Payload
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Log Detail Modal */}
          {selectedLog && (
            <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-white space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-base">Detalhes da Transmissão {selectedLog.id}</h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Fechar
                  </button>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-emerald-400 uppercase font-sans font-bold text-[10px]">URL Receptor</span>
                    <p className="bg-slate-950 p-2 rounded text-slate-300 truncate">{selectedLog.targetUrl}</p>
                  </div>

                  <div>
                    <span className="text-emerald-400 uppercase font-sans font-bold text-[10px]">Payload JSON Transmitido</span>
                    <pre className="bg-slate-950 p-3 rounded text-slate-300 overflow-x-auto max-h-48 text-[11px]">{JSON.stringify(selectedLog.payload, null, 2)}</pre>
                  </div>

                  <div>
                    <span className="text-emerald-400 uppercase font-sans font-bold text-[10px]">Resposta do ERP Receptor</span>
                    <pre className="bg-slate-950 p-3 rounded text-slate-300 overflow-x-auto max-h-36 text-[11px]">{selectedLog.responseBody}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DOCUMENTAÇÃO & JSON SCHEMA */}
      {subTab === "docs" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 pb-4 border-b border-slate-150 dark:border-slate-800">
            <FileCode className="h-5 w-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Especificação Técnica de Integração REST / Webhooks</h2>
          </div>

          <div className="prose dark:prose-invert max-w-none text-xs space-y-4 text-slate-600 dark:text-slate-300">
            <p>
              Os Webhooks do <strong>NexaAmbient Enterprise</strong> enviam notificações via HTTP POST no formato <code>application/json</code> com cabeçalhos de segurança padrão HMAC-SHA256 para validar a autenticidade dos dados no seu ERP.
            </p>

            <div className="bg-slate-900 p-4 rounded-2xl text-slate-200 font-mono text-[11px] space-y-2 border border-slate-800">
              <p className="text-emerald-400 font-bold font-sans">Exemplo de Cabeçalhos HTTP Enviados:</p>
              <pre className="text-emerald-300">{`POST /sap/bc/rest/ehs/webhook HTTP/1.1
Host: sap-gateway.suaempresa.com
Content-Type: application/json
X-Nexa-Signature: sha256=7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
X-Nexa-Event: condition.overdue`}</pre>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl text-slate-200 font-mono text-[11px] space-y-2 border border-slate-800">
              <p className="text-emerald-400 font-bold font-sans">Exemplo de Payload JSON (Alerta Crítico de Condicionante Vencida):</p>
              <pre className="text-slate-300">{`{
  "event": "condition.overdue",
  "webhookId": "wh-1",
  "system": "NexaAmbient Enterprise Suite",
  "tenant": {
    "id": "tenant-1",
    "name": "PetroNexa S.A.",
    "cnpj": "12.345.678/0001-90"
  },
  "sampleData": {
    "licenseNumber": "LO Nº 1450/2023",
    "conditionId": "cond-1-1",
    "description": "ALERTA DE SEGURANÇA AMBIENTAL: Monitoramento quinzenal de hidrocarbonetos pendente.",
    "severity": "CRITICAL",
    "dueDate": "2026-08-15"
  },
  "triggeredAt": "2026-07-21T10:15:00.000Z"
}`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOVO WEBHOOK ERP */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Webhook className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Cadastrar Novo Webhook de Integração</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                Fechar
              </button>
            </div>

            {/* Presets Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Selecione o Modelo de Sistema ERP Receptor:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ERP_PRESETS.map((preset) => (
                  <button
                    key={preset.system}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      formTargetSystem === preset.system
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <div className="text-[10px] font-black uppercase text-emerald-600 mb-1">{preset.icon}</div>
                    <p className="text-xs font-bold truncate">{preset.name.split(" ")[0]}</p>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateWebhook} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Integração / Módulo:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: SAP S/4HANA EHS Module - Produção"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  URL Endpoint do Receptor (HTTP POST):
                </label>
                <input
                  type="url"
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  placeholder="https://sua-api-erp.com/webhooks/environmental"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Eventos para Notificar no ERP:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {Object.entries(EVENT_LABELS).map(([key, info]) => {
                    const isChecked = formEvents.includes(key as WebhookEvent);
                    return (
                      <label key={key} className="flex items-start space-x-2 cursor-pointer p-1.5 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEvent(key as WebhookEvent)}
                          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{info.label}</span>
                          <span className="text-[10px] text-slate-500 block">{info.desc}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cabeçalhos HTTP Personalizados (JSON):
                </label>
                <textarea
                  rows={3}
                  value={formHeadersText}
                  onChange={(e) => setFormHeadersText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-4 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDbUpdating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  Salvar Webhook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
