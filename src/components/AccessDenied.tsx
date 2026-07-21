/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ShieldAlert, Lock, UserCheck, ArrowRight, ShieldCheck } from "lucide-react";
import { useAuth, DEMO_USERS } from "../context/AuthContext";

interface AccessDeniedProps {
  tabName: string;
  requiredRoles: string[];
}

export default function AccessDenied({ tabName, requiredRoles }: AccessDeniedProps) {
  const { currentUser, switchUser, getRoleBadgeColor } = useAuth();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 max-w-xl w-full shadow-xl space-y-6 text-center">
        
        {/* Lock Icon Banner */}
        <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
          <Lock className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="h-3.5 w-3.5" />
            <span>Acesso Restrito - Controle RBAC</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Aba "{tabName}" Bloqueada
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            O seu perfil de usuário atual (<strong>{currentUser.name}</strong>) possui o cargo de{" "}
            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getRoleBadgeColor(currentUser.role)}`}>
              {currentUser.role}
            </span>{" "}
            e não tem permissão para visualizar este módulo.
          </p>
        </div>

        {/* Required Roles Callout */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
          <p className="font-bold text-slate-700 dark:text-slate-300">
            Cargos com Permissão de Acesso:
          </p>
          <div className="flex flex-wrap gap-2">
            {requiredRoles.map((role) => (
              <span key={role} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-1 rounded-lg font-bold border border-emerald-300 dark:border-emerald-800 flex items-center space-x-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{role}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Role Switcher for Testing */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <p className="text-xs font-semibold text-slate-500">
            Alternar perfil para testar acesso com outro cargo:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {DEMO_USERS.map((usr) => {
              const isSelected = usr.id === currentUser.id;
              return (
                <button
                  key={usr.id}
                  onClick={() => switchUser(usr.id)}
                  className={`p-3 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 font-bold"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <p className="font-bold truncate">{usr.name.split(" ")[0]} {usr.name.split(" ")[1]}</p>
                  <p className="text-[10px] text-slate-500 truncate">{usr.role}</p>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
