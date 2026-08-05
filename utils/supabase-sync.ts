// utils/supabase-sync.ts
import { supabase } from './supabase-client';
import { db } from '@/db';

export async function sincronizarTudo() {
  try {
    console.log('🔄 Iniciando backup automático...');

    // 1. Coleta os dados locais do Dexie
    const tabelas = [
      'encaminhamentos', 'pedidos', 'materiais', 'remessas', 
      'sos', 'pacientes', 'exames', 'transferencias', 'profissionais',
    ];

    const bancoDados: Record<string, any[]> = {};
    for (const tabela of tabelas) {
      try {
        bancoDados[tabela] = await (db as any).table(tabela).toArray();
      } catch {
        bancoDados[tabela] = [];
      }
    }

    const objetoBackup = {
      sistema: 'GestaoClinicaFSPSS',
      dataExportacao: new Date().toLocaleDateString('pt-BR'),
      configuracoes: {
        unidade_padrao: localStorage.getItem('fspss_unidade_padrao') || '',
        responsavel_padrao: localStorage.getItem('fspss_responsavel_padrao') || '',
        cargo_padrao: localStorage.getItem('fspss_cargo_padrao') || '',
        telefone_padrao: localStorage.getItem('fspss_telefone_padrao') || '',
        mensagem_zap_padrao: localStorage.getItem('fspss_mensagem_zap_padrao') || '',
      },
      bancoDados,
    };

    // 2. ENVIO USANDO UPSERT (Se o ID gerado pela trigger já existir, ele atualiza!)
    const { error } = await supabase
      .from('backups')
      .upsert(
        {
          dados: objetoBackup,
          data_backup: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

    if (error) {
      console.error('Erro ao enviar backup para o servidor:', error.message);
      throw new Error(error.message);
    }

    console.log('✅ Backup sincronizado com sucesso!');

  } catch (error) {
    console.error('Falha crítica no backup:', error);
    // ⚠️ OBRIGATÓRIO: Repassa o erro para o componente Sincronizar.tsx exibir na tela!
    throw error;
  }
}
