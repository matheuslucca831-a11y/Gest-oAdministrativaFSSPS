'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/utils/supabase-client'; // Ajuste o caminho se necessário

export interface Aviso {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'aviso' | 'urgente';
  ativo: boolean;
  exibir_em: string | null;
  expira_em: string | null;
  repetir_a_cada_horas: number | null;
}

const CHAVE_LOCALSTORAGE = 'fspss_avisos_vistos';

function lerHistorico(): Record<number, number> {
  try {
    const bruto = localStorage.getItem(CHAVE_LOCALSTORAGE);
    return bruto ? JSON.parse(bruto) : {};
  } catch {
    return {};
  }
}

function salvarHistorico(historico: Record<number, number>) {
  localStorage.setItem(CHAVE_LOCALSTORAGE, JSON.stringify(historico));
}

export function useAvisos() {
  const [avisosVisiveis, setAvisosVisiveis] = useState<Aviso[]>([]);

  const verificarAvisos = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;

    try {
      const { data, error } = await supabase
        .from('avisos')
        .select('*')
        .eq('ativo', true);

      if (error || !data) return;

      const agora = Date.now();
      const historico = lerHistorico();

      // Usamos a função de callback do setState para ter acesso ao estado mais atual
      setAvisosVisiveis((prev) => {
        const novos = [...prev];

        for (const aviso of data as Aviso[]) {
          // 1. Validações de data e expiração
          if (aviso.exibir_em && new Date(aviso.exibir_em).getTime() > agora) continue;
          if (aviso.expira_em && new Date(aviso.expira_em).getTime() <= agora) continue;

          // 2. Se o aviso já está na tela no momento, pula (evita duplicar no setInterval)
          if (novos.some(a => a.id === aviso.id)) continue;

          const ultimaVez = historico[aviso.id];

          // 3. Verifica se deve mostrar baseado no histórico
          if (aviso.repetir_a_cada_horas) {
            const intervaloMs = aviso.repetir_a_cada_horas * 60 * 60 * 1000;
            if (!ultimaVez || agora - ultimaVez >= intervaloMs) {
              novos.push(aviso);
            }
          } else {
            // Aviso único: só mostra se não estiver no histórico
            if (!ultimaVez) {
              novos.push(aviso);
            }
          }
        }

        return novos;
      });
    } catch (err) {
      console.error('Erro ao verificar avisos:', err);
    }
  }, []);

  const dispensarAviso = useCallback((id: number) => {
    // A grande mudança: Só salva no localStorage quando o usuário CLICA NO X!
    const historico = lerHistorico();
    historico[id] = Date.now();
    salvarHistorico(historico);

    // Remove da tela
    setAvisosVisiveis(prev => prev.filter(a => a.id !== id));
  }, []);

  useEffect(() => {
    verificarAvisos();

    const intervalo = setInterval(verificarAvisos, 5 * 60 * 1000);
    window.addEventListener('online', verificarAvisos);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener('online', verificarAvisos);
    };
  }, [verificarAvisos]);

  return { avisosVisiveis, dispensarAviso };
}