import Dexie from 'dexie';

// ⚠️ IMPORTANTE — leia antes de mexer neste arquivo:
//
// Descobrimos que o Dexie tem um bug/limitação neste ambiente: quando ELE
// mesmo é responsável por criar o schema (via db.version(N).stores({...})
// rodando dentro do onupgradeneeded interno da biblioteca), em bancos NOVOS
// (Vercel, computadores novos) ele às vezes termina o processo "achando"
// que deu tudo certo, mas o IndexedDB nativo do navegador fica com ZERO
// tabelas reais — um banco "zumbi". Testamos exaustivamente: mesma versão,
// mesmo schema, mesmos índices, mas criados via API nativa do navegador
// (sem Dexie) — funcionou perfeitamente, sempre.
//
// A solução aqui é: NUNCA deixar o Dexie criar o schema sozinho. Sempre
// criamos as tabelas manualmente via IndexedDB nativo primeiro
// (garantirTabelasNativas), e só DEPOIS deixamos o Dexie abrir o banco já
// pronto — nesse caso ele só abre uma conexão para um banco que já está
// 100% correto, sem precisar rodar nenhuma criação por conta própria.

const NOME_BANCO = 'GestaoClinicaFSPSS';
const VERSAO_NATIVA = 100; // equivale à versão 10 do Dexie (ele multiplica por 10 internamente)

const DEFINICAO_TABELAS = {
  encaminhamentos: { keyPath: 'id', autoIncrement: true, indices: [['nome', 'nome'], ['cross', 'cross'], ['dataRegistro', 'dataRegistro'], ['status', 'status'], ['especialidade', 'especialidade']] },
  pedidos: { keyPath: 'id', autoIncrement: true, indices: [['numeroPedido', 'numeroPedido'], ['data', 'data'], ['categoria', 'categoria'], ['status', 'status']] },
  materiais: { keyPath: 'id', autoIncrement: true, indices: [['codigo', 'codigo'], ['descricao', 'descricao']] },
  remessas: { keyPath: 'id', autoIncrement: true, indices: [['numeroRemessa', 'numeroRemessa'], ['destino', 'destino'], ['dataSaida', 'dataSaida']] },
  sos: { keyPath: 'id', autoIncrement: true, indices: [['numeroOS', 'numeroOS'], ['ano', 'ano'], ['unidade', 'unidade'], ['dataSolicitacao', 'dataSolicitacao'], ['status', 'status']] },
  pacientes: { keyPath: 'cross', autoIncrement: false, indices: [['nome', 'nome'], ['dataNasc', 'dataNasc'], ['telefone', 'telefone']] },
  exames: { keyPath: 'id', autoIncrement: true, indices: [['cross', 'cross'], ['exame', 'exame'], ['status', 'status'], ['dataRegistro', 'dataRegistro'], ['dataChegada', 'dataChegada']] },
  transferencias: { keyPath: 'id', autoIncrement: true, indices: [['unidadeSolicitante', 'unidadeSolicitante'], ['solicitante', 'solicitante'], ['paciente', 'paciente'], ['tipoSolicitacao', 'tipoSolicitacao'], ['dataRegistro', 'dataRegistro'], ['status', 'status']] },
  profissionais: { keyPath: 'id', autoIncrement: true, indices: [['nome', 'nome'], ['matricula', 'matricula'], ['cargo', 'cargo'], ['cargaHoraria', 'cargaHoraria']] },
  arquivos_cache: { keyPath: 'id', autoIncrement: false, indices: [['titulo', 'titulo'], ['categoria', 'categoria']] },
  protocolos_cache: { keyPath: 'id', autoIncrement: false, indices: [['nome', 'nome'], ['sigla', 'sigla']] },
  produtos_pedidos_cache: { keyPath: 'id', autoIncrement: false, indices: [['categoria', 'categoria'], ['tipo_pedido', 'tipo_pedido']] },
  escala: { keyPath: 'id', autoIncrement: true, indices: [['profissional_id', 'profissional_id']] },
  frequencia: { keyPath: 'id', autoIncrement: true, indices: [['profissional_id_data', ['profissional_id', 'data']], ['data', 'data']] },
  profissionais_produtividade: { keyPath: 'id', autoIncrement: true, indices: [['nome', 'nome'], ['matricula', 'matricula'], ['vinculo', 'vinculo'], ['unidade', 'unidade'], ['cargo', 'cargo'], ['cargaHoraria', 'cargaHoraria']] },
};

// Garante que todas as tabelas existem DE VERDADE no IndexedDB nativo,
// criando via API pura do navegador (não via Dexie). Idempotente: se a
// tabela já existir, pula ela (seguro rodar toda vez que o app abre).
function garantirTabelasNativas() {
  return new Promise((resolve) => {
    let req;
    try {
      req = indexedDB.open(NOME_BANCO, VERSAO_NATIVA);
    } catch (err) {
      console.error('[db] Falha ao iniciar abertura nativa:', err);
      resolve();
      return;
    }

    req.onupgradeneeded = (e) => {
      const nativeDb = e.target.result;
      console.log('[db] Criando/completando tabelas via API nativa...');

      for (const nome in DEFINICAO_TABELAS) {
        if (nativeDb.objectStoreNames.contains(nome)) continue;

        const def = DEFINICAO_TABELAS[nome];
        try {
          const store = nativeDb.createObjectStore(nome, {
            keyPath: def.keyPath,
            autoIncrement: def.autoIncrement,
          });
          def.indices.forEach(([idxNome, idxKeyPath]) => {
            store.createIndex(idxNome, idxKeyPath);
          });
          console.log('[db]   ✅', nome);
        } catch (err) {
          console.error('[db]   ❌ falhou criar', nome, ':', err.name, err.message);
        }
      }
    };

    req.onsuccess = (e) => {
      const nativeDb = e.target.result;
      console.log('[db] Setup nativo OK. Tabelas reais:', Array.from(nativeDb.objectStoreNames));
      nativeDb.close();
      resolve();
    };

    req.onerror = (e) => {
      console.error('[db] Erro no setup nativo:', e.target.error);
      resolve(); // não trava o app — segue tentando pelo Dexie mesmo assim
    };

    req.onblocked = () => {
      console.error('[db] Setup nativo bloqueado por outra aba/janela aberta.');
      resolve();
    };
  });
}

function criarBanco() {
  const instancia = new Dexie(NOME_BANCO);

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

/** @type {import('dexie').default} */
function obterInstancia() {
  if (!window.__gestaoClinicaDb) {
    const instancia = criarBanco();
    window.__gestaoClinicaDb = instancia;

    instancia.on('versionchange', () => {
      console.warn('[db] Outra janela está tentando atualizar o banco — fechando esta conexão.');
      instancia.close();
    });

    instancia.on('blocked', () => {
      console.error('[db] Upgrade do banco bloqueado — feche outras janelas/abas do app e recarregue.');
    });

    // 👇 O pulo do gato: garante as tabelas via API nativa ANTES de deixar
    // o Dexie abrir. Chamadas como db.table(x).toArray() feitas pelo app
    // antes disso terminar ficam enfileiradas pelo próprio Dexie
    // automaticamente (comportamento padrão dele), então não há problema
    // em não esperar isso aqui de forma síncrona.
    garantirTabelasNativas().then(() => {
      instancia.open()
        .then(() => {
          const tabelasReais = instancia.backendDB().objectStoreNames;
          console.log(
            `[db] Banco aberto. Tabelas reais (${tabelasReais.length}):`,
            Array.from(tabelasReais)
          );
        })
        .catch((err) => {
          console.error('[db] FALHA AO ABRIR O BANCO:', err && err.name, err && err.message);
        });
    });
  }

  return window.__gestaoClinicaDb;
}

export const db =
  typeof window !== 'undefined'
    ? obterInstancia()
    : ({});
