/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  FolderPlus,
  HelpCircle,
  FileCheck,
  AlertCircle
} from "lucide-react";
import { Tenant, CorporateDocument } from "../types";

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  suggestedDocs?: any[];
}

interface AIAssistantTabProps {
  tenant: Tenant;
  onAddDocument: (docData: any) => Promise<void>;
  isDbUpdating: boolean;
  onNavigateToTab: (tabId: string) => void;
}

const PREBAKED_SUGGESTIONS = [
  { label: "Legislação CONAMA 430", prompt: "Como a CONAMA 430 se aplica aos meus efluentes e quais limites de DBO devo observar?" },
  { label: "Parecer de Viabilidade", prompt: "Gere um rascunho de Parecer Técnico Preventivo focado na segurança dos nossos taludes." },
  { label: "Multas & Crimes Ambientais", prompt: "Quais são as principais sanções da Lei de Crimes Ambientais 9.605/98 para vazamentos de óleo?" }
];

export default function AIAssistantTab({
  tenant,
  onAddDocument,
  isDbUpdating,
  onNavigateToTab
}: AIAssistantTabProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: `Olá! Sou o **NexaBot**, seu assistente especialista em compliance, engenharia ambiental e regulamentações do setor. \n\nPosso te ajudar a redigir pareceres, analisar riscos da legislação ambiental brasileira (CONAMA, IBAMA, FEAM) ou estruturar relatórios de controle de poluentes baseados nas suas operações ativas.\n\nEscolha um dos tópicos abaixo ou digite sua consulta técnica.`
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiNotice, setApiNotice] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);

  // Suggested Docs extraction state
  const [activeSuggestions, setActiveSuggestions] = useState<any[]>([]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { sender: "user", text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);
    setApiNotice("");

    // Prepare history payload
    const chatHistory = messages.map(m => ({
      sender: m.sender,
      text: m.text
    }));

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory,
          tenantId: tenant.id
        })
      });
      const data = await response.json();

      if (data.success) {
        const botMsg: ChatMessage = {
          sender: "bot",
          text: data.text,
          suggestedDocs: data.suggestedDocs
        };
        setMessages(prev => [...prev, botMsg]);
        setIsSimulated(!!data.simulated);
        if (data.message) {
          setApiNotice(data.message);
        }

        if (data.suggestedDocs && data.suggestedDocs.length > 0) {
          setActiveSuggestions(prev => [...data.suggestedDocs, ...prev]);
        }
      } else {
        setMessages(prev => [...prev, {
          sender: "bot",
          text: "Desculpe, ocorreu uma não-conformidade interna no meu processador inteligente: " + data.error
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        sender: "bot",
        text: "Incapaz de transmitir requisição ao servidor inteligente NexaAI. Verifique a fiação de dados."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportDocumentDraft = async (draft: any) => {
    await onAddDocument({
      tenantId: tenant.id,
      title: draft.title,
      type: draft.type,
      content: draft.content,
      version: 1,
      status: "Review",
      author: "NexaAI Agent",
      workflowSteps: [
        { role: "Meio Ambiente", user: "Gestor de Meio Ambiente", status: "Approved", date: new Date().toISOString().split("T")[0] },
        { role: "Jurídico / Compliance", user: "Coordenador de Compliance", status: "Pending" }
      ]
    });

    // Clear suggestion item from active panel
    setActiveSuggestions(prev => prev.filter(d => d.title !== draft.title));
    alert(`Minuta "${draft.title}" foi importada com sucesso para o seu editor de documentos!`);
    onNavigateToTab("documents"); // Switch view to document workspace
  };

  return (
    <div className="p-6 lg:p-8 space-y-8" id="ai-assistant-module-container">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bot className="h-7 w-7 text-emerald-600 animate-pulse" />
            <span>NexaBot AI Assessor Jurídico</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Minutas de pareceres, verificação regulatória ambiental e consultoria corporativa instantânea baseada no Gemini 3.6-flash.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Chat log interaction (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col h-[580px] overflow-hidden shadow-sm">
          
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-widest">Sessão Consultiva Ativa</span>
            </div>
            {isSimulated && (
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-bold px-2 py-0.5 rounded uppercase">
                Assistente Online
              </span>
            )}
          </div>

          {/* Scrolling messages viewport */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div 
                key={i}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                <div className={`max-w-md rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                  m.sender === "user"
                    ? "bg-emerald-600 text-white rounded-br-none font-semibold"
                    : "bg-slate-100 dark:bg-slate-850 text-slate-850 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-800"
                }`}>
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* Render inline document notice in assistant message */}
                  {m.suggestedDocs && m.suggestedDocs.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/80 mt-2 space-y-1">
                      <p className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-slate-400">Minuta sugerida anexada ao painel ao lado:</p>
                      {m.suggestedDocs.map((d, idx) => (
                        <div key={idx} className="flex items-center space-x-1.5 text-[10px] font-bold text-emerald-650 dark:text-emerald-400">
                          <FileText className="h-3.5 w-3.5" />
                          <span>{d.title} ({d.type})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-400 rounded-2xl rounded-bl-none p-4 text-xs flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 animate-spin-slow text-emerald-600" />
                  <span>O NexaBot está analisando a legislação ambiental e formulando resposta...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Prompt Suggestions footer bar */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-150 dark:border-slate-850 space-y-1.5">
            <span className="block text-[9px] font-extrabold text-slate-450 uppercase tracking-widest pl-1">Perguntas Frequentes:</span>
            <div className="flex flex-wrap gap-2">
              {PREBAKED_SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.prompt)}
                  className="bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-left cursor-pointer transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form input messaging bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2"
          >
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pergunte sobre crimes ambientais, relatórios de CO2 ou outorgas de captação..."
              className="flex-1 text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-40"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>

        </div>

        {/* Right Column: AI Generated Proposed Minutas (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* API Notification bar if present */}
          {apiNotice && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/60 rounded-2xl text-xs text-emerald-800 dark:text-emerald-450">
              <div className="flex space-x-2">
                <Sparkles className="h-4.5 w-4.5 shrink-0 text-emerald-650" />
                <p className="font-semibold">{apiNotice}</p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-450 uppercase tracking-widest">Minutas Geradas pelo Assistente ({activeSuggestions.length})</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Pareceres ambientais propostos pela inteligência artificial para aprovação e workflow.</p>
            </div>

            {activeSuggestions.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-12 space-y-2">
                <HelpCircle className="h-8 w-8 text-slate-300 mx-auto" />
                <p>Nenhum parecer técnico gerado nesta sessão.</p>
                <p className="text-[10px] text-slate-450">Digite no chat do robô para solicitar pareceres jurídicos estruturados.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {activeSuggestions.map((draft, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-150 dark:border-slate-850 rounded-xl space-y-3 text-xs animate-slide-up">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white uppercase truncate max-w-[200px]">{draft.title}</span>
                      <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-450 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">{draft.type}</span>
                    </div>

                    <p className="text-[11px] text-slate-650 dark:text-slate-400 leading-relaxed max-h-28 overflow-y-auto bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 whitespace-pre-wrap">
                      {draft.content}
                    </p>

                    <button
                      onClick={() => handleImportDocumentDraft(draft)}
                      disabled={isDbUpdating}
                      className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-black text-white text-[10px] font-bold py-2 rounded-lg uppercase flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                    >
                      <FolderPlus className="h-3.5 w-3.5" />
                      <span>{isDbUpdating ? "Importando..." : "Importar Minuta p/ Fluxo"}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
