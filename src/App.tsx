/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import DashboardESG from "./components/DashboardESG";
import LicensingTab from "./components/LicensingTab";
import MonitoringTab from "./components/MonitoringTab";
import GISTab from "./components/GISTab";
import FieldAppSimulator from "./components/FieldAppSimulator";
import ComplianceTab from "./components/ComplianceTab";
import AIAssistantTab from "./components/AIAssistantTab";
import DocumentsTab from "./components/DocumentsTab";
import ReportsTab from "./components/ReportsTab";
import IntegrationsTab from "./components/IntegrationsTab";
import AccessDenied from "./components/AccessDenied";
import SettingsModal from "./components/SettingsModal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { 
  Tenant, 
  TechnicalResponsible, 
  EnvironmentalLicense, 
  MonitoringParam, 
  LabCustody, 
  EsgKpi, 
  RiskMatrixItem, 
  EnvironmentalAudit, 
  FieldInspectionReport, 
  CorporateDocument,
  DBState
} from "./types";
import { RefreshCw, ShieldAlert, Cpu, Menu, ShieldCheck } from "lucide-react";

function AppContent() {
  const { hasPermission } = useAuth();

  // Global domain state loading
  const [dbState, setDbState] = useState<DBState | null>(null);
  const [activeTenantId, setActiveTenantId] = useState<string>("tenant-1");
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isDbUpdating, setIsDbUpdating] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);


  // Load database state from full-stack Express service
  const fetchDB = async () => {
    try {
      const res = await fetch("/api/db");
      const data = await res.json();
      setDbState(data);
    } catch (err) {
      console.error("Failed to load NexaAmbient Database State:", err);
      setErrorMsg("Erro ao conectar ao banco de dados NexaAmbient.");
    } finally {
      setIsFetchingInitial(false);
    }
  };

  useEffect(() => {
    fetchDB();
  }, []);

  // Database actions synchronizers
  const handleResetDatabase = async () => {
    setIsDbUpdating(true);
    try {
      const res = await fetch("/api/db/reset", { method: "POST" });
      const data = await res.json();
      setDbState(data.db);
      alert("Banco de dados corporativo resetado para as sementes padrões com sucesso!");
    } catch (err) {
      alert("Falha ao resetar banco.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleAddLicense = async (licenseData: any) => {
    setIsDbUpdating(true);
    try {
      const res = await fetch("/api/licenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(licenseData)
      });
      if (res.ok) {
        await fetchDB();
      }
    } catch (err) {
      alert("Erro ao salvar licença ambiental.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleAddCondition = async (licenseId: string, conditionData: any) => {
    setIsDbUpdating(true);
    try {
      const res = await fetch(`/api/licenses/${licenseId}/conditions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(conditionData)
      });
      if (res.ok) {
        await fetchDB();
      }
    } catch (err) {
      alert("Erro ao registrar condicionante.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleFulfillCondition = async (conditionId: string, evidenceName: string) => {
    setIsDbUpdating(true);
    try {
      const res = await fetch(`/api/conditions/${conditionId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidenceName })
      });
      if (res.ok) {
        await fetchDB();
      }
    } catch (err) {
      alert("Erro ao anexar evidência ambiental.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleAddMonitoringLog = async (logData: any) => {
    setIsDbUpdating(true);
    try {
      const res = await fetch("/api/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(logData)
      });
      if (res.ok) {
        await fetchDB();
      }
    } catch (err) {
      alert("Erro ao registrar telemetria.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleAddDocument = async (docData: any) => {
    setIsDbUpdating(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData)
      });
      if (res.ok) {
        await fetchDB();
      }
    } catch (err) {
      alert("Erro ao gerar minuta do documento.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleUpdateDocument = async (docId: string, docData: any) => {
    setIsDbUpdating(true);
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docData)
      });
      if (res.ok) {
        await fetchDB();
        alert("Documento atualizado com sucesso!");
      }
    } catch (err) {
      alert("Erro ao atualizar documento.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleSignDocumentStep = async (docId: string, role: string, user: string, cryptoData?: { signature?: string; publicKeyFingerprint?: string }) => {
    setIsDbUpdating(true);
    try {
      const res = await fetch(`/api/documents/${docId}/workflow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: true, ...cryptoData })
      });
      if (res.ok) {
        await fetchDB();
      }
    } catch (err) {
      alert("Erro ao processar assinatura ICP-Brasil.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleCreateFieldReport = async (reportData: any) => {
    setIsDbUpdating(true);
    try {
      const res = await fetch("/api/field-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reportData)
      });
      if (res.ok) {
        await fetchDB();
      }
    } catch (err) {
      alert("Erro ao transmitir relatório de conformidade.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleAddActionPlan = async (auditId: string, planData: any) => {
    setIsDbUpdating(true);
    try {
      const res = await fetch(`/api/audits/${auditId}/action-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planData)
      });
      if (res.ok) {
        await fetchDB();
      }
    } catch (err) {
      alert("Erro ao cadastrar plano de ação corretivo.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleUpdateActionPlanStatus = async (auditId: string, planId: string, status: "NotStarted" | "InProgress" | "Done") => {
    setIsDbUpdating(true);
    try {
      const res = await fetch(`/api/audits/${auditId}/plans/${planId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await fetchDB();
      }
    } catch (err) {
      alert("Erro ao atualizar status do plano mitigador.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleAddWebhook = async (webhookData: any) => {
    setIsDbUpdating(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookData)
      });
      if (res.ok) {
        await fetchDB();
      }
    } catch (err) {
      alert("Erro ao cadastrar Webhook ERP.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleUpdateWebhook = async (id: string, webhookData: any) => {
    setIsDbUpdating(true);
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookData)
      });
      if (res.ok) {
        await fetchDB();
      }
    } catch (err) {
      alert("Erro ao atualizar Webhook.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    setIsDbUpdating(true);
    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await fetchDB();
      }
    } catch (err) {
      alert("Erro ao remover Webhook.");
    } finally {
      setIsDbUpdating(false);
    }
  };

  const handleTestWebhook = async (id: string, event: any) => {
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event })
      });
      const data = await res.json();
      await fetchDB();
      return data;
    } catch (err) {
      console.error("Test webhook failed:", err);
      throw err;
    }
  };

  // Safe checks for empty DB
  if (isFetchingInitial) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 space-y-4" id="app-loading-screen">
        <Cpu className="h-10 w-10 text-emerald-500 animate-spin" />
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Iniciando Servidor NexaAmbient Enterprise...</p>
      </div>
    );
  }

  if (errorMsg || !dbState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-red-400 p-6 text-center space-y-4" id="app-error-screen">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h2 className="text-lg font-bold">Erro de Conectividade</h2>
        <p className="text-xs text-slate-500 max-w-md">{errorMsg || "Não foi possível estruturar o estado corporativo."}</p>
        <button
          onClick={fetchDB}
          className="bg-red-950/40 border border-red-900/60 text-red-400 text-xs px-4 py-2 rounded-xl flex items-center space-x-1.5 hover:bg-red-900/20"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Tentar Reconectar</span>
        </button>
      </div>
    );
  }

  // Active Context computation
  const activeTenant = dbState.tenants.find((t) => t.id === activeTenantId) || dbState.tenants[0];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased" id="nexa-applet-root">
      
      {/* Mobile Top Navbar Header */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="bg-emerald-600 text-white p-2 rounded-lg flex items-center justify-center shadow-md shadow-emerald-600/10">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white uppercase tracking-wider">
            NexaAmbient
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
          title="Abrir Menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>
      
      {/* Navigation Sidebar */}
      <Sidebar
        tenants={dbState.tenants}
        selectedTenantId={activeTenantId}
        onSelectTenant={setActiveTenantId}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        darkMode={darkMode}
        onToggleDarkMode={() => {
          const nextMode = !darkMode;
          setDarkMode(nextMode);
          if (nextMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }}
        onResetDb={handleResetDatabase}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main viewport fluid panel */}
      <main className="flex-1 overflow-y-auto" id="nexa-main-viewport">
        
        {/* Dynamic tabs controller */}
        {activeTab === "dashboard" && (
          <DashboardESG
            tenant={activeTenant}
            esgKpis={dbState.esgKpis}
            licenses={dbState.licenses}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "licensing" && (
          <LicensingTab
            tenant={activeTenant}
            licenses={dbState.licenses}
            responsibles={dbState.responsibles}
            onAddLicense={handleAddLicense}
            onAddCondition={handleAddCondition}
            onFulfillCondition={handleFulfillCondition}
            isDbUpdating={isDbUpdating}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "monitoring" && (
          <MonitoringTab
            tenant={activeTenant}
            params={dbState.monitoringParams}
            labCustodies={dbState.labCustodies}
            onAddMonitoringLog={handleAddMonitoringLog}
            isDbUpdating={isDbUpdating}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "gis" && (
          <GISTab
            tenant={activeTenant}
            params={dbState.monitoringParams}
          />
        )}

        {activeTab === "field" && (
          <FieldAppSimulator
            tenant={activeTenant}
            onSubmitReport={handleCreateFieldReport}
            reports={dbState.fieldReports}
          />
        )}

        {activeTab === "compliance" && (
          hasPermission("compliance") ? (
            <ComplianceTab
              tenant={activeTenant}
              audits={dbState.audits}
              risks={dbState.risks}
              onAddActionPlan={handleAddActionPlan}
              onUpdateActionPlanStatus={handleUpdateActionPlanStatus}
              isDbUpdating={isDbUpdating}
            />
          ) : (
            <AccessDenied
              tabName="Auditorias & Compliance"
              requiredRoles={["Administrador", "Auditor"]}
            />
          )
        )}

        {activeTab === "assistant" && (
          <AIAssistantTab
            tenant={activeTenant}
            onAddDocument={handleAddDocument}
            isDbUpdating={isDbUpdating}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === "documents" && (
          <DocumentsTab
            tenant={activeTenant}
            documents={dbState.documents}
            onAddDocument={handleAddDocument}
            onUpdateDocument={handleUpdateDocument}
            onSignDocumentStep={handleSignDocumentStep}
            isDbUpdating={isDbUpdating}
          />
        )}

        {activeTab === "reports" && (
          <ReportsTab
            tenant={activeTenant}
            licenses={dbState.licenses}
            monitoringParams={dbState.monitoringParams}
            esgKpis={dbState.esgKpis}
          />
        )}

        {activeTab === "integrations" && (
          hasPermission("integrations") ? (
            <IntegrationsTab
              tenant={activeTenant}
              webhooks={dbState.webhooks || []}
              webhookLogs={dbState.webhookLogs || []}
              onAddWebhook={handleAddWebhook}
              onUpdateWebhook={handleUpdateWebhook}
              onDeleteWebhook={handleDeleteWebhook}
              onTestWebhook={handleTestWebhook}
              isDbUpdating={isDbUpdating}
            />
          ) : (
            <AccessDenied
              tabName="Integrações & Webhooks ERP"
              requiredRoles={["Administrador"]}
            />
          )
        )}

      </main>

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        darkMode={darkMode}
        onToggleDarkMode={() => {
          const nextMode = !darkMode;
          setDarkMode(nextMode);
          if (nextMode) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }}
        onResetDb={handleResetDatabase}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

