'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, Trash2, Edit3, Save, X, CheckCircle2, Clock, AlertTriangle, Eye, User, Phone, MapPin, Calendar, FileText } from 'lucide-react';

export default function Historico() {
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [editandoId, setEditandoId] = useState(null);
  const [dadosEditados, setDadosEditados] = useState({});
  const [visualizandoReg, setVisualizandoReg] = useState(null);

  const buscaInputRef = useRef(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setBuscaDebounced(busca);
    }, 150);
    return () => clearTimeout(handler);
  }, [busca]);

  useEffect(() => {
    const gerenciarAtalhos = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setBusca('');
        setBuscaDebounced('');
        buscaInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (visualizandoReg !== null) {
          setVisualizandoReg(null);
        } else if (editandoId !== null) {
          cancelarEdicao();
        }
      }
    };
    window.addEventListener('keydown', gerenciarAtalhos);
    return () => window.removeEventListener('keydown', gerenciarAtalhos);
  }, [editandoId, visualizandoReg]);

  const registros = useLiveQuery(async () => {
    let query;
    if (filtroStatus !== 'Todos') {
      query = db.encaminhamentos.where('status').equals(filtroStatus).reverse();
    } else {
      query = db.encaminhamentos.toCollection().reverse();
    }

    const resultado = await query.toArray();
    const termo = buscaDebounced.toLowerCase().trim();

    if (!termo) return resultado;

    return resultado.filter((p) => 
      (p.nome ?? '').toLowerCase().includes(termo) || 
      (p.cross ?? '').includes(termo) || 
      (p.dataNasc && p.dataNasc.includes(termo))
    );
  }, [buscaDebounced, filtroStatus]);

  const iniciarEdicao = (reg) => {
    setEditandoId(reg.id);
    setDadosEditados({ ...reg });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setDadosEditados({});
  };

  const salvarAlteracoes = async (id) => {
    try {
      await db.encaminhamentos.update(id, dadosEditados);
      setEditandoId(null);
      setDadosEditados({});
    } catch (error) {
      console.error("Erro ao atualizar:", error);
    }
  };

  const removerRegistro = async (id, nome) => {
    if (confirm(`Tem certeza que deseja excluir o registro de ${nome.toUpperCase()}?`)) {
      await db.encaminhamentos.delete(id);
      if (visualizandoReg?.id === id) setVisualizandoReg(null);
    }
  };

  const aplicarMascaraData = (valor) => {
    const v = valor.replace(/\D/g, '').slice(0, 8);
    if (v.length >= 5) return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  };

  const aplicarMascaraHour = (valor) => {
    const v = valor.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) return `${v.slice(0, 2)}:${v.slice(2)}`;
    return v;
  };

  const getStatusBadge = (status) => {
    if (status === 'Agendado') return 'text-green-700 bg-green-50 border-green-200';
    if (status === 'Enviado') return 'text-blue-700 bg-blue-50 border-blue-200';
    if (status === 'Retornado p/ Correção') return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black selection:bg-blue-200">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-blue-950 uppercase tracking-tight">Histórico de Encaminhamentos</h1>
            <p className="text-gray-500 text-xs font-medium italic">Consulte, gerencie e edite registros salvos localmente.</p>
          </div>
          <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold uppercase tracking-wider hidden sm:inline-block">
            Atalho Pesquisa: <kbd className="bg-white px-1 border shadow-sm">Ctrl + L</kbd>
          </span>
        </header>

        {/* Painel de Filtros e Busca */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              ref={buscaInputRef}
              type="text"
              placeholder="Pesquisar por Nome, CROSS ou Data de Nascimento..."
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-600 outline-none text-black font-medium transition-all placeholder:text-gray-400"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            {busca && (
              <button 
                onClick={() => { setBusca(''); setBuscaDebounced(''); buscaInputRef.current?.focus(); }}
                className="absolute right-3 top-3 text-gray-400 hover:text-black"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          <select 
            className="bg-gray-50 border-2 border-gray-200 text-xs rounded-lg p-2.5 text-black font-black uppercase tracking-wide cursor-pointer focus:border-blue-600 outline-none transition-all"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
          >
            <option value="Todos">Todos os Status</option>
            <option value="Pendente">Pendentes</option>
            <option value="Enviado">Enviados</option>
            <option value="Retornado p/ Correção">Retornados p/ Correção</option>
            <option value="Agendado">Agendados</option>
          </select>
        </div>

        {/* Tabela de Dados */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-900 text-gray-100 uppercase text-[10px] font-black tracking-widest border-b border-gray-800">
                <tr>
                  <th className="p-4 w-[120px]">Status</th>
                  <th className="p-4">CROSS / Paciente / Nasc.</th>
                  <th className="p-4">Especialidade / Telefone</th>
                  <th className="p-4">Agendamento (Local/Data/Hora)</th>
                  <th className="p-4 text-center w-[130px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-medium">
                {registros?.map((reg) => {
                  const isEditing = editandoId === reg.id;
                  return (
                    <tr 
                      key={reg.id} 
                      onClick={() => !isEditing && setVisualizandoReg(reg)}
                      className={`transition-colors duration-150 ${!isEditing && 'cursor-pointer'} ${
                        isEditing ? 'bg-amber-50/70 hover:bg-amber-50' : 'hover:bg-slate-50'
                      }`}
                      title={!isEditing ? "Clique para ver detalhes" : ""}
                    >
                      {/* COLUNA STATUS */}
                      <td className="p-4 align-middle" onClick={(e) => isEditing && e.stopPropagation()}>
                        {isEditing ? (
                          <select 
                            className="p-1.5 border-2 border-gray-300 rounded font-bold text-xs bg-white text-black focus:border-blue-600 outline-none uppercase"
                            value={dadosEditados.status}
                            onChange={(e) => setDadosEditados({...dadosEditados, status: e.target.value})}
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Enviado">Enviado</option>
                            <option value="Retornado p/ Correção">Retornado p/ Correção</option>
                            <option value="Agendado">Agendado</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1 font-black text-[10px] uppercase px-2 py-0.5 rounded border ${getStatusBadge(reg.status)}`}>
                            {reg.status === 'Agendado' ? (
                              <CheckCircle2 size={11}/>
                            ) : reg.status === 'Retornado p/ Correção' ? (
                              <AlertTriangle size={11}/>
                            ) : (
                              <Clock size={11}/>
                            )}
                            {reg.status}
                          </span>
                        )}
                      </td>

                      {/* COLUNA DADOS PESSOAIS */}
                      <td className="p-4 align-middle" onClick={(e) => isEditing && e.stopPropagation()}>
                        {isEditing ? (
                          <div className="space-y-1 max-w-xs">
                            <input 
                              className="w-full px-2 py-1 border-2 border-gray-300 rounded font-black text-blue-700 uppercase outline-none focus:border-blue-600" 
                              value={dadosEditados.cross} 
                              onChange={(e) => setDadosEditados({...dadosEditados, cross: e.target.value})} 
                            />
                            <input 
                              className="w-full px-2 py-1 border-2 border-gray-300 rounded uppercase text-black font-bold outline-none focus:border-blue-600" 
                              value={dadosEditados.nome} 
                              onChange={(e) => setDadosEditados({...dadosEditados, nome: e.target.value})} 
                            />
                            <input 
                              maxLength={10}
                              className="w-full px-2 py-1 border-2 border-gray-300 rounded text-xs font-bold outline-none focus:border-blue-600" 
                              value={dadosEditados.dataNasc || ''} 
                              onChange={(e) => setDadosEditados({...dadosEditados, dataNasc: aplicarMascaraData(e.target.value)})} 
                            />
                            <input 
                              placeholder="Motivo do Retorno / Correção"
                              className="w-full px-2 py-1 border-2 border-amber-300 rounded text-xs font-medium bg-amber-50 text-black outline-none focus:border-blue-600 placeholder:text-gray-400" 
                              value={dadosEditados.motivoCorrecao || ''} 
                              onChange={(e) => setDadosEditados({...dadosEditados, motivoCorrecao: e.target.value})} 
                            />
                          </div>
                        ) : (
                          <div className="space-y-0.5 max-w-md">
                            <div className="font-black text-blue-700 tracking-wide">{reg.cross}</div>
                            <div className="font-extrabold uppercase text-gray-900 text-sm">{reg.nome}</div>
                            <div className="text-gray-500 font-bold text-[11px]">NASC: {reg.dataNasc || 'Não informado'}</div>
                            
                            {reg.motivoCorrecao && (
                              <div className="mt-1.5 p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 text-[11px] font-medium shadow-sm">
                                <span className="font-black text-amber-800 uppercase text-[9px] tracking-wider block mb-0.5">Motivo da Correção:</span>
                                {reg.motivoCorrecao}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* COLUNA ESPECIALIDADE / CONTATO */}
                      <td className="p-4 align-middle" onClick={(e) => isEditing && e.stopPropagation()}>
                        {isEditing ? (
                          <div className="space-y-1 max-w-xs">
                            <input 
                              className="w-full px-2 py-1 border-2 border-gray-300 rounded uppercase font-bold text-gray-800 outline-none focus:border-blue-600" 
                              value={dadosEditados.especialidade} 
                              onChange={(e) => setDadosEditados({...dadosEditados, especialidade: e.target.value.toUpperCase()})} 
                            />
                            <input 
                              className="w-full px-2 py-1 border-2 border-gray-300 rounded font-bold text-gray-600 outline-none focus:border-blue-600" 
                              value={dadosEditados.telefone || ''} 
                              onChange={(e) => setDadosEditados({...dadosEditados, telefone: e.target.value})} 
                            />
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold uppercase text-gray-800">{reg.especialidade}</div>
                            <div className="text-gray-500 font-bold tracking-wide mt-0.5">{reg.telefone || '(00) 00000-0000'}</div>
                          </div>
                        )}
                      </td>

                      {/* COLUNA DETALHES AGENDAMENTO */}
                      <td className="p-4 align-middle" onClick={(e) => isEditing && e.stopPropagation()}>
                        {isEditing ? (
                          <div className="space-y-1 max-w-xs">
                            <input 
                              placeholder="Local (Ex: AME)" 
                              className="w-full px-2 py-1 border-2 border-gray-300 rounded uppercase font-bold outline-none focus:border-blue-600" 
                              value={dadosEditados.local || ''} 
                              onChange={(e) => setDadosEditados({...dadosEditados, local: e.target.value.toUpperCase()})} 
                            />
                            <div className="flex gap-1">
                              <input 
                                placeholder="Data" 
                                maxLength={10}
                                className="w-1/2 px-2 py-1 border-2 border-gray-300 rounded font-bold outline-none focus:border-blue-600" 
                                value={dadosEditados.dataConsulta || ''} 
                                onChange={(e) => setDadosEditados({...dadosEditados, dataConsulta: aplicarMascaraData(e.target.value)})} 
                              />
                              <input 
                                placeholder="Hora" 
                                maxLength={5}
                                className="w-1/2 px-2 py-1 border-2 border-gray-300 rounded font-bold outline-none focus:border-blue-600" 
                                value={dadosEditados.horaConsulta || ''} 
                                onChange={(e) => setDadosEditados({...dadosEditados, horaConsulta: aplicarMascaraHour(e.target.value)})} 
                              />
                            </div>
                          </div>
                        ) : (
                          reg.status === 'Agendado' ? (
                            <div className="space-y-0.5">
                              <div className="font-black uppercase text-gray-700 tracking-wide">{reg.local}</div>
                              <div className="text-gray-900 bg-slate-100 font-bold inline-block px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                                {reg.dataConsulta} às {reg.horaConsulta}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 font-bold italic tracking-wide">Aguardando Agendamento</span>
                          )
                        )}
                      </td>

                      {/* COLUNA AÇÕES */}
                      <td className="p-4 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-center items-center gap-1">
                          {isEditing ? (
                            <>
                              <button 
                                onClick={() => salvarAlteracoes(reg.id)} 
                                className="text-green-600 hover:bg-green-100 p-2 rounded-xl transition-colors" 
                                title="Salvar Alterações"
                              >
                                <Save size={18} />
                              </button>
                              <button 
                                onClick={cancelarEdicao} 
                                className="text-gray-400 hover:bg-gray-100 p-2 rounded-xl transition-colors" 
                                title="Cancelar (Esc)"
                              >
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => setVisualizandoReg(reg)} 
                                className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-xl transition-colors" 
                                title="Ver Detalhes"
                              >
                                <Eye size={16} />
                              </button>
                              <button 
                                onClick={() => iniciarEdicao(reg)} 
                                className="text-blue-600 hover:bg-blue-50 p-2 rounded-xl transition-colors" 
                                title="Editar Linha"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button 
                                onClick={() => removerRegistro(reg.id, reg.nome)} 
                                className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors" 
                                title="Excluir Registro"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {registros?.length === 0 && (
            <div className="text-center py-12 bg-white font-medium text-gray-400 italic">
              Nenhum encaminhamento encontrado com os filtros aplicados.
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE DETALHES (OVERLAY CLEAN) */}
      {visualizandoReg && (
        <div 
          className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
          onClick={() => setVisualizandoReg(null)} // Clicar fora fecha o modal
        >
          <div 
            className="bg-white rounded-[24px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-8"
            onClick={(e) => e.stopPropagation()} // Evita fechar ao clicar dentro do modal
          >
            
            {/* Cabeçalho Minimalista */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Detalhes do Encaminhamento</h2>
                  <span className={`inline-flex items-center gap-1 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full ${getStatusBadge(visualizandoReg.status)}`}>
                    {visualizandoReg.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium flex items-center gap-1.5">
                  <FileText size={14} className="text-gray-400"/> CROSS: {visualizandoReg.cross}
                </p>
              </div>
              <button 
                onClick={() => setVisualizandoReg(null)}
                className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Corpo com Grid Limpo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              
              <div>
                <p className="text-[11px] text-gray-400 font-medium mb-1 uppercase tracking-widest">Paciente</p>
                <p className="text-base font-semibold text-gray-900">{visualizandoReg.nome}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-medium mb-1 uppercase tracking-widest">Nascimento</p>
                <p className="text-base font-medium text-gray-800">{visualizandoReg.dataNasc || '—'}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-medium mb-1 uppercase tracking-widest">Especialidade</p>
                <p className="text-base font-semibold text-gray-900">{visualizandoReg.especialidade}</p>
              </div>

              <div>
                <p className="text-[11px] text-gray-400 font-medium mb-1 uppercase tracking-widest">Contato</p>
                <p className="text-base font-medium text-gray-800">{visualizandoReg.telefone || '—'}</p>
              </div>

              {/* Bloco de Agendamento Soft */}
              <div className="col-span-1 md:col-span-2 mt-2">
                <p className="text-[11px] text-gray-400 font-medium mb-3 uppercase tracking-widest border-b border-gray-100 pb-2">Agendamento</p>
                
                {visualizandoReg.status === 'Agendado' ? (
                  <div className="bg-gray-50/50 rounded-2xl p-5 flex flex-col sm:flex-row gap-8 items-start">
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1"><MapPin size={14}/> Local</p>
                      <p className="text-sm font-semibold text-gray-900 uppercase">{visualizandoReg.local}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1"><Calendar size={14}/> Data e Hora</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {visualizandoReg.dataConsulta} às {visualizandoReg.horaConsulta}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Consulta ainda não agendada.</p>
                )}
              </div>

              {/* Bloco de Correção (Só aparece se existir) */}
              {visualizandoReg.motivoCorrecao && (
                <div className="col-span-1 md:col-span-2 mt-2">
                  <div className="bg-amber-50/50 rounded-2xl p-5 border border-amber-100/50">
                    <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5 mb-1.5">
                      <AlertTriangle size={14}/> Motivo do Retorno / Correção
                    </p>
                    <p className="text-sm text-amber-900">{visualizandoReg.motivoCorrecao}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé Invisível (Apenas botões) */}
            <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-gray-100">
              <button 
                onClick={() => setVisualizandoReg(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                Fechar
              </button>
              <button 
                onClick={() => {
                  setVisualizandoReg(null);
                  iniciarEdicao(visualizandoReg);
                }}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <Edit3 size={16} /> Editar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}