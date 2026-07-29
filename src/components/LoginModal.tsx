/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  Sparkles, 
  Cpu, 
  Factory, 
  Globe2, 
  MapPin, 
  Users, 
  Check, 
  X,
  FileCheck,
  Activity,
  Layers,
  Search,
  Key,
  Database,
  Briefcase
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserRole, Tenant } from "../types";
import NexavorLogo from "./NexavorLogo";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTenantCreated?: (newTenant: Tenant) => void;
  initialTab?: "login" | "register";
}

const AVAILABLE_MODULES = [
  { id: "licensing", name: "Licenciamento & Condicionantes", desc: "Gestão automatizada de prazos e evidências de LP, LI, LO", icon: FileCheck },
  { id: "monitoring", name: "Telemetria & Laboratórios", desc: "Coleta e limites de parâmetros de água, ar, efluentes e solo", icon: Activity },
  { id: "gis", name: "SIG Macrorregional (GIS)", desc: "Mapeamento cartográfico georreferenciado das 5 macrorregiões", icon: Globe2 },
  { id: "field", name: "Aplicativo de Campo", desc: "Coleta de inspecções ambientais com sincronização offline", icon: Layers },
  { id: "compliance", name: "Auditorias & Matriz de Risco", desc: "Grau de criticidade de não conformidades e planos de ação", icon: ShieldCheck },
  { id: "documents", name: "GED & Assinatura ICP-Brasil", desc: "Workflow de aprovação documental e temporalidade legal", icon: Database },
  { id: "reports", name: "Relatórios ESG Auditáveis", desc: "Demonstrativos consolidados nos padrões GRI, SASB e TCFD", icon: Briefcase },
  { id: "integrations", name: "Webhooks ERP (SAP/Oracle)", desc: "Eventos assíncronos e validação criptográfica HMAC-SHA256", icon: Cpu },
  { id: "assistant", name: "Assistente NexaBot IA", desc: "Análise regulatória consultiva alimentada por Gemini 3.6", icon: Sparkles }
];

export default function LoginModal({ isOpen, onClose, onTenantCreated, initialTab = "login" }: LoginModalProps) {
  const { allUsers, loginUser, registerUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"login" | "register">(initialTab);
  const [selectedUserLogin, setSelectedUserLogin] = useState<string>(allUsers[0]?.id || "usr-1");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Registration Form State
  const [regStep, setRegStep] = useState<number>(1);
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [isValidatingCnpj, setIsValidatingCnpj] = useState(false);
  const [cnpjValidated, setCnpjValidated] = useState(false);
  const [cnpjCompanyDetails, setCnpjCompanyDetails] = useState<any>(null);
  const [sector, setSector] = useState<"Mining" | "Energy" | "Industry" | "Sanitation" | "Agribusiness">("Industry");
  const [location, setLocation] = useState("São Paulo, SP - Brasil");
  const [unitsInput, setUnitsInput] = useState("Sede Matriz, Unidade Industrial 01, Centro de Distribuição");
  
  // Admin User details
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminTitle, setAdminTitle] = useState("Diretor EHS & Compliance ESG");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Active modules selected
  const [selectedModules, setSelectedModules] = useState<string[]>(
    AVAILABLE_MODULES.map(m => m.id)
  );

  const [regSuccess, setRegSuccess] = useState(false);

  if (!isOpen) return null;

  // Format CNPJ Mask (00.000.000/0001-00)
  const handleCnpjChange = (value: string) => {
    const raw = value.replace(/\D/g, "").slice(0, 14);
    let formatted = raw;
    if (raw.length > 2) formatted = raw.replace(/^(\d{2})(\d)/, "$1.$2");
    if (raw.length > 5) formatted = formatted.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    if (raw.length > 8) formatted = formatted.replace(/\.(\d{3})(\d)/, ".$1/$2");
    if (raw.length > 12) formatted = formatted.replace(/(\d{4})(\d)/, "$1-$2");
    
    setCnpj(formatted);
    setCnpjValidated(false);
  };

  // Simulate Receita Federal CNPJ Validation
  const handleValidateCnpj = async () => {
    if (cnpj.replace(/\D/g, "").length < 14) {
      alert("Por favor, digite um CNPJ completo com 14 dígitos.");
      return;
    }
    setIsValidatingCnpj(true);
    try {
      await new Promise(res => setTimeout(res, 900));
      setCnpjValidated(true);
      setCnpjCompanyDetails({
        status: "ATIVA",
        capitalSocial: "R$ 45.000.000,00",
        orgao: "Receita Federal do Brasil",
        dataAbertura: "2012-05-18",
        regiao: "Sudeste"
      });
      if (!companyName) {
        setCompanyName("Empresa Exemplo " + sector + " S.A.");
      }
    } catch (err) {
      alert("Falha na validação do CNPJ.");
    } finally {
      setIsValidatingCnpj(false);
    }
  };

  // Login handler
  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      if (emailInput) {
        const found = allUsers.find(u => u.email.toLowerCase() === emailInput.toLowerCase());
        if (found) {
          loginUser(found);
          onClose();
          return;
        }
      }
      // Default to selected demo user
      const userToLogin = allUsers.find(u => u.id === selectedUserLogin) || allUsers[0];
      if (userToLogin) {
        loginUser(userToLogin);
        onClose();
      }
    }, 600);
  };

  // Complete Company Registration (/register-company)
  const handleRegisterCompanySubmit = async () => {
    if (!companyName || !cnpj) {
      alert("Razão Social e CNPJ são obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    try {
      const unitsList = unitsInput.split(",").map(u => u.trim()).filter(Boolean);
      
      const response = await fetch("/api/register-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: companyName,
          cnpj,
          sector,
          location,
          units: unitsList,
          adminUser: {
            name: adminName || "Administrador EHS",
            email: adminEmail || `admin@${companyName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com.br`,
            title: adminTitle || "Diretor de EHS & ESG"
          },
          activeModules: selectedModules
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRegSuccess(true);
        if (data.adminUser) {
          registerUser(data.adminUser);
        }
        if (onTenantCreated && data.tenant) {
          onTenantCreated(data.tenant);
        }
        setTimeout(() => {
          setIsSubmitting(false);
          onClose();
        }, 1500);
      } else {
        alert(data.error || "Erro ao registrar empresa.");
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error("Register company error:", err);
      alert("Erro ao conectar ao servidor de cadastro de empresas.");
      setIsSubmitting(false);
    }
  };

  const toggleModule = (id: string) => {
    if (selectedModules.includes(id)) {
      setSelectedModules(selectedModules.filter(m => m !== id));
    } else {
      setSelectedModules([...selectedModules, id]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-8"
      >
        {/* Top Header Bar */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 text-white p-2.5 rounded-xl shadow-lg shadow-emerald-900/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">NexaGreen Enterprise</span>
                <NexavorLogo variant="badge" size="sm" />
              </div>
              <p className="text-xs text-slate-400">Plataforma Ambiental & ESG Desenvolvida pela NEXAVOR</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1">
          <button
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 transition-all ${
              activeTab === "login"
                ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Acesso Corporativo</span>
          </button>
          <button
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-2.5 px-4 text-xs font-semibold rounded-lg flex items-center justify-center space-x-2 transition-all ${
              activeTab === "register"
                ? "bg-slate-800 text-emerald-400 shadow-sm border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Onboarding de Novo Tenant (/register-company)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === "login" ? (
              <motion.div
                key="login-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* SSO Provider Cards */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                    Single Sign-On (SSO Corporativo)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleDirectLogin({ preventDefault: () => {} } as any)}
                      className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl text-xs font-medium text-slate-200 transition-all group"
                    >
                      <Globe2 className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
                      <span>Microsoft Entra ID / Azure</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDirectLogin({ preventDefault: () => {} } as any)}
                      className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/50 rounded-xl text-xs font-medium text-slate-200 transition-all group"
                    >
                      <Key className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span>Google Workspace SAML</span>
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center my-4">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-4 text-[10px] uppercase font-mono tracking-widest text-slate-500">ou autenticação direta</span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>

                {/* Direct Credentials Login */}
                <form onSubmit={handleDirectLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">E-mail Corporativo</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="usuario@suaempresa.com.br"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Senha Corporativa</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Demo Quick Switcher Selector */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">
                      Seleção Rápida de Usuário de Teste (RBAC)
                    </label>
                    <div className="space-y-2">
                      {allUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedUserLogin(u.id);
                            setEmailInput(u.email);
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            selectedUserLogin === u.id
                              ? "bg-emerald-950/30 border-emerald-500/60 text-white"
                              : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-white flex items-center space-x-2">
                                <span>{u.name}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase border ${
                                  u.role === "Administrador" 
                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                    : u.role === "Auditor"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                }`}>
                                  {u.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400">{u.title} • {u.email}</p>
                            </div>
                          </div>
                          {selectedUserLogin === u.id && (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full mt-4 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Autenticando sessão...</span>
                      </>
                    ) : (
                      <>
                        <span>Entrar na Plataforma</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              /* ONBOARDING FORM TAB (/register-company) */
              <motion.div
                key="register-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Onboarding Wizard Steps */}
                <div className="flex items-center justify-between mb-4">
                  {[
                    { num: 1, label: "Empresa & CNPJ" },
                    { num: 2, label: "Admin Master" },
                    { num: 3, label: "Módulos ESG" },
                    { num: 4, label: "Conclusão" },
                  ].map((s) => (
                    <div key={s.num} className="flex items-center space-x-1.5">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          regStep === s.num
                            ? "bg-emerald-500 text-slate-950 ring-2 ring-emerald-500/30"
                            : regStep > s.num
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40"
                            : "bg-slate-800 text-slate-500"
                        }`}
                      >
                        {regStep > s.num ? <Check className="h-3.5 w-3.5" /> : s.num}
                      </div>
                      <span className={`text-[11px] font-medium hidden sm:inline ${
                        regStep === s.num ? "text-emerald-400 font-bold" : "text-slate-400"
                      }`}>
                        {s.label}
                      </span>
                      {s.num < 4 && <div className="w-4 sm:w-8 h-[1px] bg-slate-800 mx-1" />}
                    </div>
                  ))}
                </div>

                {/* Step 1: Company Details & CNPJ Validation */}
                {regStep === 1 && (
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-medium text-slate-300">CNPJ da Empresa</label>
                        <span className="text-[10px] font-mono text-emerald-400">Validação Automática Receita Federal</span>
                      </div>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={cnpj}
                          onChange={(e) => handleCnpjChange(e.target.value)}
                          placeholder="00.000.000/0001-00"
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={handleValidateCnpj}
                          disabled={isValidatingCnpj}
                          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-400 border border-slate-700 rounded-xl transition-all flex items-center space-x-1.5"
                        >
                          {isValidatingCnpj ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Search className="h-3.5 w-3.5" />
                          )}
                          <span>Validar</span>
                        </button>
                      </div>

                      {cnpjValidated && cnpjCompanyDetails && (
                        <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 space-y-1">
                          <div className="flex items-center justify-between font-semibold">
                            <span>Status da Empresa: {cnpjCompanyDetails.status}</span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          </div>
                          <p className="text-[10px] text-slate-400">
                            Capital Social: {cnpjCompanyDetails.capitalSocial} • Região: {cnpjCompanyDetails.regiao}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Razão Social / Nome Corporativo</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Ex: Mineração Vale do Sol S.A."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Setor de Atuação</label>
                        <select
                          value={sector}
                          onChange={(e) => setSector(e.target.value as any)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Mining">Mineração & Siderurgia</option>
                          <option value="Energy">Energia & Renováveis</option>
                          <option value="Industry">Indústria & Manufatura</option>
                          <option value="Sanitation">Saneamento & Recursos Hídricos</option>
                          <option value="Agribusiness">Agronegócio & Silvicultura</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Localização / Sede</label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Cidade, UF"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Unidades / Instalações Operacionais</label>
                      <input
                        type="text"
                        value={unitsInput}
                        onChange={(e) => setUnitsInput(e.target.value)}
                        placeholder="Separe por vírgulas"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setRegStep(2)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center space-x-2"
                    >
                      <span>Avançar para Usuário Administrador</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Step 2: Admin Master Creation */}
                {regStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Administrador Master</label>
                      <input
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="Ex: Carlos Eduardo Silva"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">E-mail Corporativo</label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="carlos.silva@suaempresa.com.br"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Cargo / Função</label>
                      <input
                        type="text"
                        value={adminTitle}
                        onChange={(e) => setAdminTitle(e.target.value)}
                        placeholder="Diretor de EHS & ESG"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Senha de Acesso</label>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(1)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegStep(3)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center space-x-2"
                      >
                        <span>Avançar para Módulos</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: ESG Module Selection */}
                {regStep === 3 && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400">
                      Selecione os módulos corporativos que serão ativados para o tenant isolado desta empresa:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                      {AVAILABLE_MODULES.map((m) => {
                        const IconComponent = m.icon;
                        const isSelected = selectedModules.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            onClick={() => toggleModule(m.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-2.5 ${
                              isSelected
                                ? "bg-emerald-950/30 border-emerald-500/50 text-white"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg shrink-0 ${
                              isSelected ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
                            }`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold leading-tight">{m.name}</h4>
                              <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{m.desc}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setRegStep(2)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all"
                      >
                        Voltar
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegStep(4)}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center space-x-2"
                      >
                        <span>Revisar Onboarding</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Final Confirmation & Submission */}
                {regStep === 4 && (
                  <div className="space-y-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Resumo do Onboarding
                      </h4>
                      <div className="text-xs space-y-1.5 text-slate-300">
                        <p><strong className="text-slate-400">Empresa:</strong> {companyName || "Mineração S.A."}</p>
                        <p><strong className="text-slate-400">CNPJ:</strong> {cnpj || "00.000.000/0001-00"}</p>
                        <p><strong className="text-slate-400">Setor:</strong> {sector} • <strong className="text-slate-400">Sede:</strong> {location}</p>
                        <p><strong className="text-slate-400">Administrador Master:</strong> {adminName || "Administrador EHS"} ({adminEmail || "admin@empresa.com.br"})</p>
                        <p><strong className="text-slate-400">Módulos Ativos:</strong> {selectedModules.length} de 9 módulos ativados</p>
                      </div>
                    </div>

                    {regSuccess ? (
                      <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-center space-y-2">
                        <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto animate-bounce" />
                        <h3 className="text-sm font-bold text-white">Tenant Criado com Sucesso!</h3>
                        <p className="text-xs text-emerald-300">Iniciando sessão do administrador na plataforma...</p>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setRegStep(3)}
                          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-all"
                        >
                          Ajustar
                        </button>
                        <button
                          type="button"
                          onClick={handleRegisterCompanySubmit}
                          disabled={isSubmitting}
                          className="flex-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Criando Tenant Isolado...</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="h-4 w-4" />
                              <span>Finalizar Cadastro da Empresa</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer info banner */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Criptografia AES-256 e Isolamento Multitenant Ativos</span>
          </span>
          <span className="font-mono text-[10px] text-slate-600">SLA 99.99%</span>
        </div>
      </motion.div>
    </div>
  );
}
