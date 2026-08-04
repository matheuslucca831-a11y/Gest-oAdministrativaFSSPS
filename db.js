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
let instanciaUnica;

function obterInstancia() {
  // Garante que só existe UMA instância/conexão do Dexie em toda a aplicação,
  // mesmo se '@/db' for importado várias vezes por módulos diferentes do bundle.
  if (!instanciaUnica) {
    instanciaUnica = criarBanco();

    // Se outra aba/janela abrir uma versão mais nova, esta conexão precisa
    // fechar para não travar o upgrade dela.
    instanciaUnica.on('versionchange', () => {
      console.warn('[db] Outra janela está tentando atualizar o banco — fechando esta conexão.');
      instanciaUnica.close();
    });

    // Se esta conexão ficar bloqueada por outra aba/janela mais antiga que
    // ainda está aberta, avisa claramente em vez de falhar silenciosamente
    // numa versão desatualizada do schema.
    instanciaUnica.on('blocked', () => {
      console.error('[db] Upgrade do banco bloqueado — feche outras janelas/abas do app e recarregue.');
    });

    instanciaUnica.open().catch((err) => {
      console.error('[db] Falha ao abrir o banco:', err);
    });
  }

  return instanciaUnica;
}

export const db =
  typeof window !== 'undefined'
    ? obterInstancia()
    : ({});
