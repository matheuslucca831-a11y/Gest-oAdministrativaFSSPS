import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { supabase } from '@/utils/supabase-client';
import { useState } from 'react';

export interface ProdutoPedido {
  id: number;
  codigo: string;
  nome: string;
  unidade: string;
  categoria: string;
  tipo_pedido: string;
  ativo: boolean;
}

export function useProdutosPedidos(tipoPedido: string) {
  const [isSyncing, setIsSyncing] = useState(false);

  const produtos = useLiveQuery(
    () => db.table('produtos_pedidos_cache').where('tipo_pedido').equals(tipoPedido).toArray(),
    [tipoPedido]
  );

  const sincronizarComSupabase = async () => {
    if (!navigator.onLine) {
      alert('Você está sem internet. Exibindo apenas a cópia local.');
      return false;
    }

    try {
      setIsSyncing(true);
      const { data, error } = await supabase
        .from('produtos_pedidos')
        .select('*')
        .eq('tipo_pedido', tipoPedido)
        .eq('ativo', true);

      if (error) throw error;

      if (data) {
        await db.transaction('rw', db.table('produtos_pedidos_cache'), async () => {
          const existentes = await db.table('produtos_pedidos_cache').where('tipo_pedido').equals(tipoPedido).toArray();
          await db.table('produtos_pedidos_cache').bulkDelete(existentes.map(i => i.id));
          await db.table('produtos_pedidos_cache').bulkPut(data);
        });
      }
      return true;
    } catch (err) {
      console.error('Erro ao sincronizar produtos:', err);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    produtos: produtos || [],
    isSyncing,
    sincronizarComSupabase,
  };
}