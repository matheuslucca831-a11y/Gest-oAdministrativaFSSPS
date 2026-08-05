import Dexie from 'dexie';

// HISTÓRICO DE VERSÕES (não executado mais — mantido só como documentação
// de como o schema evoluiu ao longo do tempo):
//
// V1: encaminhamentos, pedidos, materiais, remessas
// V2: + sos
// V3: + pacientes, exames (com campo 'examen', depois corrigido)
// V4: + transferencias
// V5: + profissionais
// V6: + arquivos_cache
// V7: + protocolos_cache
// V8: + produtos_pedidos_cache
// V9: + escala, frequencia
// V10: + profissionais_produtividade
//
// Motivo da mudança: declarar as 10 versões em sequência fazia o Dexie
// processar uma cadeia de upgrade complexa numa única transação nativa do
// IndexedDB. Em instalações NOVAS (banco vazio, como em deploys novos da
// Vercel ou computadores novos rodando o .exe), essa cadeia longa estava
// silenciosamente falhando em criar as tabelas de verdade — o Dexie achava
// que tinha aberto com sucesso (schema declarado corretamente em memória),
// mas a conexão nativa do navegador ficava com ZERO tabelas reais
// (confirmado via `db.backendDB().objectStoreNames`), causando
// "NotFoundError: object store not found" em qualquer tentativa de uso.
//
// Um teste com IndexedDB puro (sem Dexie), criando uma única versão de uma
// vez, funcionou perfeitamente — por isso a solução foi declarar só a
// versão final (10) diretamente, evitando a cadeia de 10 upgrades
// empilhados. Isso NÃO afeta instalações já existentes (como o computador
// de desenvolvimento, que já está na versão 10): o Dexie detecta que a
// versão nativa já bate com a declarada e não precisa rodar nenhum upgrade.

function criarBanco() {
  const instancia = new Dexie('GestaoClinicaFSPSS');

  instancia.version(10).stores({
    encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
    pedidos: '++id, numeroPedido, data, categoria, status',
    materiais: '++id, codigo, descricao',
    remessas: '++id, numeroRemessa, destino, dataSaida',
    sos: '++id, numeroOS, ano, unidade, dataSolicitacao, status',
    pacientes: 'cross, nome, dataNasc, telefone',
    exames: '++id, cross, exame, status, dataRegistro, dataChegada',
    transferencias: '++id, unidadeSolicitante, solicitante, paciente, tipoSolicitacao, dataRegistro, status',
    profissionais: '++id, nome, matricula, cargo, cargaHoraria',
    arquivos_cache: 'id, titulo, categoria',
    protocolos_cache: 'id, nome, sigla',
    produtos_pedidos_cache: 'id, categoria, tipo_pedido',
    escala: '++id, profissional_id',
    frequencia: '++id, [profissional_id+data], data',
    profissionais_produtividade: '++id, nome, matricula, vinculo, unidade, cargo, cargaHoraria'
  });

  return instancia;
}

// 👇 Só cria a instância real do Dexie no navegador.
// No servidor (build/SSR na Vercel), usa um "fake" que não quebra o import,
// mas também não deve ser usado — as páginas que usam `db` precisam chamar
// isso só dentro de useEffect/handlers (client-side), nunca no corpo do
// componente. O comentário abaixo força o TypeScript a tratar `db` sempre
// como Dexie, evitando erros de "Property does not exist on type {}".
/** @type {import('dexie').default} */
function obterInstancia() {
  // Guarda a instância no `window` (não numa variável de módulo) porque o
  // Next.js pode empacotar este arquivo em mais de um "chunk" JS diferente
  // (um por rota). Se isso acontecer, cada chunk teria sua PRÓPRIA cópia de
  // uma variável de módulo — ou seja, o "singleton" não seria de verdade, e
  // duas instâncias do Dexie tentariam criar o banco do zero ao mesmo tempo
  // (é exatamente o tipo de corrida que causa NotFoundError só em bancos
  // novos, nunca em bancos que já existem). `window` é sempre o mesmo objeto
  // pra qualquer chunk, então garante uma única instância de verdade.
  if (!window.__gestaoClinicaDb) {
    const instancia = criarBanco();

    // Se outra aba/janela abrir uma versão mais nova, esta conexão precisa
    // fechar para não travar o upgrade dela.
    instancia.on('versionchange', () => {
      console.warn('[db] Outra janela está tentando atualizar o banco — fechando esta conexão.');
      instancia.close();
    });

    // Se esta conexão ficar bloqueada por outra aba/janela mais antiga que
    // ainda está aberta, avisa claramente em vez de falhar silenciosamente
    // numa versão desatualizada do schema.
    instancia.on('blocked', () => {
      console.error('[db] Upgrade do banco bloqueado — feche outras janelas/abas do app e recarregue.');
    });

    instancia.open()
      .then(() => {
        const tabelasReais = instancia.backendDB().objectStoreNames;
        console.log(
          `[db] Banco aberto. Versão: ${instancia.verno}. Tabelas declaradas (${instancia.tables.length}) / reais (${tabelasReais.length}):`,
          instancia.tables.map((t) => t.name)
        );

        if (tabelasReais.length === 0 && instancia.tables.length > 0) {
          const jaTentouCorrigir = sessionStorage.getItem('fspss_db_autocorrecao');
          if (!jaTentouCorrigir) {
            console.error('[db] Banco "zumbi" detectado (0 tabelas reais). Apagando e recarregando automaticamente...');
            sessionStorage.setItem('fspss_db_autocorrecao', 'true');
            instancia.close();
            const req = indexedDB.deleteDatabase('GestaoClinicaFSPSS');
            req.onsuccess = () => window.location.reload();
            req.onerror = () => console.error('[db] Falha ao apagar o banco zumbi automaticamente.');
            req.onblocked = () => console.error('[db] Exclusão automática bloqueada — feche outras abas do app e recarregue manualmente.');
          } else {
            console.error('[db] Banco continua "zumbi" mesmo após autocorreção — precisa de investigação manual.');
          }
        } else {
          sessionStorage.removeItem('fspss_db_autocorrecao');
        }
      })
      .catch((err) => {
        console.error('[db] FALHA AO ABRIR O BANCO. Nome do erro:', err && err.name);
        console.error('[db] Mensagem completa:', err && err.message);
        console.error('[db] Erro completo:', err);
      });

    window.__gestaoClinicaDb = instancia;
  }

  return window.__gestaoClinicaDb;
}

export const db =
  typeof window !== 'undefined'
    ? obterInstancia()
    : ({});
