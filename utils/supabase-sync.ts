// utils/supabase-sync.ts
import { supabase } from './supabase-client';
import { db } from '@/db';

export async function sincronizarTudo(nomeDaUnidade?: string) {
  try {
    console.log('🔄 Verificando backup de segurança...');

    const unidadeSalva = typeof window !== 'undefined' 
      ? localStorage.getItem('fspss_unidade_ativa') 
      : null;
      
    // Pega o nome ou fica vazio
    const unidadeIdentificada = nomeDaUnidade || unidadeSalva;

    // ✨ A TRAVA DE SEGURANÇA AQUI ✨
    if (!unidadeIdentificada || unidadeIdentificada === 'desconhecida') {
      console.log('⚠️ Backup ignorado: Nenhuma unidade logada no momento.');
      return; 
    }

    // Geramos o PREFIXO base (ex: backup_usfboicucanga1)
    const prefixoBackup = `backup_${unidadeIdentificada
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')}`;

    console.log('Prefixo do backup:', prefixoBackup);

    // 1. Coleta os dados locais do Dexie
    const tabelas = [
      'encaminhamentos',
      'pedidos',
      'materiais',
      'remessas',
      'sos',
      'pacientes',
      'exames',
      'transferencias',
      'profissionais',
    ];

    const bancoDados: Record<string, any[]> = {};

    for (const tabela of tabelas) {
      try {
        bancoDados[tabela] = await (db as any).table(tabela).toArray();
      } catch {
        bancoDados[tabela] = [];
      }
    }

    const dadosConfig = {
      fspss_unidade_padrao: localStorage.getItem('fspss_unidade_padrao') || '',
      fspss_responsavel_padrao: localStorage.getItem('fspss_responsavel_padrao') || '',
      fspss_cargo_padrao: localStorage.getItem('fspss_cargo_padrao') || '',
      fspss_telefone_padrao: localStorage.getItem('fspss_telefone_padrao') || '',
      fspss_mensagem_zap_padrao: localStorage.getItem('fspss_mensagem_zap_padrao') || '',
    };

    const objetoBackup = {
      sistema: 'GestaoClinicaFSPSS',
      dataExportacao: new Date().toLocaleDateString('pt-BR'),
      configuracoes: dadosConfig,
      bancoDados,
    };

    // =========================================================================
    // ✨ 2. LÓGICA DE ROTAÇÃO DOS 3 BACKUPS
    // =========================================================================
    console.log('🔍 Verificando slots de backup existentes...');

    // Busca no Supabase apenas os backups que começam com o nosso prefixo
    const { data: backupsExistentes, error: errorFetch } = await supabase
      .from('backups')
      .select('id, data_backup')
      .like('id', `${prefixoBackup}_save%`); // Busca save1, save2, save3...

    if (errorFetch) throw errorFetch;

    // Define os 3 slots oficias que o sistema pode usar
    const slotsOficiais = [
      `${prefixoBackup}_save1`,
      `${prefixoBackup}_save2`,
      `${prefixoBackup}_save3`
    ];

    let idSlotFinal = '';
    const idsNoBanco = backupsExistentes ? backupsExistentes.map(b => b.id) : [];

    // Tenta encontrar um slot que ainda não foi usado (ex: app rodando nas primeiras vezes)
    const slotLivre = slotsOficiais.find(slot => !idsNoBanco.includes(slot));

    if (slotLivre) {
      idSlotFinal = slotLivre;
      console.log(`✅ Slot livre encontrado: ${idSlotFinal}`);
    } else {
      // Se todos os 3 slots já estão cheios, pega o MAIS ANTIGO para sobrescrever
      const maisAntigo = backupsExistentes!.sort((a, b) => {
        return new Date(a.data_backup).getTime() - new Date(b.data_backup).getTime();
      })[0];

      idSlotFinal = maisAntigo.id;
      console.log(`♻️ Todos slots ocupados. Sobrescrevendo o mais antigo: ${idSlotFinal}`);
    }
    // =========================================================================

    // 3. Salva no Supabase no slot selecionado
    const resultado = await supabase
      .from('backups')
      .upsert(
        {
          id: idSlotFinal, // Usando o id dinâmico gerado acima
          dados: objetoBackup,
          data_backup: new Date().toISOString(), // Atualiza a data para ele ir pro fim da fila
        },
        {
          onConflict: 'id',
        }
      );

    console.log('Resultado completo:', JSON.stringify(resultado, null, 2));

    if (resultado.error) {
      console.error('Código:', resultado.error.code);
      console.error('Mensagem:', resultado.error.message);
    } else {
      console.log(`✅ Backup da unidade [${unidadeIdentificada}] salvo com sucesso no slot [${idSlotFinal}]!`);
    }
  } catch (error) {
    console.error('Falha crítica no backup:', error);
  }
}
