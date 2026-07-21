/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  X, 
  User, 
  ShieldCheck, 
  Key, 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Database, 
  Cpu, 
  Check, 
  HelpCircle, 
  ExternalLink,
  Lock,
  Layers,
  Download,
  Upload,
  Clock,
  RefreshCw,
  FileJson,
  Save,
  HardDrive,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { useAuth, DEMO_USERS } from "../context/AuthContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onResetDb: () => void;
}

interface BackupItem {
  filename: string;
  sizeBytes: number;
  mtime: string;
  meta?: {
    appName?: string;
    version?: string;
    timestamp?: string;
    reason?: string;
    tenantsCount?: number;
    licensesCount?: number;
  };
}

export default function SettingsModal({
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode,
  onResetDb
}: SettingsModalProps) {
  const { currentUser, switchUser, getRoleBadgeColor } = useAuth();
  const [activeTab, setActiveTab] = useState<"general" | "rbac" | "api" | "backup" | "aistudio">("general");

  // Local Settings States
  const [language, setLanguage] = useState("pt-BR");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Backup Engine States
  const [backupsList, setBackupsList] = useState<BackupItem[]>([]);
  const [lastAutoBackup, setLastAutoBackup] = useState<string | null>(null);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === "backup") {
      fetchBackups();
    }
  }, [isOpen, activeTab]);

  const fetchBackups = async () => {
    setIsBackupLoading(true);
    try {
      const res = await fetch("/api/db/backups");
      if (res.ok) {
        const data = await res.json();
        setBackupsList(data.backups || []);
        setLastAutoBackup(data.lastAutoBackupTimestamp || null);
      }
    } catch (err) {
      console.error("Erro ao listar backups:", err);
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleExportJson = () => {
    window.open("/api/db/export", "_blank");
    setBackupFeedback({ type: "success", text: "Download do arquivo de backup JSON iniciado com sucesso!" });
    setTimeout(() => setBackupFeedback(null), 4000);
  };

  const handleTriggerManualBackup = async () => {
    setIsBackupLoading(true);
    try {
      const res = await fetch("/api/db/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Snapshot Manual Solicitado na Interface" }),
      });
      if (res.ok) {
        setBackupFeedback({ type: "success", text: "Novo snapshot de backup criado e armazenado no servidor!" });
        await fetchBackups();
      } else {
        setBackupFeedback({ type: "error", text: "Erro ao gerar backup no servidor." });
      }
    } catch (err) {
      setBackupFeedback({ type: "error", text: "Erro de conexão ao solicitar backup." });
    } finally {
      setIsBackupLoading(false);
      setTimeout(() => setBackupFeedback(null), 4000);
    }
  };

  const handleRestoreJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm(`Deseja restaurar o banco de dados a partir do arquivo "${file.name}"? Esta ação atualizará o estado atual.`)) {
      e.target.value = "";
      return;
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const dbPayload = parsed.db || parsed;

      const res = await fetch("/api/db/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });

      if (res.ok) {
        setBackupFeedback({ type: "success", text: "Banco de dados restaurado com sucesso! Recarregando os dados..." });
        await fetchBackups();
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        const errData = await res.json();
        setBackupFeedback({ type: "error", text: errData.error || "Erro ao processar arquivo de restauração." });
      }
    } catch (err) {
      setBackupFeedback({ type: "error", text: "Arquivo JSON inválido ou corrompido." });
    } finally {
      e.target.value = "";
      setTimeout(() => setBackupFeedback(null), 4000);
    }
  };

  if (!isOpen) return null;

  const handleSaveSettings = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Configurações do Sistema NexaAmbient
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gerencie preferências do usuário, controle RBAC, APIs e parâmetros da plataforma
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === "general"
                ? "bg-slate-900 dark:bg-emerald-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <User className="h-4 w-4" />
            <span>Geral & Aparência</span>
          </button>

          <button
            onClick={() => setActiveTab("rbac")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === "rbac"
                ? "bg-slate-900 dark:bg-emerald-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Perfil & Acesso RBAC</span>
          </button>

          <button
            onClick={() => setActiveTab("api")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === "api"
                ? "bg-slate-900 dark:bg-emerald-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Key className="h-4 w-4" />
            <span>Chaves de API & Servidor</span>
          </button>

          <button
            onClick={() => setActiveTab("backup")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === "backup"
                ? "bg-slate-900 dark:bg-emerald-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <HardDrive className="h-4 w-4 text-emerald-500" />
            <span>Backup & Banco de Dados</span>
          </button>

          <button
            onClick={() => setActiveTab("aistudio")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 whitespace-nowrap cursor-pointer ${
              activeTab === "aistudio"
                ? "bg-slate-900 dark:bg-emerald-600 text-white shadow"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <HelpCircle className="h-4 w-4 text-emerald-400" />
            <span>Menu AI Studio (Dúvidas)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {savedSuccess && (
            <div className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-800 flex items-center space-x-2 font-bold animate-fadeIn">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Configurações salvas com sucesso!</span>
            </div>
          )}

          {/* TAB 1: GERAL E APARÊNCIA */}
          {activeTab === "general" && (
            <div className="space-y-6">
              
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-slate-200 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
                    {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">Tema Visual da Interface</h4>
                    <p className="text-slate-500 dark:text-slate-400">
                      Alterne entre o tema Claro com alto contraste e o tema Escuro adaptado para uso noturno.
                    </p>
                  </div>
                </div>

                <button
                  onClick={onToggleDarkMode}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  {darkMode ? "Mudar para Claro" : "Mudar para Escuro"}
                </button>
              </div>

              {/* Language Selection */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                  Idioma do Sistema
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { code: "pt-BR", name: "Português (Brasil)", flag: "🇧🇷" },
                    { code: "en-US", name: "English (US)", flag: "🇺🇸" },
                    { code: "es-ES", name: "Español", flag: "🇪🇸" }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center space-x-2 ${
                        language === lang.code
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold"
                          : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span className="font-semibold">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                  Canais de Notificação & Alertas Ambientais
                </h4>

                <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Alertas por E-mail</span>
                      <span className="text-slate-500 block">Enviar avisos de condicionantes 60 e 30 dias antes do vencimento.</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <Bell className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">Notificações Push / Webhooks</span>
                      <span className="text-slate-500 block">Disparar requisição para os ERPs em eventos críticos de telemetria.</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={pushAlerts}
                    onChange={(e) => setPushAlerts(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                </label>
              </div>

            </div>
          )}

          {/* TAB 2: RBAC */}
          {activeTab === "rbac" && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Usuário Ativo</span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">{currentUser.name}</h3>
                    <p className="text-slate-500">{currentUser.email} • {currentUser.department}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full font-extrabold border ${getRoleBadgeColor(currentUser.role)}`}>
                    {currentUser.role}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                  Simular Outro Perfil para Testar RBAC:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DEMO_USERS.map((usr) => (
                    <button
                      key={usr.id}
                      onClick={() => switchUser(usr.id)}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        usr.id === currentUser.id
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 font-bold"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${getRoleBadgeColor(usr.role)} block w-max mb-2`}>
                        {usr.role}
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white">{usr.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{usr.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKUP & RESILIÊNCIA */}
          {activeTab === "backup" && (
            <div className="space-y-6">
              
              {/* Routine Banner */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                      <Clock className="h-5 w-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Rotina Periódica de Backup Automático</h3>
                      <p className="text-[11px] text-slate-400">Snapshot preventivo a cada 30 minutos em diretório isolado do servidor</p>
                    </div>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-bold font-mono text-[10px] flex items-center space-x-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>MOTOR ATIVO</span>
                  </span>
                </div>

                {lastAutoBackup && (
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Último snapshot registrado:</span>
                    <span className="font-mono text-emerald-400 font-semibold">{new Date(lastAutoBackup).toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>

              {backupFeedback && (
                <div className={`p-3.5 rounded-2xl border font-semibold text-xs flex items-center space-x-2.5 ${
                  backupFeedback.type === "success" 
                    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" 
                    : "bg-red-50 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800"
                }`}>
                  {backupFeedback.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                  )}
                  <span>{backupFeedback.text}</span>
                </div>
              )}

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/60 rounded-2xl text-left transition-all group cursor-pointer space-y-2"
                >
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit group-hover:scale-105 transition-transform">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Exportar JSON Seguro</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Baixar cópia do DBState completo para arquivo local</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleTriggerManualBackup}
                  disabled={isBackupLoading}
                  className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/60 rounded-2xl text-left transition-all group cursor-pointer space-y-2 disabled:opacity-50"
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl w-fit group-hover:scale-105 transition-transform">
                    <Save className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Snapshot Manual</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Gerar cópia imediata no servidor sem aguardar ciclo</p>
                  </div>
                </button>

                <label className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/60 rounded-2xl text-left transition-all group cursor-pointer space-y-2 block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleRestoreJsonFile}
                    className="hidden"
                  />
                  <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl w-fit group-hover:scale-105 transition-transform">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">Restaurar JSON</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Carregar e restaurar o estado a partir de um backup</p>
                  </div>
                </label>
              </div>

              {/* Backups List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                    <Database className="h-4 w-4 text-emerald-500" />
                    <span>Snapshots Salvos no Servidor ({backupsList.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={fetchBackups}
                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
                    title="Atualizar Lista"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isBackupLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 max-h-48 overflow-y-auto">
                  {backupsList.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs">
                      Nenhum backup encontrado no repositório local.
                    </div>
                  ) : (
                    backupsList.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-slate-900/50 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <div className="flex items-center space-x-3">
                          <FileJson className="h-4 w-4 text-emerald-500 shrink-0" />
                          <div>
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px] block">{item.filename}</span>
                            <span className="text-[10px] text-slate-400 font-sans block">
                              {item.meta?.reason || "Backup do Sistema"} • {new Date(item.mtime).toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                            {(item.sizeBytes / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: DUVIDAS AI STUDIO SETTINGS */}
          {activeTab === "aistudio" && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 p-4 rounded-2xl text-blue-900 dark:text-blue-200 space-y-2">
                <h4 className="font-bold text-sm flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span>Procurando o Menu "Settings" do Google AI Studio?</span>
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  Se você está procurando o menu de configurações da própria plataforma <strong>Google AI Studio</strong> (para configurar chaves de API globais, exportar código para o GitHub ou baixar o repositório em ZIP):
                </p>
              </div>

              <div className="bg-slate-900 text-slate-200 p-5 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
                <p className="text-emerald-400 font-bold uppercase font-sans">Onde Encontrar no Ambiente:</p>
                <ol className="list-decimal list-inside space-y-2 text-slate-300 font-sans">
                  <li>
                    Olhe para o <strong>cabeçalho superior da plataforma AI Studio</strong> (fora desta janela do aplicativo).
                  </li>
                  <li>
                    No canto superior direito, clique no ícone de <strong>Engrenagem / Menu Settings</strong> da plataforma.
                  </li>
                  <li>
                    Lá você poderá gerenciar as <strong>API Keys</strong> e realizar a <strong>Exportação no GitHub</strong>.
                  </li>
                </ol>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 font-semibold">
            NexaGreen Enterprise v3.0 • Gestão Ambiental Corporativa
          </p>
          <button
            onClick={handleSaveSettings}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            Salvar Alterações
          </button>
        </div>

      </div>
    </div>
  );
}
