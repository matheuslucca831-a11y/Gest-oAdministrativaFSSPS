import Dexie from 'dexie';

function criarBanco() {
  const instancia = new Dexie('GestaoClinicaFSPSS');

  // V1 (mantida para histórico)
  instancia.version(1).stores({
    encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
    pedidos: '++id, numeroPedido, data, categoria, status',
    materiais: '++id, codigo, descricao',
    remessas: '++id, numeroRemessa, destino, dataSaida'
  });

  // V2 (mantida para histórico)
  instancia.version(2).stores({
    encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
    pedidos: '++id, numeroPedido, data, categoria, status',
    materiais: '++id, codigo, descricao',
    remessas: '++id, numeroRemessa, destino, dataSaida',
    sos: '++id, numeroOS, ano, unidade, dataSolicitacao, status'
  });

  // V3 (mantida para histórico)
  instancia.version(3).stores({
    encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
    pedidos: '++id, numeroPedido, data, categoria, status',
    materiais: '++id, codigo, descricao',
    remessas: '++id, numeroRemessa, destino, dataSaida',
    sos: '++id, numeroOS, ano, unidade, dataSolicitacao, status',
    pacientes: 'cross, nome, dataNasc, telefone',
    exames: '++id, cross, examen, status, dataRegistro, dataChegada'
  });

  // V4 (mantida para histórico)
  instancia.version(4).stores({
    encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
    pedidos: '++id, numeroPedido, data, categoria, status',
    materiais: '++id, codigo, descricao',
    remessas: '++id, numeroRemessa, destino, dataSaida',
    sos: '++id, numeroOS, ano, unidade, dataSolicitacao, status',
    pacientes: 'cross, nome, dataNasc, telefone',
    exames: '++id, cross, exame, status, dataRegistro, dataChegada',
    transferencias: '++id, unidadeSolicitante, solicitante, paciente, tipoSolicitacao, dataRegistro, status'
  });

  // V5 (mantida para histórico)
  instancia.version(5).stores({
    encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
    pedidos: '++id, numeroPedido, data, categoria, status',
    materiais: '++id, codigo, descricao',
    remessas: '++id, numeroRemessa, destino, dataSaida',
    sos: '++id, numeroOS, ano, unidade, dataSolicitacao, status',
    pacientes: 'cross, nome, dataNasc, telefone',
    exames: '++id, cross, exame, status, dataRegistro, dataChegada',
    transferencias: '++id, unidadeSolicitante, solicitante, paciente, tipoSolicitacao, dataRegistro, status',
    profissionais: '++id, nome, matricula, cargo'
  });

  // V6 (Nova versão para os arquivos impressos em cache offline)
  instancia.version(6).stores({
    encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
    pedidos: '++id, numeroPedido, data, categoria, status',
    materiais: '++id, codigo, descricao',
    remessas: '++id, numeroRemessa, destino, dataSaida',
    sos: '++id, numeroOS, ano, unidade, dataSolicitacao, status',
    pacientes: 'cross, nome, dataNasc, telefone',
    exames: '++id, cross, exame, status, dataRegistro, dataChegada',
    transferencias: '++id, unidadeSolicitante, solicitante, paciente, tipoSolicitacao, dataRegistro, status',
    profissionais: '++id, nome, matricula, cargo',
    arquivos_cache: 'id, titulo, categoria'
  });

  // V7 (Protocolos de Exames Offline-First)
  instancia.version(7).stores({
    encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
    pedidos: '++id, numeroPedido, data, categoria, status',
    materiais: '++id, codigo, descricao',
    remessas: '++id, numeroRemessa, destino, dataSaida',
    sos: '++id, numeroOS, ano, unidade, dataSolicitacao, status',
    pacientes: 'cross, nome, dataNasc, telefone',
    exames: '++id, cross, exame, status, dataRegistro, dataChegada',
    transferencias: '++id, unidadeSolicitante, solicitante, paciente, tipoSolicitacao, dataRegistro, status',
    profissionais: '++id, nome, matricula, cargo',
    arquivos_cache: 'id, titulo, categoria',
    protocolos_cache: 'id, nome, sigla'
  });

  // V8
  instancia.version(8).stores({
    encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
    pedidos: '++id, numeroPedido, data, categoria, status',
    materiais: '++id, codigo, descricao',
    remessas: '++id, numeroRemessa, destino, dataSaida',
    sos: '++id, numeroOS, ano, unidade, dataSolicitacao, status',
    pacientes: 'cross, nome, dataNasc, telefone',
    exames: '++id, cross, exame, status, dataRegistro, dataChegada',
    transferencias: '++id, unidadeSolicitante, solicitante, paciente, tipoSolicitacao, dataRegistro, status',
    profissionais: '++id, nome, matricula, cargo',
    arquivos_cache: 'id, titulo, categoria',
    protocolos_cache: 'id, nome, sigla',
    produtos_pedidos_cache: 'id, categoria, tipo_pedido'
  });

  // V9 (Quadro e Frequência)
  instancia.version(9).stores({
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
    frequencia: '++id, [profissional_id+data], data'
  });

  // V10 (Isolamento da tabela da tela de Produtividade)
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

    instancia.open().catch((err) => {
      console.error('[db] Falha ao abrir o banco:', err);
    });

    window.__gestaoClinicaDb = instancia;
  }

  return window.__gestaoClinicaDb;
}

export const db =
  typeof window !== 'undefined'
    ? obterInstancia()
    : ({});
