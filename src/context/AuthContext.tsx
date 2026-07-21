/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import { UserAccount, UserRole } from "../types";

export const DEMO_USERS: UserAccount[] = [
  {
    id: "usr-1",
    name: "Dra. Heloísa Souza",
    email: "heloisa.souza@petronexa.com.br",
    role: "Administrador",
    title: "Diretora de EHS & ESG",
    department: "Corporate Compliance",
    tenantId: "tenant-1"
  },
  {
    id: "usr-2",
    name: "Eng. Carlos Mendes",
    email: "carlos.mendes@petronexa.com.br",
    role: "Técnico",
    title: "Engenheiro Ambiental Pleno",
    department: "Operações de Campo",
    tenantId: "tenant-1"
  },
  {
    id: "usr-3",
    name: "Dr. Roberto Alves",
    email: "roberto.alves@ibama.gov.br",
    role: "Auditor",
    title: "Auditor Fiscal Ambiental - IBAMA",
    department: "Órgão Regulador / Fiscalização",
    tenantId: "tenant-1"
  }
];

// TAB PERMISSIONS MATRIX BY ROLE
const ROLE_PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  Administrador: {
    dashboard: true,
    licensing: true,
    monitoring: true,
    gis: true,
    compliance: true,
    documents: true,
    reports: true,
    integrations: true,
    assistant: true
  },
  Técnico: {
    dashboard: true,
    licensing: true,
    monitoring: true,
    gis: true,
    compliance: false, // Restricted for Field Technicians
    documents: true,
    reports: true,
    integrations: false, // Restricted for Admins only
    assistant: true
  },
  Auditor: {
    dashboard: true,
    licensing: true,
    monitoring: true,
    gis: true,
    compliance: true, // Auditors have access to compliance/risk matrices
    documents: true,
    reports: true,
    integrations: false, // Restricted for Admins only
    assistant: true
  }
};

interface AuthContextType {
  currentUser: UserAccount;
  role: UserRole;
  switchUser: (userId: string) => void;
  hasPermission: (tabId: string) => boolean;
  getRoleBadgeColor: (role: UserRole) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserAccount>(DEMO_USERS[0]);

  const switchUser = (userId: string) => {
    const selected = DEMO_USERS.find((u) => u.id === userId);
    if (selected) {
      setCurrentUser(selected);
    }
  };

  const hasPermission = (tabId: string): boolean => {
    const rolePerms = ROLE_PERMISSIONS[currentUser.role];
    if (!rolePerms) return false;
    return rolePerms[tabId] ?? true;
  };

  const getRoleBadgeColor = (role: UserRole): string => {
    switch (role) {
      case "Administrador":
        return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800";
      case "Técnico":
        return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800";
      case "Auditor":
        return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800";
      default:
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser.role,
        switchUser,
        hasPermission,
        getRoleBadgeColor
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
