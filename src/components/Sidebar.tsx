/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Building2, 
  ShieldCheck, 
  Map, 
  FileSpreadsheet, 
  Compass, 
  ClipboardCheck, 
  Bot, 
  FolderLock, 
  Settings, 
  Users,
  Moon,
  Sun,
  Activity,
  LogOut,
  X,
  Printer,
  Webhook,
  Lock,
  UserCheck,
  ChevronDown
} from "lucide-react";
import { Tenant } from "../types";
import { useAuth, DEMO_USERS } from "../context/AuthContext";

interface SidebarProps {
  tenants: Tenant[];
  selectedTenantId: string;
  onSelectTenant: (id: string) => void;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onResetDb: () => void;
  onOpenSettings?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  tenants,
  selectedTenantId,
  onSelectTenant,
  activeTab,
  onChangeTab,
  darkMode,
  onToggleDarkMode,
  onResetDb,
  onOpenSettings,
  isOpen = false,
  onClose
}: SidebarProps) {
  const { currentUser, switchUser, hasPermission, getRoleBadgeColor } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const activeTenant = tenants.find(t => t.id === selectedTenantId) || tenants[0];

  const menuItems = [
    { id: "dashboard", label: "Dashboard & ESG", icon: Activity },
    { id: "licensing", label: "Licenciamento & IA", icon: ShieldCheck },
    { id: "monitoring", label: "Monitoramento & Labs", icon: FileSpreadsheet },
    { id: "gis", label: "GIS Corporativo", icon: Map },
    { id: "field", label: "Aplicativo de Campo", icon: Compass },
    { id: "compliance", label: "Auditorias & Compliance", icon: ClipboardCheck },
    { id: "documents", label: "Documentos & Workflow", icon: FolderLock },
    { id: "reports", label: "Relatórios & Exportação", icon: Printer },
    { id: "integrations", label: "Integrações & Webhooks", icon: Webhook },
    { id: "assistant", label: "Assistente NexaBot IA", icon: Bot },
  ];


  return (
    <>
      {/* Backdrop overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside 
        id="nexa-sidebar" 
        className={`fixed inset-y-0 left-0 z-50 lg:z-0 w-80 lg:static lg:flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Branding Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-600 text-white p-2.5 rounded-lg flex items-center justify-center shadow-md shadow-emerald-600/10">
              <ShieldCheck className="h-6 w-6" id="nexa-logo-icon" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                NexaGreen
              </h1>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
                Enterprise Suite
              </span>
            </div>
          </div>

          {/* Botão de Fechar no Mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors"
              title="Fechar Menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

      {/* Multi-Tenant Switcher */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          Organização / Tenant Ativo
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <select
            id="tenant-select"
            value={selectedTenantId}
            onChange={(e) => onSelectTenant(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        {activeTenant && (
          <div className="mt-3 flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-450">
            <span className="font-semibold text-slate-700 dark:text-slate-300">CNPJ:</span>
            <span>{activeTenant.cnpj}</span>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-2">
          Módulos Integrados
        </span>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const permitted = hasPermission(item.id);

          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              onClick={() => {
                onChangeTab(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-l-4 border-emerald-600 rounded-l-none"
                  : permitted
                  ? "text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-200"
                  : "text-slate-400 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-emerald-600 dark:text-emerald-400" : permitted ? "text-slate-450" : "text-slate-300 dark:text-slate-700"}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {!permitted && (
                <Lock className="h-3.5 w-3.5 text-amber-500/80 shrink-0" title="Acesso Restrito ao cargo" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Info & Settings Footer (RBAC User Selector) */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Usuário & Cargo RBAC</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${getRoleBadgeColor(currentUser.role)}`}>
            {currentUser.role}
          </span>
        </div>

        {/* User Card with Role Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl flex items-center justify-between hover:border-emerald-500 transition-all text-left cursor-pointer shadow-sm"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0">
                {currentUser.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  {currentUser.title}
                </p>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          {/* Role Switcher Menu */}
          {showRoleMenu && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl z-50 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                Simular Perfil / Cargo:
              </p>
              {DEMO_USERS.map((usr) => (
                <button
                  key={usr.id}
                  onClick={() => {
                    switchUser(usr.id);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-between ${
                    usr.id === currentUser.id
                      ? "bg-emerald-50 dark:bg-emerald-950/60 font-bold text-emerald-900 dark:text-emerald-200"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-bold truncate">{usr.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{usr.title}</p>
                  </div>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(usr.role)} shrink-0 ml-1`}>
                    {usr.role}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between space-x-2 pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800">
          <button
            id="theme-toggle"
            onClick={onToggleDarkMode}
            title="Alternar Tema"
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors flex items-center space-x-1 text-xs cursor-pointer"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{darkMode ? "Claro" : "Escuro"}</span>
          </button>

          <button
            onClick={() => {
              if (onOpenSettings) {
                onOpenSettings();
              } else {
                alert("Central de Configurações do Sistema NexaAmbient.");
              }
            }}
            title="Configurações do Sistema"
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-lg transition-colors flex items-center space-x-1 text-xs cursor-pointer"
          >
            <Settings className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Configurações</span>
          </button>

          <button
            id="reset-db-btn"
            onClick={onResetDb}
            title="Resetar Banco de Dados"
            className="text-[10px] text-slate-500 hover:text-red-500 dark:text-slate-450 dark:hover:text-red-400 px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-850 rounded-md transition-colors font-medium cursor-pointer"
          >
            Resetar DB
          </button>
        </div>
      </div>

    </aside>
    </>
  );
}
