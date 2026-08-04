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
export const db =
  typeof window !== 'undefined'
    ? criarBanco()
    : ({});
