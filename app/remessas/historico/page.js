'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { List, Printer, Trash2, CheckCircle2, ArrowLeft, Loader2, Calendar, User, Search, AlertCircle, ChevronDown, ChevronUp, FileText, X } from 'lucide-react';
import Link from 'next/link';
import { db } from '../../../db'; 
// IMPORTAÇÃO DO GERADOR EXTERNO:
import { gerarHtmlRemessa } from '@/utils/geradorLayoutPrint';
import { imprimirHtmlNoDesktop } from '@/utils/print';


export default function HistoricoRemessas() {
  const [htmlPreview, setHtmlPreview] = useState(null);
  const [remessas, setRemessas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [linhaExpandida, setLinhaExpandida] = useState(null); 
  
  const [modalAberto, setModalAberto] = useState(false);
  const [remessaSelecionada, setRemessaSelecionada] = useState(null);
  const [dadosRecebimento, setDadosRecebimento] = useState({
    dataRecebido: '',
    recebidoPor: ''
  });

  const [gerandoPdfId, setGerandoPdfId] = useState(null);

  const carregarRemessas = async () => {
    try {
      setCarregando(true);
      const dados = await db.remessas.toArray();
      dados.sort((a, b) => b.id - a.id);
      setRemessas(dados);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarRemessas();
  }, []);

  const toggleExpandirLinha = (id) => {
    setLinhaExpandida(linhaExpandida === id ? null : id);
  };

  const handleExcluir = async (id, numero) => {
    if (confirm(`Tem certeza absoluta que deseja excluir permanentemente a Remessa Nº ${numero}?`)) {
      try {
        const remessaParaDeletar = await db.remessas.get(id);
        
        if (remessaParaDeletar && db.encaminhamentos) {
          if (remessaParaDeletar.pacientesEnviados && remessaParaDeletar.pacientesEnviados.length > 0) {
            for (const p of remessaParaDeletar.pacientesEnviados) {
              await db.encaminhamentos.update(p.id, { 
                status: 'Pendente', 
                numeroRemessa: null 
              });
            }
          } else {
            const todosEnviados = await db.encaminhamentos
              .where('status')
              .equals('Enviado')
              .toArray();

            const filtrados = todosEnviados.filter(enc => 
              String(enc.numeroRemessa) === String(numero) || Number(enc.numeroRemessa) === Number(numero)
            );

            for (const enc of filtrados) {
              await db.encaminhamentos.update(enc.id, { 
                status: 'Pendente', 
                numeroRemessa: null 
              });
            }
          }
        }

        await db.remessas.delete(id);
        setRemessas(prev => prev.filter(r => r.id !== id));
        if (linhaExpandida === id) setLinhaExpandida(null);

        alert(`Remessa Nº ${numero} excluída com sucesso!`);
      } catch (error) {
        console.error('Erro crítico ao deletar remessa:', error);
        alert('Não foi possível excluir a remessa do banco de dados local.');
      }
    }
  };

  const abrirModalRecebido = (remessa) => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    setRemessaSelecionada(remessa);
    setDadosRecebimento({
      dataRecebido: hoje,
      recebidoPor: ''
    });
    setModalAberto(true);
  };

  const handleConfirmarRecebimento = async (e) => {
    e.preventDefault();
    if (!remessaSelecionada) return;
    const { dataRecebido, recebidoPor } = dadosRecebimento;
  
    if (!dataRecebido || !recebidoPor?.trim()) {
      alert('Preencha a data e o nome de quem recebeu.');
      return;
    }
  
    try {
      await db.remessas.update(remessaSelecionada.id, {
        status: 'Recebido',
        dataRecebido,
        recebidoPor: recebidoPor.trim().toUpperCase() // <-- CORRIGIDO: Era 'recibidoPor'
      });
  
      setModalAberto(false);
      setRemessaSelecionada(null);
      setDadosRecebimento({ dataRecebido: '', recebidoPor: '' });
      await carregarRemessas();
    } catch (error) {
      console.error('Erro ao atualizar recebimento:', error);
      alert('Erro ao registrar recebimento.');
    }
  };

  // NOVA ABORDAGEM: GERAÇÃO DE PÁGINA TEMPORÁRIA ISOLADA (ESTILO PDF)
  const handleImprimir = async (remessa) => {
    setGerandoPdfId(remessa.id);
    try {
      const corpoHTML = gerarHtmlRemessa(remessa);
      const htmlCompleto = `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <title>Guia de Remessa #${remessa.numeroRemessa}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page { size: A4; margin: 10mm; }
              body { background-color: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            </style>
          </head>
          <body>
            <div class="p-4">${corpoHTML}</div>
          </body>
        </html>
      `;
      setHtmlPreview(htmlCompleto);
    } catch (erro) {
      console.error("Erro ao abrir a impressão:", erro);
      alert("Houve um erro ao processar a guia de impressão.");
    } finally {
      setGerandoPdfId(null);
    }
  };

  const handleImprimirDoModal = () => {
    if (htmlPreview) {
      imprimirHtmlNoDesktop(htmlPreview);
    }
  };

  const remessasFiltradas = useMemo(() => {
    const termo = busca.toLowerCase();
    if (!termo) return remessas;

    return remessas.filter(r => {
      const matchesGeral = 
        r.numeroRemessa?.toString().includes(termo) ||
        r.destino?.toLowerCase().includes(termo) ||
        r.assunto?.toLowerCase().includes(termo) ||
        r.descricao?.toLowerCase().includes(termo) ||
        r.de?.toLowerCase().includes(termo);

      const matchesPaciente = r.pacientesEnviados && 
        Array.isArray(r.pacientesEnviados) && 
        r.pacientesEnviados.some(paciente => paciente.nome?.toLowerCase().includes(termo));

      return matchesGeral || matchesPaciente;
    });
  }, [remessas, busca]);

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900">
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
                <Printer size={14} /> Imprimir
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
      
      {/* CABEÇALHO */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">
            <List size={14} /> Histórico Geral
          </div>
          <h1 className="text-2xl font-black text-gray-900">Controle de Remessas</h1>
        </div>
        
        <Link 
          href="/remessas"
          className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2.5 px-4 rounded-lg text-xs shadow-md transition-all self-start sm:self-center"
        >
          <ArrowLeft size={14} /> Voltar para Emissão
        </Link>
      </div>

      {/* ÁREA DA TABELA E FILTROS */}
      <div className="max-w-6xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          
          {/* BARRA DE PESQUISA */}
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <Search className="text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Pesquisar por número, destino, assunto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-transparent border-none text-xs font-medium focus:outline-none placeholder-gray-400 uppercase"
            />
          </div>

          {carregando ? (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
              <Loader2 className="animate-spin text-emerald-600" size={28} />
              <span className="text-xs font-bold uppercase tracking-wider">Carregando registros...</span>
            </div>
          ) : remessasFiltradas.length === 0 ? (
            <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
              <AlertCircle size={32} />
              <span className="text-sm font-bold">Nenhuma remessa encontrada.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-white text-[10px] font-black uppercase tracking-wider">
                    <th className="py-3 px-4 text-center w-12"></th>
                    <th className="py-3 px-4 text-center w-16">Nº</th>
                    <th className="py-3 px-4">Destino / Unidade</th>
                    <th className="py-3 px-4">Resumo do Lote</th>
                    <th className="py-3 px-4 text-center w-28">Data Saída</th>
                    <th className="py-3 px-4 text-center w-32">Status</th>
                    <th className="py-3 px-4 text-center w-48">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium">
                  {remessasFiltradas.map((remessa) => {
                    const estaExpandido = linhaExpandida === remessa.id;
                    const imprimindoEsta = gerandoPdfId === remessa.id;
                    return (
                      <React.Fragment key={remessa.id}>
                        <tr 
                          onClick={() => toggleExpandirLinha(remessa.id)}
                          className={`hover:bg-slate-50 cursor-pointer transition-colors ${estaExpandido ? 'bg-blue-50/40 hover:bg-blue-50/60' : ''}`}
                        >
                          <td className="py-3 px-2 text-center text-gray-400">
                            {estaExpandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </td>
                          <td className="py-3 px-4 text-center font-black text-gray-900 bg-gray-50/30">
                            #{remessa.numeroRemessa}
                          </td>
                          <td className="py-3 px-4 font-bold">
                            <div className="text-gray-900 uppercase">{remessa.destino}</div>
                            <div className="text-[10px] text-gray-400 font-normal uppercase">DE: {remessa.de || 'NÃO ESPECIFICADO'}</div>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-gray-700 uppercase font-semibold">
                            {remessa.assunto}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-gray-500">
                            {remessa.dataSaida}
                          </td>
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            {remessa.status === 'Recebido' ? (
                              <div className="inline-flex flex-col items-center">
                                <span className="bg-emerald-100 text-emerald-800 font-black text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wide">
                                  Recebido
                                </span>
                                <span className="text-[8px] text-gray-400 mt-0.5 font-sans">
                                  {remessa.dataRecebido}
                                </span>
                              </div>
                            ) : (
                              <span className="bg-amber-100 text-amber-800 font-black text-[9px] uppercase px-2 py-0.5 rounded-full tracking-wide">
                                Pendente
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              {remessa.status !== 'Recebido' && (
                                <button
                                  onClick={() => abrirModalRecebido(remessa)}
                                  className="bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white font-bold py-1 px-2 rounded-md transition-all flex items-center gap-1 text-[10px] uppercase tracking-tight border border-emerald-200"
                                  title="Dar Baixa"
                                >
                                  <CheckCircle2 size={13} /> Baixa
                                </button>
                              )}

                              <button
                                onClick={() => handleImprimir(remessa)}
                                disabled={imprimindoEsta}
                                className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white p-1.5 rounded-md transition-all border border-blue-200 disabled:opacity-50"
                                title="Reimprimir Guia"
                              >
                                {imprimindoEsta ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
                              </button>

                              <button
                                onClick={() => handleExcluir(remessa.id, remessa.numeroRemessa)}
                                className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-1.5 rounded-md transition-all border border-red-100"
                                title="Excluir"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {estaExpandido && (
                          <tr className="bg-slate-50/70 border-l-2 border-blue-500">
                            <td colSpan={7} className="p-4 bg-gray-50/40 border-b border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 space-y-2">
                                  <div>
                                    <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider block">Assunto Oficial</span>
                                    <div className="text-xs font-black text-gray-800 uppercase flex items-center gap-1.5 mt-0.5">
                                      <FileText size={14} className="text-gray-400" /> {remessa.assunto}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider block">
                                      Detalhes do Envio / Pacientes Encaminhados
                                    </span>
                                    <div className="text-xs font-mono font-bold bg-white p-2.5 rounded-lg border border-gray-200 text-gray-700 mt-1 uppercase shadow-sm max-h-60 overflow-y-auto">
                                      {remessa.pacientesEnviados && Array.isArray(remessa.pacientesEnviados) && remessa.pacientesEnviados.length > 0 ? (
                                        <div className="divide-y divide-gray-100">
                                          {remessa.pacientesEnviados.map((paciente, idx) => {
                                            const termoAtivo = busca.trim().toLowerCase();
                                            const eOPacienteBuscado = termoAtivo && paciente.nome?.toLowerCase().includes(termoAtivo);

                                            return (
                                              <div 
                                                key={idx} 
                                                className={`py-1 flex justify-between gap-4 first:pt-0 last:pb-0 transition-colors px-1 rounded ${
                                                  eOPacienteBuscado ? 'bg-yellow-100 border-l-2 border-yellow-500 font-black pl-2' : ''
                                                }`}
                                              >
                                                <span className={eOPacienteBuscado ? 'text-amber-950 font-black' : 'text-gray-900 font-bold'}>
                                                  {idx + 1}. {paciente.nome}
                                                </span>
                                                <span className={eOPacienteBuscado ? 'text-amber-800 font-black' : 'text-blue-600 font-semibold shrink-0'}>
                                                  {paciente.especialidade}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ) : (
                                        <p className="whitespace-pre-line leading-relaxed">
                                          {remessa.descricao}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-2 h-fit text-[11px]">
                                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block border-b pb-1">Metadados Técnicos</span>
                                  <div><span className="font-bold text-gray-500">Destinatário:</span> <span className="font-black text-gray-800 uppercase">{remessa.destino} {remessa.ac ? `(A/C ${remessa.ac})` : ''}</span></div>
                                  <div><span className="font-bold text-gray-500">Nº Pacientes:</span> <span className="font-black text-emerald-700">{remessa.pacientesEnviados?.length || '0'} no lote</span></div>
                                  {remessa.status === 'Recebido' && (
                                    <div className="pt-1 mt-1 border-t border-dashed border-gray-200">
                                      <div className="text-xs text-emerald-800 font-bold uppercase">Protocolo Confirmado:</div>
                                      <div className="text-[10px] text-gray-600 mt-0.5">Recebido por <span className="font-black">{remessa.recebidoPor}</span> em {remessa.dataRecebido}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE RECEBIMENTO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xl max-w-sm w-full p-5 relative">
            <button 
              onClick={() => setModalAberto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-emerald-600 mb-3">
              <CheckCircle2 size={20} />
              <h2 className="text-base font-black text-gray-900">Registrar Recebimento</h2>
            </div>

            <p className="text-xs text-gray-500 mb-4 uppercase font-semibold">
              Confirmar a baixa para a Remessa <span className="text-gray-800 font-black">#{remessaSelecionada?.numeroRemessa}</span> destinada a {remessaSelecionada?.destino}.
            </p>

            <form onSubmit={handleConfirmarRecebimento} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black Bash uppercase text-gray-500 tracking-wider mb-1">
                  Quem recebeu? (Nome Completo)
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 text-gray-400" size={14} />
                  <input 
                    type="text"
                    required
                    value={dadosRecebimento.recebidoPor}
                    onChange={(e) => setDadosRecebimento(prev => ({ ...prev, recebidoPor: e.target.value }))}
                    placeholder="DIGITE O NOME DO SERVIDOR"
                    className="w-full bg-gray-50  border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-xs font-bold uppercase focus:bg-white focus:border-emerald-500 focus:outline-none transition-all placeholder-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-1">
                  Data de Recebimento
                </label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-3 text-gray-400" size={14} />
                  <input 
                    type="text"
                    required
                    value={dadosRecebimento.dataRecebido}
                    onChange={(e) => setDadosRecebimento(prev => ({ ...prev, dataRecebido: e.target.value }))}
                    placeholder="DD/MM/AAAA"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-xs font-mono font-bold focus:bg-white focus:border-emerald-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-3 rounded-lg text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={14} /> Confirmar Baixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
