'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, CheckCircle2, X, AlertTriangle, UserPlus, ClipboardList, RefreshCw } from 'lucide-react';
import { useProtocolos } from '../../hooks/useProtocolos';

export default function MarcarChegada() {
  const [busca, setBusca] = useState('');
  const [expandido, setExpandido] = useState<any>(null); 
  const [modoCorrecao, setModoCorrecao] = useState(false); 
  const [detalhes, setDetalhes] = useState({
    local: '',
    dataConsulta: '',
    horaConsulta: '',
    obs: '',
    motivoCorrecao: '' 
  });

  // ========================================================================
  // MECÂNICA DE PROTOCOLOS DE EXAMES (Supabase -> Dexie -> Mapa indexado)
  // ========================================================================
  const { protocolos: protocolosSupabase, isSyncing, sincronizarComSupabase } = useProtocolos();

  useEffect(() => {
    sincronizarComSupabase();
  }, []);

  const PROTOCOLOS_PADRAO = useMemo(() => {
    const mapa: Record<string, { sigla: string; checklist: string }> = {};

    protocolosSupabase.forEach((item: any) => {
      if (item.nome) {
        mapa[item.nome.toUpperCase()] = {
          sigla: item.sigla || '',
          checklist: item.checklist || 'Não requer exames complementares.',
        };
      }
    });

    return mapa;
  }, [protocolosSupabase]);

  const protocolos = PROTOCOLOS_PADRAO;

  // Protocolo ativo exibido no modal avulso
  const [protocoloAtivo, setProtocoloAtivo] = useState<{ sigla: string; checklist: string } | null>(null);

  // Autocomplete (dropdown) do campo Especialidade/Exame no modal avulso
  const [opcoesFiltradas, setOpcoesFiltradas] = useState<string[]>([]);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  // ========================================================================

  // ESTADOS DO MODAL AVULSO (Ctrl + R)
  const [showModalAvulso, setShowModalAvulso] = useState(false);
  const [avulsoEncontrado, setAvulsoEncontrado] = useState(false); 
  const [formAvulso, setFormAvulso] = useState({
    cross: '',
    nome: '',
    dataNasc: '',
    telefone: '',
    especialidade: '',
    local: '',
    dataConsulta: '',
    horaConsulta: '',
    obs: ''
  });

  // Referências da lista principal
  const [indiceSelecionado, setIndiceSelecionado] = useState(0);
  const buscaRef = useRef<HTMLInputElement>(null);
  const localRef = useRef<HTMLInputElement>(null);
  const dataConsultaRef = useRef<HTMLInputElement>(null);
  const horaConsultaRef = useRef<HTMLInputElement>(null);
  const obsRef = useRef<HTMLInputElement>(null);
  const motivoCorrecaoRef = useRef<HTMLInputElement>(null);

  // Referências da Esteira do Modal Avulso (Ctrl + R)
  const avulsoCrossRef = useRef<HTMLInputElement>(null);
  const avulsoNomeRef = useRef<HTMLInputElement>(null);
  const avulsoNascRef = useRef<HTMLInputElement>(null);
  const avulsoTelRef = useRef<HTMLInputElement>(null);
  const avulsoEspRef = useRef<HTMLInputElement>(null);
  const avulsoLocalRef = useRef<HTMLInputElement>(null);
  const avulsoDataRef = useRef<HTMLInputElement>(null);
  const avulsoHoraRef = useRef<HTMLInputElement>(null);
  const avulsoObsRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIndiceSelecionado(0);
  }, [busca]);

  // GATILHOS DE ATALHO GLOBAIS (Ctrl + L e Ctrl + R)
  useEffect(() => {
    buscaRef.current?.focus();

    const lidarAtalhoTeclado = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        fecharEVoltarABusca();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r') {
        e.preventDefault(); 
        abrirModalAvulso();
      }
    };

    window.addEventListener('keydown', lidarAtalhoTeclado);
    return () => window.removeEventListener('keydown', lidarAtalhoTeclado);
  }, [expandido, indiceSelecionado, showModalAvulso]);

  // Filtro Dexie principal
  const pacientesPentes = useLiveQuery(async () => {
    const termo = busca.toLowerCase().trim();
    const pendentes = await (db as any).encaminhamentos
      .where('status')
      .anyOf(['Pendente', 'Enviado'])
      .reverse()
      .toArray();

    if (!termo) return pendentes.slice(0, 10); 

    return pendentes.filter((p: any) => 
      (p.nome ?? '').toLowerCase().includes(termo) || 
      (p.cross ?? '').includes(termo) || 
      (p.dataNasc && p.dataNasc.includes(termo))
    );
  }, [busca]);

  const pularAoApertarEnter = (e: React.KeyboardEvent, proximoRef: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      proximoRef.current?.focus();
    }
  };

  // Busca inteligente no banco pelo Cross
  const buscarDadosPorCross = async (crossConsulta: string) => {
    const termo = crossConsulta.trim().toUpperCase();
    if (!termo || termo.length < 4) return;

    const match = await (db as any).encaminhamentos
      .filter((item: any) => item.cross && item.cross.toUpperCase() === termo)
      .first();

    if (match) {
      setFormAvulso(prev => ({
        ...prev,
        nome: match.nome || prev.nome,
        dataNasc: match.dataNasc || prev.dataNasc,
        telefone: match.telefone || prev.telefone,
      }));
      setAvulsoEncontrado(true);
    }
  };

  const abrirFormulario = (paciente: any, modo = 'chegada') => {
    setExpandido(paciente.id);
    setModoCorrecao(modo === 'correcao');
    setDetalhes({
      local: paciente.local || '',
      dataConsulta: '',
      horaConsulta: '',
      obs: '',
      motivoCorrecao: ''
    });

    if (modo === 'correcao') {
      setTimeout(() => motivoCorrecaoRef.current?.focus(), 50);
    } else {
      setTimeout(() => localRef.current?.focus(), 50);
    }
  };

  const confirmarChegada = async (id: number) => {
    if (!detalhes.local || !detalhes.dataConsulta) {
      alert("Por favor, preencha pelo menos o Local e a Data Marcada!");
      return;
    }

    await (db as any).encaminhamentos.update(id, {
      local: detalhes.local,
      dataConsulta: detalhes.dataConsulta,
      horaConsulta: detalhes.horaConsulta,
      obs: detalhes.obs,
      status: 'Agendado',
      dataChegada: new Date().toLocaleDateString('pt-BR')
    });

    fecharEVoltarABusca();
  };

  const confirmarCorrecao = async (id: number) => {
    if (!detalhes.motivoCorrecao.trim()) {
      alert("Por favor, digite o motivo da correção!");
      return;
    }

    await (db as any).encaminhamentos.update(id, {
      status: 'Retornado p/ Correção',
      motivoCorrecao: detalhes.motivoCorrecao,
      dataRetornoRegulacao: new Date().toLocaleDateString('pt-BR')
    });

    fecharEVoltarABusca();
  };

  const fecharEVoltarABusca = () => {
    setExpandido(null);
    setModoCorrecao(false);
    setShowModalAvulso(false);
    setAvulsoEncontrado(false);
    setBusca('');
    setProtocoloAtivo(null);
    setMostrarDropdown(false);
    setTimeout(() => buscaRef.current?.focus(), 50);
  };

  const abrirModalAvulso = () => {
    setFormAvulso({ cross: '', nome: '', dataNasc: '', telefone: '', especialidade: '', local: '', dataConsulta: '', horaConsulta: '', obs: '' });
    setAvulsoEncontrado(false);
    setProtocoloAtivo(null);
    setMostrarDropdown(false);
    setShowModalAvulso(true);
    setExpandido(null);
    sincronizarComSupabase(); // garante que os protocolos estão atualizados ao abrir
    setTimeout(() => avulsoCrossRef.current?.focus(), 50);
  };

  const salvarEncaminhamentoAvulso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAvulso.cross || !formAvulso.nome || !formAvulso.local || !formAvulso.dataConsulta) {
      alert("Preencha no mínimo: CROSS, Nome, Local e Data!");
      return;
    }

    const hoje = new Date().toLocaleDateString('pt-BR');

    await (db as any).encaminhamentos.add({
      cross: formAvulso.cross.toUpperCase(),
      nome: formAvulso.nome.toUpperCase(),
      dataNasc: formAvulso.dataNasc,
      telefone: formAvulso.telefone,
      especialidade: formAvulso.especialidade.toUpperCase(),
      local: formAvulso.local.toUpperCase(),
      dataConsulta: formAvulso.dataConsulta,
      horaConsulta: formAvulso.horaConsulta,
      obs: formAvulso.obs.toUpperCase(),
      status: 'Agendado', 
      dataRegistro: hoje,
      dataChegada: hoje
    });

    fecharEVoltarABusca();
  };

  // Máscaras automáticas
  const aplicarMascaraData = (valor: string) => {
    const v = valor.replace(/\D/g, '').slice(0, 8);
    if (v.length >= 5) return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  };

  const aplicarMascaraHora = (valor: string) => {
    const v = valor.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) return `${v.slice(0, 2)}:${v.slice(2)}`;
    return v;
  };

  const aplicarMascaraTel = (valor: string) => {
    const v = valor.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    if (v.length > 2) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
    return v;
  };

  // ========================================================================
  // LÓGICA DO AUTOCOMPLETE DE PROTOCOLOS (campo Especialidade/Exame do avulso)
  // ========================================================================
  const handleEspecialidadeAvulsoChange = (valor: string) => {
    const valorMaiusculo = valor.toUpperCase();
    setFormAvulso(prev => ({ ...prev, especialidade: valorMaiusculo }));

    if (valorMaiusculo.length > 0) {
      const filtradas = Object.keys(protocolos).filter(key =>
        key.includes(valorMaiusculo) || (protocolos[key]?.sigla || '').includes(valorMaiusculo)
      );
      setOpcoesFiltradas(filtradas);
      setMostrarDropdown(filtradas.length > 0);
      setIndiceAtivo(0);
    } else {
      setMostrarDropdown(false);
    }

    if (protocolos[valorMaiusculo]) {
      setProtocoloAtivo(protocolos[valorMaiusculo]);
    } else {
      setProtocoloAtivo(null);
    }
  };

  const selecionarEspecialidadeAvulso = (nomeEspecialidade: string) => {
    setFormAvulso(prev => ({ ...prev, especialidade: nomeEspecialidade }));
    setProtocoloAtivo(protocolos[nomeEspecialidade]);
    setMostrarDropdown(false);
    setOpcoesFiltradas([]);
    avulsoEspRef.current?.focus();
  };

  const handleEspecialidadeAvulsoKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (mostrarDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIndiceAtivo(prev => (prev + 1) % opcoesFiltradas.length);
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIndiceAtivo(prev => (prev - 1 + opcoesFiltradas.length) % opcoesFiltradas.length);
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selecionarEspecialidadeAvulso(opcoesFiltradas[indiceAtivo]);
        return;
      } else if (e.key === 'Escape') {
        setMostrarDropdown(false);
        return;
      }
    }
    // Se o dropdown não estiver aberto, Enter apenas avança de campo
    pularAoApertarEnter(e, avulsoLocalRef);
  };
  // ========================================================================

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black selection:bg-blue-200">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-black text-blue-950 uppercase flex items-center gap-2 tracking-tight">
            <CheckCircle2 className="text-green-600" size={22} /> Marcar Chegada de Malote
          </h1>
          <div className="flex gap-2">
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold uppercase tracking-wider border border-blue-200">
              <kbd className="bg-white px-1 shadow-sm font-black">Ctrl + R</kbd> Entrada Direta
            </span>
            <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold uppercase tracking-wider">
              <kbd className="bg-white px-1 shadow-sm">Ctrl + L</kbd> Limpar
            </span>
          </div>
        </div>

        {/* INPUT DE BUSCA */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            ref={buscaRef}
            type="text"
            placeholder="Digite Nome, CROSS ou Data e aperte [ENTER]..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-600 outline-none shadow-sm text-lg font-medium text-black transition-all placeholder:text-gray-400"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setIndiceSelecionado((prev) => Math.min(prev + 1, (pacientesPentes?.length ?? 1) - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setIndiceSelecionado((prev) => Math.max(prev - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (pacientesPentes && pacientesPentes[indiceSelecionado]) {
                  abrirFormulario(pacientesPentes[indiceSelecionado], 'chegada');
                }
              }
            }}
          />
          {busca && (
            <button onClick={fecharEVoltarABusca} className="absolute right-4 top-4 text-gray-400 hover:text-black">
              <X size={18} />
            </button>
          )}
        </div>

        {/* LISTAGEM PRINCIPAL */}
        <div className="space-y-3">
          {pacientesPentes?.map((p: any, index: number) => {
            const isSelected = expandido === p.id;
            const isFocused = indiceSelecionado === index && expandido === null && !showModalAvulso; 

            return (
              <div 
                key={p.id} 
                className={`bg-white rounded-xl border-2 transition-all overflow-hidden ${
                  isSelected ? 'border-blue-600 shadow-md ring-2 ring-blue-100' : 
                  isFocused ? 'border-blue-400 ring-1 ring-blue-200' : 
                  'border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">CROSS: {p.cross}</span>
                      {p.dataNasc && <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">NASC: {p.dataNasc}</span>}
                      {isFocused && <span className="text-[9px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded animate-pulse">PRESSIONE ENTER</span>}
                    </div>
                    <h3 className="font-extrabold text-gray-900 uppercase text-base truncate">{p.nome}</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mt-0.5">Procedimento: <span className="text-gray-700">{p.especialidade}</span></p>
                  </div>
                  
                  {!isSelected ? (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => abrirFormulario(p, 'chegada')}
                        className="bg-gray-900 text-white px-5 py-2 rounded-lg text-xs font-black hover:bg-blue-600 transition-all uppercase tracking-wider"
                      >
                        Acessar
                      </button>
                      <button
                        onClick={() => abrirFormulario(p, 'correcao')}
                        className="border-2 border-amber-500 text-amber-600 hover:bg-amber-50 px-4 py-2 rounded-lg text-xs font-black transition-all uppercase tracking-wider flex items-center gap-1"
                      >
                        <AlertTriangle size={14} /> Correção
                      </button>
                    </div>
                  ) : (
                    <button onClick={fecharEVoltarABusca} className="text-gray-400 hover:text-red-500 p-1">
                      <X size={22} />
                    </button>
                  )}
                </div>

                {isSelected && (
                  <>
                    {!modoCorrecao && (
                      <div className="bg-slate-50 p-4 border-t-2 border-blue-600 grid grid-cols-1 md:grid-cols-4 gap-3 text-[11px]">
                        <div>
                          <label className="block font-black text-gray-500 uppercase mb-1">Local da Consulta</label>
                          <input
                            ref={localRef}
                            type="text"
                            list="locais-comuns"
                            className="w-full px-3 py-2 rounded border-2 border-gray-300 outline-none focus:border-blue-600 text-black font-bold uppercase transition-all"
                            placeholder="Ex: AME CARAGUA"
                            value={detalhes.local}
                            onChange={(e) => setDetalhes({...detalhes, local: e.target.value.toUpperCase()})}
                            onKeyDown={(e) => pularAoApertarEnter(e, dataConsultaRef)} 
                          />
                          <datalist id="locais-comuns">
                            <option value="AME CARAGUATATUBA" />
                            <option value="HOSPITAL REGIONAL" />
                            <option value="HOSPITAL CLÍNICA SÃO SEBASTIÃO" />
                            <option value="FSPSS CENTRO" />
                          </datalist>
                        </div>

                        <div>
                          <label className="block font-black text-gray-500 uppercase mb-1">Data Marcada</label>
                          <input
                            ref={dataConsultaRef}
                            type="text"
                            maxLength={10}
                            className="w-full px-3 py-2 rounded border-2 border-gray-300 outline-none focus:border-blue-600 text-black font-bold transition-all"
                            placeholder="DD/MM/AAAA"
                            value={detalhes.dataConsulta}
                            onChange={(e) => setDetalhes({...detalhes, dataConsulta: aplicarMascaraData(e.target.value)})}
                            onKeyDown={(e) => pularAoApertarEnter(e, horaConsultaRef)} 
                          />
                        </div>

                        <div>
                          <label className="block font-black text-gray-500 uppercase mb-1">Horário</label>
                          <input
                            ref={horaConsultaRef}
                            type="text"
                            maxLength={5}
                            className="w-full px-3 py-2 rounded border-2 border-gray-300 outline-none focus:border-blue-600 text-black font-bold transition-all"
                            placeholder="00:00"
                            value={detalhes.horaConsulta}
                            onChange={(e) => setDetalhes({...detalhes, horaConsulta: aplicarMascaraHora(e.target.value)})}
                            onKeyDown={(e) => pularAoApertarEnter(e, obsRef)} 
                          />
                        </div>

                        <div>
                          <label className="block font-black text-gray-500 uppercase mb-1">Observações</label>
                          <input
                            ref={obsRef}
                            type="text"
                            className="w-full px-3 py-2 rounded border-2 border-gray-300 outline-none focus:border-blue-600 text-black font-medium transition-all uppercase"
                            placeholder="Opcional"
                            value={detalhes.obs}
                            onChange={(e) => setDetalhes({...detalhes, obs: e.target.value.toUpperCase()})}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                confirmarChegada(p.id); 
                              }
                            }}
                          />
                        </div>

                        <div className="md:col-span-4 mt-2 flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                          <span className="text-[10px] text-gray-400 font-medium italic">Dica: Preencha e aperte <kbd className="font-bold bg-gray-100 px-1 rounded border">Enter</kbd> para avançar e salvar.</span>
                          <div className="flex gap-2">
                            <button onClick={fecharEVoltarABusca} className="px-3 py-1.5 text-gray-500 font-bold hover:underline">CANCELAR</button>
                            <button onClick={() => confirmarChegada(p.id)} className="px-6 py-1.5 bg-blue-600 text-white font-black rounded text-xs hover:bg-blue-700 shadow uppercase">Confirmar [Enter]</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {modoCorrecao && (
                      <div className="bg-amber-50 p-4 border-t-2 border-amber-500 grid grid-cols-1 gap-3 text-[11px]">
                        <div>
                          <label className="block font-black text-amber-900 uppercase mb-1">Motivo do Retorno / Correção da Regulação</label>
                          <input
                            ref={motivoCorrecaoRef}
                            type="text"
                            className="w-full px-3 py-2 rounded border-2 border-amber-300 outline-none focus:border-amber-600 text-black font-bold uppercase transition-all"
                            placeholder="Ex: LAUDO MÉDICO ANTIGO OU CUSTEIO PENDENTE"
                            value={detalhes.motivoCorrecao}
                            onChange={(e) => setDetalhes({...detalhes, motivoCorrecao: e.target.value.toUpperCase()})}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                confirmarCorrecao(p.id);
                              }
                            }}
                          />
                        </div>

                        <div className="mt-1 flex justify-between items-center bg-white p-2 rounded border border-amber-200">
                          <span className="text-[10px] text-amber-700 font-medium italic">Aperte <kbd className="font-bold bg-amber-100 px-1 rounded border">Enter</kbd> para dar baixa.</span>
                          <div className="flex gap-2">
                            <button onClick={fecharEVoltarABusca} className="px-3 py-1.5 text-gray-500 font-bold hover:underline">CANCELAR</button>
                            <button onClick={() => confirmarCorrecao(p.id)} className="px-6 py-1.5 bg-amber-600 text-white font-black rounded text-xs hover:bg-amber-700 shadow uppercase">Dar Baixa [Enter]</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE ENTRADA DIRETA / AVULSA (Gatilho: Ctrl + R) */}
      {/* ========================================================================= */}
      {showModalAvulso && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl overflow-hidden">
            
            <div className="bg-blue-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="text-blue-400" size={20} />
                <h2 className="text-sm font-black uppercase tracking-wider">Entrada Direta (Avulso)</h2>
                {isSyncing && <RefreshCw size={14} className="animate-spin text-blue-300 ml-1" />}
              </div>
              <span className="text-[10px] bg-blue-900 text-blue-200 px-2 py-0.5 rounded uppercase font-bold">Gerando Agendamento Direto</span>
            </div>

            <form onSubmit={salvarEncaminhamentoAvulso} className="p-6 text-xs space-y-4">
              
              {/* BLOCO 1: DADOS PACIENTE */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-3">
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider">1. Identificação do Paciente</span>
                  {avulsoEncontrado && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1 animate-pulse">
                      <CheckCircle2 size={12} className="text-emerald-600" /> DADOS PUXADOS DO HISTÓRICO
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-500 uppercase mb-1">Nº CROSS *</label>
                    <input 
                      ref={avulsoCrossRef} type="text" required placeholder="000.000"
                      className="w-full bg-white border border-gray-300 rounded p-2 font-black uppercase outline-none focus:border-blue-600"
                      value={formAvulso.cross} 
                      onChange={e => {
                        setFormAvulso({...formAvulso, cross: e.target.value.toUpperCase()});
                        if (avulsoEncontrado) setAvulsoEncontrado(false);
                      }}
                      onBlur={e => buscarDadosPorCross(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          await buscarDadosPorCross(formAvulso.cross);
                          avulsoNomeRef.current?.focus();
                        }
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold text-gray-500 uppercase mb-1">Nome Completo *</label>
                    <input 
                      ref={avulsoNomeRef} type="text" required placeholder="PACIENTE"
                      className="w-full bg-white border border-gray-300 rounded p-2 font-bold uppercase outline-none focus:border-blue-600"
                      value={formAvulso.nome} onChange={e => setFormAvulso({...formAvulso, nome: e.target.value.toUpperCase()})}
                      onKeyDown={e => pularAoApertarEnter(e, avulsoNascRef)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-500 uppercase mb-1">Data Nasc.</label>
                    <input 
                      ref={avulsoNascRef} type="text" maxLength={10} placeholder="DD/MM/AAAA"
                      className="w-full bg-white border border-gray-300 rounded p-2 font-bold outline-none focus:border-blue-600"
                      value={formAvulso.dataNasc} onChange={e => setFormAvulso({...formAvulso, dataNasc: aplicarMascaraData(e.target.value)})}
                      onKeyDown={e => pularAoApertarEnter(e, avulsoTelRef)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-500 uppercase mb-1">Telefone</label>
                    <input 
                      ref={avulsoTelRef} type="text" maxLength={15} placeholder="(12) 99999-9999"
                      className="w-full bg-white border border-gray-300 rounded p-2 font-bold outline-none focus:border-blue-600"
                      value={formAvulso.telefone} onChange={e => setFormAvulso({...formAvulso, telefone: aplicarMascaraTel(e.target.value)})}
                      onKeyDown={e => pularAoApertarEnter(e, avulsoEspRef)}
                    />
                  </div>
                  
                  {/* CAMPO DE ESPECIALIDADE COM AUTOCOMPLETE PROPRIO (dropdown navegável) */}
                  <div className="relative">
                    <label className="block font-bold text-gray-500 uppercase mb-1">Especialidade / Exame *</label>
                    <input 
                      ref={avulsoEspRef} 
                      type="text" 
                      required 
                      placeholder="Ex: ORTOPEDIA"
                      autoComplete="off"
                      className="w-full bg-white border border-gray-300 rounded p-2 font-black uppercase outline-none focus:border-blue-600"
                      value={formAvulso.especialidade} 
                      onChange={e => handleEspecialidadeAvulsoChange(e.target.value)}
                      onKeyDown={handleEspecialidadeAvulsoKeyDown}
                      onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
                    />

                    {mostrarDropdown && (
                      <ul className="absolute z-20 w-full bg-white border border-gray-200 shadow-xl rounded-b-lg mt-1 max-h-48 overflow-y-auto">
                        {opcoesFiltradas.map((opcao, index) => (
                          <li 
                            key={opcao}
                            onClick={() => selecionarEspecialidadeAvulso(opcao)}
                            className={`px-3 py-2 text-[11px] font-bold cursor-pointer transition-colors flex justify-between items-center ${index === indiceAtivo ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-50'}`}
                          >
                            {opcao}
                            <span className={`text-[9px] px-1 rounded ${index === indiceAtivo ? 'bg-blue-500 text-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                              {protocolos[opcao]?.sigla}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* PAINEL DINÂMICO DE PROTOCOLO/REQUISITOS */}
                {protocoloAtivo && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 font-black uppercase text-amber-950 mb-1">
                      <ClipboardList size={14} className="text-amber-700" />
                      Protocolo: {protocoloAtivo.sigla} — Critérios Obrigatórios
                    </div>
                    <p className="whitespace-pre-line font-medium leading-relaxed bg-white/60 p-2 rounded border border-amber-100">
                      {protocoloAtivo.checklist}
                    </p>
                  </div>
                )}

              </div>

              {/* BLOCO 2: DADOS AGENDAMENTO */}
              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-3">
                <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider block">2. Dados da Chegada / Agendamento</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-gray-600 uppercase mb-1">Local Marcado *</label>
                    <input 
                      ref={avulsoLocalRef} type="text" required placeholder="AME CARAGUA" list="locais-comuns"
                      className="w-full bg-white border border-gray-300 rounded p-2 font-bold uppercase outline-none focus:border-blue-600"
                      value={formAvulso.local} onChange={e => setFormAvulso({...formAvulso, local: e.target.value.toUpperCase()})}
                      onKeyDown={e => pularAoApertarEnter(e, avulsoDataRef)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 uppercase mb-1">Data Marcada *</label>
                    <input 
                      ref={avulsoDataRef} type="text" required maxLength={10} placeholder="DD/MM/AAAA"
                      className="w-full bg-white border border-gray-300 rounded p-2 font-bold outline-none focus:border-blue-600"
                      value={formAvulso.dataConsulta} onChange={e => setFormAvulso({...formAvulso, dataConsulta: aplicarMascaraData(e.target.value)})}
                      onKeyDown={e => pularAoApertarEnter(e, avulsoHoraRef)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-600 uppercase mb-1">Horário</label>
                    <input 
                      ref={avulsoHoraRef} type="text" maxLength={5} placeholder="08:00"
                      className="w-full bg-white border border-gray-300 rounded p-2 font-bold outline-none focus:border-blue-600"
                      value={formAvulso.horaConsulta} onChange={e => setFormAvulso({...formAvulso, horaConsulta: aplicarMascaraHora(e.target.value)})}
                      onKeyDown={e => pularAoApertarEnter(e, avulsoObsRef)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-600 uppercase mb-1">Observações de Balcão</label>
                  <input 
                    ref={avulsoObsRef} type="text" placeholder="..."
                    className="w-full bg-white border border-gray-300 rounded p-2 font-medium uppercase outline-none focus:border-blue-600"
                    value={formAvulso.obs} onChange={e => setFormAvulso({...formAvulso, obs: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-[10px] text-gray-400 italic">Vá apertando <kbd className="font-bold bg-gray-100 px-1 border">Enter</kbd> para pular de campo.</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowModalAvulso(false)} className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded">CANCELAR</button>
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-black px-6 py-2 rounded shadow uppercase tracking-wide">
                    Salvar e Dar Baixa [Enter]
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
