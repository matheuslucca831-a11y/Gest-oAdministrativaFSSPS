import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db'; 
import { supabase } from '@/utils/supabase-client';
import { useState } from 'react';

export interface ProtocoloExame {
  id: number;
  created_at?: string;
  nome: string;
  sigla: string;
  checklist: string;
}

export function useProtocolos() {
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. A leitura é 100% local e reativa. Se o IndexedDB mudar, a tela atualiza sozinha.
  const protocolos = useLiveQuery(() => db.table('protocolos_cache').toArray(), []);

  // 2. Função que bate na internet e atualiza o cache local
  const sincronizarComSupabase = async () => {
    if (!navigator.onLine) {
      alert("Você está sem internet no momento. Exibindo apenas a cópia local.");
      return false;
    }

    try {
      setIsSyncing(true);
      const { data, error } = await supabase
        .from('Exames_e_Protocolos') // ⚠️ COLOQUE O NOME REAL DA SUA TABELA AQUI
        .select('*');

      if (error) throw error;

      if (data) {
        // Atualiza em transação (seguro contra quedas de energia no meio do processo)
        await db.transaction('rw', db.table('protocolos_cache'), async () => {
          await db.table('protocolos_cache').clear();
          await db.table('protocolos_cache').bulkPut(data);
        });
      }
      return true;
    } catch (err) {
      console.error("Erro ao sincronizar protocolos:", err);
      alert("Não foi possível baixar os dados mais recentes do servidor.");
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    protocolos: protocolos || [],
    isSyncing,
    sincronizarComSupabase
  };
}