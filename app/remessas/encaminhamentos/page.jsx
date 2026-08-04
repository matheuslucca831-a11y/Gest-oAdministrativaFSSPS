'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, List, Eye, Loader2, Users, Search, Calendar, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/db';
// IMPORTANTE: Ajuste o caminho da importação de acordo com a sua pasta utils e imagens
import { imprimirHtmlNoDesktop } from '@/utils/print'; 
import { logoBrasil, logoFSPSS } from '@/app/imagens'; 

export default function CriarGuiaEncaminhamento() {
  const [dadosGuia, setDadosGuia] = useState({
    de: '',
    para: 'CENTRAL DE REGULAÇÃO',
    ac: 'RESPONSÁVEL',
  });
  const [htmlPreview, setHtmlPreview] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [pacientesSelecionados, setPacientesSelecionados] = useState([]);
  const [busca, setBusca] = useState('');
  const [dataFiltro, setDataFiltro] = useState(''); 
  const [carregandoPacientes, setCarregandoPacientes] = useState(true);

  const [guiaGerada, setGuiaGerada] = useState(null);
  const [proximoNumero, setProximoNumero] = useState(null);
  const [carregandoNumero, setCarregandoNumero] = useState(true);

  // 1. BUSCA O PRÓXIMO NÚMERO COMPARTILHADO DA SEQUÊNCIA DE REMESSAS
  useEffect(() => {
    async function buscarUltimoNumero() {
      try {
        setCarregandoNumero(true);
        const anoAtual = new Date().getFullYear().toString();
        const todasAsRemessas = await db.remessas.toArray();

        const remessasDoAno = todasAsRemessas.filter(r => {
          if (!r.dataSaida) return false;
          return r.dataSaida.includes(anoAtual);
        });

        if (remessasDoAno.length > 0) {
          const numeros = remessasDoAno.map(r => Number(r.numeroRemessa) || 0);
          const maiorNumero = Math.max(...numeros);
          setProximoNumero(maiorNumero + 1);
        } else {
          setProximoNumero(1);
        }
      } catch (error) {
        console.error('Erro ao ler numeração do Dexie:', error);
        setProximoNumero(1); 
      } finally {
        setCarregandoNumero(false);
      }
    }
    buscarUltimoNumero();
  }, []);

  // 2. CARREGA OS PACIENTES PENDENTES DO DEXIE
  useEffect(() => {
    async function carregarPacientes() {
      try {
        setCarregandoPacientes(true);
        if (db.encaminhamentos) {
          const dados = await db.encaminhamentos.where('status').equals('Pendente').toArray();
          setPacientes(dados);
        } else {
          setPacientes([
            { id: 1, nome: 'SIDNEI DONIZETE MATIAS', 'especialidade': 'ORTOPEDISTA', status: 'Pendente', dataRegistro: '2026-05-15' },
            { id: 2, nome: 'TAIANARA OLIVEIRA DOS SANTOS', 'especialidade': 'DERMATOLOGISTA', status: 'Pendente', dataRegistro: '2026-05-15' },
            { id: 3, nome: 'SILMARA REGINA BATISTA DA ROCHA', 'especialidade': 'ORTOPEDISTA', status: 'Pendente', dataRegistro: '2026-05-16' },
            { id: 4, nome: 'JOSE MARCOS DA SILVA', 'especialidade': 'OFTALMO', status: 'Pendente', dataRegistro: '2026-05-16' },
            { id: 5, nome: 'GUILHERME SOUZA SILVA', 'especialidade': 'US ABDOMEN TOTAL', status: 'Pendente', dataRegistro: '2026-05-14' },
          ]);
        }
      } catch (err) {
        console.error('Erro ao carregar pacientes:', err);
      } finally {
        setCarregandoPacientes(false);
      }
    }
    carregarPacientes();
  }, []);

  // 3. CARREGA UNIDADE PADRÃO DO LOCALSTORAGE
  useEffect(() => {
    const unidadeSalva = localStorage.getItem('fspss_unidade_padrao');
    if (unidadeSalva) {
      setDadosGuia(prev => ({ ...prev, de: unidadeSalva.toUpperCase() }));
    }
  }, []);

  const pacientesFiltrados = pacientes.filter(p => {
    const termoBusca = busca.trim().toLowerCase();
    const matchesTexto = termoBusca === '' || 
                        (p.nome && p.nome.toLowerCase().includes(termoBusca)) || 
                        (p.especialidade && p.especialidade.toLowerCase().includes(termoBusca));
    
    let matchesData = true;
    if (dataFiltro) {
      let dataBancoFormatada = '';

      if (p.dataRegistro) {
        if (p.dataRegistro instanceof Date) {
          dataBancoFormatada = p.dataRegistro.toISOString().split('T')[0];
        } else if (typeof p.dataRegistro === 'string') {
          const stringLimpa = p.dataRegistro.trim().split(' ')[0];

          if (stringLimpa.includes('/')) {
            const partes = stringLimpa.split('/');
            if (partes.length === 3) {
              const dia = partes[0].padStart(2, '0');
              const mes = partes[1].padStart(2, '0');
              const ano = partes[2];
              dataBancoFormatada = `${ano}-${mes}-${dia}`;
            }
          } else if (stringLimpa.includes('-')) {
            dataBancoFormatada = stringLimpa.substring(0, 10);
          }
        }
      }

      matchesData = dataBancoFormatada === dataFiltro;
    }

    return matchesTexto && matchesData;
  });

  const toggleSelecionarPaciente = (id) => {
    setPacientesSelecionados(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelecionarTodosFiltrados = () => {
    const idsFiltrados = pacientesFiltrados.map(p => p.id);
    const todosFiltradosJaSelecionados = idsFiltrados.every(id => pacientesSelecionados.includes(id));

    if (todosFiltradosJaSelecionados) {
      setPacientesSelecionados(prev => prev.filter(id => !idsFiltrados.includes(id)));
    } else {
      setPacientesSelecionados(prev => Array.from(new Set([...prev, ...idsFiltrados])));
    }
  };

  const handleSalvarGuia = async (e) => {
    e.preventDefault();
    if (pacientesSelecionados.length > 30) {
      alert('O limite máximo é de 30 pacientes por guia. Selecione menos pacientes.');
      return;
    }

    if (!proximoNumero || pacientesSelecionados.length === 0) {
      alert('Selecione ao menos um paciente para gerar a guia!');
      return;
    }

    const anoAtual = new Date().getFullYear().toString();
    const dataHoje = new Date().toLocaleDateString('pt-BR');
    const listaItensGuia = pacientes.filter(p => pacientesSelecionados.includes(p.id));

    const documentoRemessa = {
      numeroRemessa: proximoNumero,
      de: dadosGuia.de,
      destino: dadosGuia.para,
      ac: dadosGuia.ac,
      assunto: 'ENCAMINHAMENTOS PARA AGENDAMENTO',
      descricao: `GUIA COLETIVA EM LOTE: ${listaItensGuia.length} PACIENTES ENCAMINHADOS.`,
      pacientesEnviados: listaItensGuia, 
      dataSaida: dataHoje,
      status: 'Pendente',
      tipoGuia: 'Encaminhamento'
    };

    try {
      await db.remessas.add(documentoRemessa);

      if (db.encaminhamentos) {
        for (const p of listaItensGuia) {
          await db.encaminhamentos.update(p.id, { status: 'Enviado', numeroRemessa: proximoNumero });
        }
      }

      setGuiaGerada({
        id: proximoNumero,
        ano: anoAtual,
        ...documentoRemessa
      });
    } catch (error) {
      console.error('Erro ao gravar guia de encaminhamento:', error);
      alert('Erro ao salvar no banco local.');
    }
  };

  const limparFormulario = () => {
    setPacientesSelecionados([]);
    setPacientes(prev => prev.filter(p => !pacientesSelecionados.includes(p.id)));
    setProximoNumero(prev => prev + 1);
    setGuiaGerada(null);
  };

  // ========================================================
  // NOVO LAYOUT DE IMPRESSÃO (PADRÃO 6 COLUNAS COM LOGOS)
  // ========================================================
  const abrirJanelaImpressao = () => {
    if (!guiaGerada) return;

    const linhasTotaisDesejadas = 30;

    const linhasPacientesHtml = guiaGerada.pacientesEnviados.map(p => `
      <tr class="border-b border-black text-[11px] font-medium uppercase break-inside-avoid">
        <td class="px-2 py-0.5 border-r border-black tracking-wide truncate max-w-0" style="width: 50%;">${p.nome}</td>
        <td class="px-2 py-0.5 tracking-wide text-blue-900 font-semibold truncate max-w-0" style="width: 50%;">${p.especialidade}</td>
      </tr>
    `).join('');

    const linhasVaziasQuantidade = Math.max(0, linhasTotaisDesejadas - guiaGerada.pacientesEnviados.length);
    const linhasVaziasHtml = Array(linhasVaziasQuantidade).fill(0).map(() => `
      <tr class="border-b border-black text-[11px] uppercase break-inside-avoid h-[22px]">
        <td class="px-2 py-0.5 border-r border-black" style="width: 50%;"></td>
        <td class="px-2 py-0.5" style="width: 50%;"></td>
      </tr>
    `).join('');

    const conteudoHtml = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
        }
        body { font-family: Arial, sans-serif; }
      </style>
    </head>
    <body class="bg-gray-200 py-4 flex justify-center">
      <div class="print-area-content w-full bg-white text-black text-xs max-w-[780px] p-2 border-2 border-black shadow-lg">
        <div class="grid grid-cols-6 border-2 border-black mb-2 bg-white items-stretch text-center">
          <div class="col-span-1 border-r border-black flex items-center justify-center p-2">
            <img src="${logoFSPSS}" alt="Logo Fundação" class="max-h-14 w-auto object-contain" />
          </div>
          <div class="col-span-4 p-2 flex flex-col justify-center">
            <h1 class="text-[13px] tracking-tight font-extrabold">FSPSS - FUNDAÇÃO DE SAÚDE PÚBLICA DE SÃO SEBASTIÃO</h1>
            <p class="text-[11px] font-bold mt-0.5">${guiaGerada.de}</p>
            <h2 class="text-xs underline uppercase mt-0.5 tracking-wider font-extrabold">GUIA DE REMESSA EM LOTE Nº ${guiaGerada.numeroRemessa}/${guiaGerada.ano}</h2>
          </div>
          <div class="col-span-1 border-l border-black flex items-center justify-center p-2">
            <img src="${logoBrasil}" alt="Brasão" class="max-h-14 w-auto object-contain" />
          </div>
        </div>
        <div class="flex border-2 border-black border-b-0 bg-white text-[11px]">
          <div class="w-[50%] border-r border-black p-1.5 flex flex-col justify-between min-h-[50px]">
            <div><span class="font-black">DE:</span></div>
            <div class="font-black text-center text-xs my-auto">${guiaGerada.de}</div>
            <div class="text-[8px] text-gray-600">...</div>
          </div>
          <div class="w-[50%] p-1.5 flex flex-col justify-between min-h-[50px]">
            <div><span class="font-black">PARA:</span></div>
            <div class="font-black text-center text-xs my-auto">${guiaGerada.destino}</div>
            <div class="text-right text-[9px] font-bold">A/C <span class="underline">${guiaGerada.ac}</span></div>
          </div>
        </div>
        <div class="border-2 border-black p-1 bg-gray-200 text-[10px] font-black uppercase" style="-webkit-print-color-adjust: exact; print-color-adjust: exact;">
          ASSUNTO: <span class="ml-4 font-bold">${guiaGerada.assunto}</span>
        </div>
        <div class="border-2 border-black border-t-0 bg-white w-full">
          <table class="w-full border-collapse table-fixed">
            <thead>
              <tr class="border-b-2 border-black bg-gray-200 text-center font-black text-[10px]" style="-webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <th class="p-1 border-r border-black" style="width: 50%;">NOME COMPLETO DO PACIENTE</th>
                <th class="p-1" style="width: 50%;">EXAME / ESPECIALIDADE</th>
              </tr>
            </thead>
            <tbody>
              ${linhasPacientesHtml}
              ${linhasVaziasHtml}
            </tbody>
          </table>
        </div>
        <div class="flex border-2 border-black border-t-0 bg-white text-[10px] break-inside-avoid">
          <div class="w-[50%] border-r border-black p-2 pr-4 flex flex-col gap-y-4">
            <div class="flex flex-col justify-end">
              <div class="border-b border-black w-full text-center font-bold pb-0.5">${guiaGerada.dataSaida}</div>
              <div class="text-center text-[8px] font-black uppercase mt-0.5 text-gray-500">Data de envio</div>
            </div>
            <div class="flex flex-col justify-end">
              <div class="border-b border-black w-full h-[14px]">...</div>
              <div class="text-center text-[8px] font-black uppercase mt-0.5 text-gray-500">Data de recebimento</div>
            </div>
          </div>
          <div class="w-[50%] p-2 pl-4 flex flex-col gap-y-4">
            <div class="flex flex-col justify-end">
              <div class="border-b border-black w-full h-[14px]"></div>
              <div class="text-center text-[8px] font-black uppercase mt-0.5 text-gray-500">assinatura do responsável pelo envio</div>
            </div>
            <div class="flex flex-col justify-end">
              <div class="border-b border-black w-full h-[14px]"></div>
              <div class="text-center text-[8px] font-black uppercase mt-0.5 text-gray-500">assinatura do responsável pelo recebimento</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    setHtmlPreview(conteudoHtml); // abre o modal
  };

  const handleImprimirDoModal = () => {
    if (htmlPreview) {
      imprimirHtmlNoDesktop(htmlPreview);
    }
  };

  const limparFiltros = () => {
    setBusca('');
    setDataFiltro('');
  };

  return (
    <div class="min-h-screen bg-slate-50 p-4 sm:p-6 text-slate-900 font-sans antialiased">
      <div class="max-w-7xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 class="text-2xl font-black text-slate-900 tracking-tight">Guia de Encaminhamento Coletiva</h1>
          <p class="text-xs text-slate-500 uppercase tracking-wider font-bold mt-0.5">FSPSS • Triagem e Despacho de Lotes</p>
        </div>
        <Link 
          href="/remessas/historico"
          class="inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800  text-white font-bold h-9 px-4 rounded-lg text-xs shadow-sm transition-colors"
        >
          <List size={14} /> Histórico Unificado
        </Link>
      </div>

      <div class="max-w-7xl mx-auto">
        {/* MODAL DE PREVIEW */}
        {htmlPreview && (
          <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
            <div className="flex items-center justify-between bg-slate-900 px-6 py-3 shrink-0">
              <span className="text-white font-black text-sm uppercase tracking-wider">
                Pré-visualização da Guia
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleImprimirDoModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider px-5 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Eye size={14} /> Imprimir
                </button>
                <button
                  onClick={() => setHtmlPreview(null)}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-black text-xs uppercase tracking-wider px-4 py-2 rounded-lg transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
            <iframe
              srcDoc={htmlPreview}
              className="flex-1 w-full border-0 bg-gray-200"
              title="Preview da Guia"
            />
          </div>
        )}
        {!guiaGerada && (
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div class="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-5 sticky top-6">
              <h2 class="text-xs font-black uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Users size={15} class="text-slate-500" /> Parâmetros de Envio
              </h2>
              
              <div class="space-y-4">
                <div class="grid grid-cols-1 gap-3.5">
                  <div>
                    <label class="block class text-[10px] font-black text-slate-600 uppercase mb-1 tracking-wide">Origem (DE)</label>
                    <input
                      type="text"
                      value={dadosGuia.de}
                      onChange={(e) => setDadosGuia({...dadosGuia, de: e.target.value.toUpperCase()})}
                      class="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg h-9 px-3 text-xs font-bold uppercase transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black text-slate-600 uppercase mb-1 tracking-wide">Destino (PARA)</label>
                    <input
                      type="text"
                      value={dadosGuia.para}
                      onChange={(e) => setDadosGuia({...dadosGuia, para: e.target.value.toUpperCase()})}
                      class="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg h-9 px-3 text-xs font-bold uppercase transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] font-black text-slate-600 uppercase mb-1 tracking-wide">Aos Cuidados (A/C)</label>
                    <input
                      type="text"
                      value={dadosGuia.ac}
                      onChange={(e) => setDadosGuia({...dadosGuia, ac: e.target.value.toUpperCase()})}
                      class="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg h-9 px-3 text-xs font-bold uppercase transition-all outline-none"
                    />
                  </div>
                </div>

                <div class="pt-4 border-t border-slate-100 space-y-3">
                  <div class="bg-blue-50/70 border border-blue-100 text-blue-900 p-3 rounded-lg flex items-center justify-between">
                    <span class="text-[10px] font-black uppercase tracking-wide text-blue-700">Remessa Atual:</span>
                    <span class="text-sm font-black font-mono">#{proximoNumero || '...'}</span>
                  </div>
                  
                  <button
                    onClick={handleSalvarGuia}
                    disabled={carregandoNumero || pacientesSelecionados.length === 0}
                    class="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-black h-11 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-colors disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={16} /> Gravar e Emitir Guia ({pacientesSelecionados.length})
                  </button>
                </div>
              </div>
            </div>

            <div class="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-5">
              <div class="bg-slate-50 border border-slate-100 p-4 rounded-xl mb-4">
                <span class="block text-[10px] font-black text-slate-500 uppercase mb-2.5 tracking-wider">Filtros de Busca Avançados</span>
                
                <div class="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  <div class="relative sm:col-span-3">
                    <Search class="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="BUSCAR POR NOME DO PACIENTE OU EXAME..."
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      class="w-full pl-9 bg-white border border-slate-200 focus:border-blue-500 rounded-lg h-9 px-3 text-xs font-bold uppercase tracking-wide outline-none transition-all"
                    />
                  </div>

                  <div class="relative sm:col-span-2">
                    <Calendar class="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input
                      type="date"
                      value={dataFiltro}
                      onChange={(e) => setDataFiltro(e.target.value)}
                      class="w-full pl-9 bg-white border border-slate-200 focus:border-blue-500 rounded-lg h-9 px-3 text-xs font-bold text-slate-700 outline-none transition-all uppercase"
                    />
                  </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-3 mt-3 pt-3 border-t border-slate-200/60 justify-between items-center">
                  <div class="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleSelecionarTodosFiltrados}
                      disabled={pacientesFiltrados.length === 0}
                      class="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-100 disabled:opacity-60 border border-slate-200 text-slate-700 h-8 px-3 rounded-lg text-[11px] font-black uppercase transition-all shadow-sm"
                    >
                      {pacientesFiltrados.length > 0 && pacientesFiltrados.every(p => pacientesSelecionados.includes(p.id)) ? (
                        <>
                          <CheckSquare size={14} class="text-emerald-600" /> Desmarcar Filtrados
                        </>
                      ) : (
                        <>
                          <Square size={14} class="text-slate-400" /> Marcar Filtrados
                        </>
                      )}
                    </button>

                    {(busca || dataFiltro) && (
                      <button
                        type="button"
                        onClick={limparFiltros}
                        class="text-[11px] text-rose-600 hover:text-rose-700 font-black uppercase px-2 transition-colors"
                      >
                        Limpar Filtros
                      </button>
                    )}
                  </div>

                  <span class="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2.5 py-1 rounded-md font-mono shrink-0">
                    LISTADOS: {pacientesFiltrados.length} | SELECIONADOS: {pacientesSelecionados.length}
                  </span>
                </div>
              </div>

              <div class="border border-slate-100 rounded-xl overflow-hidden max-h-[420px] overflow-y-auto shadow-inner bg-slate-50/30">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600 sticky top-0 backdrop-blur-sm z-10">
                      <th class="p-3 w-12 text-center">Selec</th>
                      <th class="p-3">Nome do Paciente</th>
                      <th class="p-3">Exame / Especialidade</th>
                      <th class="p-3 w-28 text-center">Data Cadastrado</th>
                    </tr>
                  </thead>
                  <tbody class="text-xs divide-y divide-slate-100 text-slate-800 bg-white">
                    {carregandoPacientes ? (
                      <tr>
                        <td colSpan={4} class="p-12 text-center text-slate-400 font-bold bg-white">
                          <Loader2 class="animate-spin inline mr-2 text-blue-500" size={16} /> Acessando banco Dexie...
                        </td>
                      </tr>
                    ) : pacientesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} class="p-12 text-center text-slate-400 uppercase font-black tracking-wide bg-slate-50/50">
                          Nenhum encaminhamento pendente encontrado.
                        </td>
                      </tr>
                    ) : (
                      pacientesFiltrados.map((p) => {
                        const selecionado = pacientesSelecionados.includes(p.id);
                        
                        let dataFormatada = '--/--/----';
                        if (p.dataRegistro) {
                          const base = typeof p.dataRegistro === 'string' ? p.dataRegistro.split('T')[0] : new Date(p.dataRegistro).toISOString().split('T')[0];
                          if (base) dataFormatada = base.split('-').reverse().join('/');
                        }

                        return (
                          <tr 
                            key={p.id} 
                            onClick={() => toggleSelecionarPaciente(p.id)}
                            class={`hover:bg-slate-50/80 cursor-pointer transition-colors select-none ${selecionado ? 'bg-emerald-50/50 text-emerald-950 font-medium' : ''}`}
                          >
                            <td class="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                checked={selecionado}
                                onChange={() => toggleSelecionarPaciente(p.id)}
                                class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer transition-all"
                              />
                            </td>
                            <td class="p-3 font-bold uppercase tracking-wide">{p.nome}</td>
                            <td class="p-3 text-slate-600 font-mono text-[11px] font-bold uppercase">{p.especialidade}</td>
                            <td class="p-3 text-center text-slate-500 font-bold font-mono text-[11px]">{dataFormatada}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {guiaGerada && (
          <div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-md text-center max-w-xl mx-auto my-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div class="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-600 'rounded-full' flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle size={28} />
            </div>
            
            <div>
              <h2 class="text-lg font-black text-slate-900 tracking-tight">Guia de Encaminhamento Coletiva Emitida!</h2>
              <p class="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Código Identificador: #{guiaGerada.numeroRemessa}</p>
            </div>

            <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 text-left space-y-2">
              <div class="flex justify-between text-xs font-bold text-slate-600 border-b border-dashed pb-2">
                <span>Destino:</span>
                <span class="text-slate-900 uppercase">{guiaGerada.destino}</span>
              </div>
              <div class="flex justify-between text-xs font-bold text-slate-600">
                <span>Total Despachado:</span>
                <span class="text-emerald-700 font-black">{guiaGerada.pacientesEnviados.length} Pacientes</span>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                onClick={limparFormulario}
                class="w-full sm:w-auto bg-slate-100  hover:bg-slate-200 text-slate-700 font-black h-10 px-5 rounded-lg text-xs uppercase tracking-wide transition-colors"
              >
                Nova Emissão
              </button>
              <button
                onClick={abrirJanelaImpressao}
                class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black h-10 px-6 rounded-lg text-xs inline-flex items-center justify-center gap-2 uppercase tracking-wider shadow-sm transition-colors"
              >
                <Eye size={14} /> Abrir Impressão 
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}