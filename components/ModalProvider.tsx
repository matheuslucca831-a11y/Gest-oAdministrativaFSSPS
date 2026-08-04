'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle, X } from 'lucide-react';

// ─── TIPOS ──────────────────────────────────────────────────────────────────
type TipoAviso = 'info' | 'sucesso' | 'erro';

interface ConfirmacaoState {
  mensagem: string;
  titulo?: string;
  resolver: (valor: boolean) => void;
}

interface AvisoState {
  id: number;
  mensagem: string;
  tipo: TipoAviso;
}

interface ModalContextValue {
  confirmar: (mensagem: string, titulo?: string) => Promise<boolean>;
  avisar: (mensagem: string, tipo?: TipoAviso) => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

// ─── HOOK DE USO ────────────────────────────────────────────────────────────
export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal precisa estar dentro de <ModalProvider>');
  return ctx;
}

// ─── PROVEDOR ───────────────────────────────────────────────────────────────
export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [confirmacao, setConfirmacao] = useState<ConfirmacaoState | null>(null);
  const [avisos, setAvisos] = useState<AvisoState[]>([]);

  const confirmar = useCallback((mensagem: string, titulo?: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmacao({ mensagem, titulo, resolver: resolve });
    });
  }, []);

  const avisar = useCallback((mensagem: string, tipo: TipoAviso = 'info') => {
    const id = Date.now() + Math.random();
    setAvisos(prev => [...prev, { id, mensagem, tipo }]);
    setTimeout(() => {
      setAvisos(prev => prev.filter(a => a.id !== id));
    }, 5000);
  }, []);

  const responderConfirmacao = (valor: boolean) => {
    confirmacao?.resolver(valor);
    setConfirmacao(null);
  };

  const fecharAviso = (id: number) => {
    setAvisos(prev => prev.filter(a => a.id !== id));
  };

  const estiloAviso: Record<TipoAviso, { cor: string; icone: React.ReactNode }> = {
    info: { cor: 'bg-blue-50 border-blue-200 text-blue-800', icone: <Info size={16} className="text-blue-500" /> },
    sucesso: { cor: 'bg-emerald-50 border-emerald-200 text-emerald-800', icone: <CheckCircle2 size={16} className="text-emerald-500" /> },
    erro: { cor: 'bg-red-50 border-red-200 text-red-800', icone: <XCircle size={16} className="text-red-500" /> },
  };

  return (
    <ModalContext.Provider value={{ confirmar, avisar }}>
      {children}

      {/* MODAL DE CONFIRMAÇÃO (substitui window.confirm) */}
      {confirmacao && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-amber-50 border border-amber-100 rounded-full text-amber-600 shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                {confirmacao.titulo && (
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1">{confirmacao.titulo}</h3>
                )}
                <p className="text-xs text-gray-600 leading-relaxed">{confirmacao.mensagem}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => responderConfirmacao(false)}
                className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2.5 rounded-xl text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => responderConfirmacao(true)}
                className="w-1/2 bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl text-xs font-bold transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PILHA DE AVISOS (substitui window.alert) */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 w-full max-w-xs">
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            className={`flex items-start gap-2 p-3 rounded-xl border shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 ${estiloAviso[aviso.tipo].cor}`}
          >
            {estiloAviso[aviso.tipo].icone}
            <p className="text-xs font-bold flex-1">{aviso.mensagem}</p>
            <button onClick={() => fecharAviso(aviso.id)} className="opacity-60 hover:opacity-100 shrink-0">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ModalContext.Provider>
  );
}