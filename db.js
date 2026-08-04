import Dexie from 'dexie';

export const db = new Dexie('GestaoClinicaFSPSS');

// V1 (mantida para histórico)
db.version(1).stores({
  encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
  pedidos: '++id, numeroPedido, data, categoria, status',
  materiais: '++id, codigo, descricao',
  remessas: '++id, numeroRemessa, destino, dataSaida'
});

// V2 (mantida para histórico)
db.version(2).stores({
  encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
  pedidos: '++id, numeroPedido, data, categoria, status',
  materiais: '++id, codigo, descricao',
  remessas: '++id, numeroRemessa, destino, dataSaida',
  sos: '++id, numeroOS, ano, unidade, dataSolicitacao, status'
});

// V3 (mantida para histórico)
db.version(3).stores({
  encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
  pedidos: '++id, numeroPedido, data, categoria, status',
  materiais: '++id, codigo, descricao',
  remessas: '++id, numeroRemessa, destino, dataSaida',
  sos: '++id, numeroOS, ano, unidade, dataSolicitacao, status',
  pacientes: 'cross, nome, dataNasc, telefone',
  exames: '++id, cross, examen, status, dataRegistro, dataChegada'
});

// V4 (mantida para histórico)
db.version(4).stores({
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
db.version(5).stores({
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
db.version(6).stores({
  encaminhamentos: '++id, nome, cross, dataRegistro, status, especialidade',
  pedidos: '++id, numeroPedido, data, categoria, status',
  materiais: '++id, codigo, descricao',
  remessas: '++id, numeroRemessa, destino, dataSaida',
  sos: '++id, numeroOS, ano, unidade, dataSolicitacao, status',
  pacientes: 'cross, nome, dataNasc, telefone',
  exames: '++id, cross, exame, status, dataRegistro, dataChegada',
  transferencias: '++id, unidadeSolicitante, solicitante, paciente, tipoSolicitacao, dataRegistro, status',
  profissionais: '++id, nome, matricula, cargo',
  
  // Nova tabela de cache adicionada aqui.
  // Indexamos id (chave primária do supabase), titulo e categoria para buscas rápidas.
  arquivos_cache: 'id, titulo, categoria'
});

// V7 (Protocolos de Exames Offline-First)
db.version(7).stores({
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

  // Nova tabela: indexamos id, nome e sigla para buscas rápidas
  protocolos_cache: 'id, nome, sigla' 
});

db.version(8).stores({
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
