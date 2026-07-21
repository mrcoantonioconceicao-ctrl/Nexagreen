/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
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
  Layers
} from "lucide-react";
import { useAuth, DEMO_USERS } from "../context/AuthContext";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onResetDb: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  darkMode,
  onToggleDarkMode,
  onResetDb
}: SettingsModalProps) {
  const { currentUser, switchUser, getRoleBadgeColor } = useAuth();
  const [activeTab, setActiveTab] = useState<"general" | "rbac" | "api" | "aistudio">("general");

  // Local Settings States
  const [language, setLanguage] = useState("pt-BR");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

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

          {/* TAB 3: API & SERVIDOR */}
          {activeTab === "api" && (
            <div className="space-y-6">
              
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-emerald-400 font-bold font-mono text-[11px] uppercase">Servidor Express Backend</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/40">
                    HTTP 200 OK
                  </span>
                </div>
                <p className="text-slate-300 text-xs">
                  O aplicativo está rodando com um servidor backend TypeScript unificado na porta 3000 simulando o barramento de dados e conectores de ERPs.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  Integração com Inteligência Artificial Gemini API:
                </span>
                <p className="text-slate-500 text-xs">
                  A chave de API do Gemini (<code>GEMINI_API_KEY</code>) é gerenciada em ambiente seguro no servidor.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-slate-500 text-xs">Reiniciar dados padrão do sistema:</span>
                <button
                  onClick={() => {
                    if (confirm("Resetar todo o banco de dados simulado para o estado inicial?")) {
                      onResetDb();
                      onClose();
                    }
                  }}
                  className="bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800 px-3.5 py-2 rounded-xl font-bold cursor-pointer transition-all"
                >
                  Resetar Banco de Dados
                </button>
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
            NexaAmbient Enterprise v2.4 • Porto de Tubarão & Bacia de Santos
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
