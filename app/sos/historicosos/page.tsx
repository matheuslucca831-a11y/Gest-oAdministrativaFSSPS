'use client';

import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db'; // Ajuste o caminho do import de acordo com seu projeto
import { logoFSPSS } from '@/app/imagens';
import { imprimirHtmlNoDesktop } from '@/utils/print';

// Interface alinhada com a estrutura do seu Dexie
interface RegistroSOS {
  id?: number;
  numeroOS: string;
  ano: string;
  unidade: string;
  descricaoServico: string;
  observacao: string;
  observacoesAdicionais?: string;
  dataSolicitacao: string;
  nomeSolicitante: string;
  status: 'PENDENTE' | 'EM ATENDIMENTO' | 'CONCLUÍDO';
  cargoSolicitante?: string;
  contatoSolicitante?: string;
}

export default function HistoricoSOS() {
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);

  const handleImprimirDoModal = () => {
    if (htmlPreview) imprimirHtmlNoDesktop(htmlPreview);
  };
  const [busca, setBusca] = useState('');
  const [filtroData, setFiltroData] = useState('');

  // Lendo os dados do IndexedDB em tempo real
  const chamados = useLiveQuery(async () => {
    const resultado = await db.table('sos').toArray();
    return resultado.reverse() as RegistroSOS[];
  }) || [];

  // Filtros aplicados localmente em memória para performance
  const chamadosFiltrados = chamados.filter(item => {
    const matchTexto = 
      item.unidade.toLowerCase().includes(busca.toLowerCase()) || 
      item.descricaoServico.toLowerCase().includes(busca.toLowerCase()) ||
      item.numeroOS.includes(busca) ||
      item.nomeSolicitante.toLowerCase().includes(busca.toLowerCase());
      
    const matchData = filtroData ? item.dataSolicitacao === filtroData : true;
    
    return matchTexto && matchData;
  });

  // Função para alternar o status diretamente no clique
  const alternarStatus = async (id: number | undefined, statusAtual: string) => {
    if (!id) return;
    const proximosStatus: Record<string, 'PENDENTE' | 'EM ATENDIMENTO' | 'CONCLUÍDO'> = {
      'PENDENTE': 'EM ATENDIMENTO',
      'EM ATENDIMENTO': 'CONCLUÍDO',
      'CONCLUÍDO': 'PENDENTE'
    };
    
    try {
      await db.table('sos').update(id, { status: proximosStatus[statusAtual] });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Função para deletar um registro do Dexie
  const deletarSOS = async (id: number | undefined, numeroOS: string) => {
    if (!id) return;
    if (confirm(`Tem certeza que deseja excluir a OS Nº ${numeroOS}?`)) {
      try {
        await db.table('sos').delete(id);
      } catch (error) {
        console.error('Erro ao deletar OS:', error);
      }
    }
  };

  // Função para disparar a impressão ocupando a folha A4 inteira de forma proporcional
  const dispararImpressao = (dados: RegistroSOS) => {
    const htmlImpressao = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>S.O.S - Solicitação de Ordem de Serviço #${dados.numeroOS}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          @page { margin: 0.5cm !important; size: landscape; }
          body { background: #fff !important; padding: 0 !important; }
          .print-container { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; min-height: auto !important; }
        }
        body { background-color: #525659; font-family: ui-sans-serif, system-ui, sans-serif; padding: 30px 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        .print-container { max-width: 1120px; margin: 0 auto; background: #fff; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); min-height: 100vh; display: flex; flex-direction: column; justify-content: flex-start; }
      </style>
    </head>
    <body>
      <div class="print-container">
        <div class="w-full border-2 border-blue-700 text-black text-xs bg-white">
          <div class="grid grid-cols-6 items-center text-center border-b-2 border-blue-700">
            <div class="col-span-1 p-2 border-r-2 border-blue-700 flex items-center justify-center">
              <img src="${logoFSPSS}" alt="Logo Fundação" style="max-height: 58px; width: auto; object-fit: contain;" />
            </div>
            <div class="col-span-5 p-2">
              <h1 class="text-lg font-black tracking-wider text-black">S.O.S. SOLICITAÇÃO DE ORDEM DE SERVIÇO</h1>
            </div>
          </div>
          <div class="grid grid-cols-6 border-b-2 border-blue-700 items-stretch font-bold">
            <div class="col-span-4 p-2 border-r-2 border-blue-700">
              <span class="text-[9px] text-black block font-black uppercase">UNIDADE:</span>
              <span class="text-sm tracking-wide font-black uppercase">${dados.unidade}</span>
            </div>
            <div class="col-span-1 p-2 border-r-2 border-blue-700 text-center flex flex-col justify-center">
              <span class="text-[9px] text-black block font-black">Nº</span>
              <span class="text-sm font-black text-emerald-700">${dados.numeroOS}</span>
            </div>
            <div class="col-span-1 p-2 text-center flex flex-col justify-center">
              <span class="text-[9px] text-black block font-black">ANO</span>
              <span class="text-sm font-black">${dados.ano}</span>
            </div>
          </div>
          <div class="border-b-2 border-blue-700">
            <div class="bg-gray-100 border-b border-blue-700 px-2 py-1 font-black text-[10px] uppercase tracking-wider">DESCRIÇÃO DO SERVIÇO:</div>
            <div class="p-3 min-h-[220px] font-mono text-sm leading-relaxed uppercase whitespace-pre-line">${dados.descricaoServico || 'NENHUM SERVIÇO DESCRITO.'}</div>
          </div>
          <div class="border-b-2 border-blue-700">
            <div class="bg-gray-100 border-b border-blue-700 px-2 py-1 font-black text-[10px] uppercase tracking-wider">OBSERVAÇÃO:</div>
            <div class="p-3 min-h-[100px] font-mono text-sm leading-relaxed uppercase whitespace-pre-line">${dados.observacao || '-'}</div>
          </div>
          <div class="grid grid-cols-12 items-stretch text-xs">
            <div class="col-span-7 border-r-2 border-blue-700">
              <div class="grid grid-cols-1 border-b border-blue-700 p-1.5 pl-3">
                <span class="font-bold text-[10px] text-gray-600">DATA DE SOLICITAÇÃO:</span>
                <span class="font-black text-sm">${dados.dataSolicitacao}</span>
              </div>
              <div class="grid grid-cols-1 border-b border-blue-700 p-1.5 pl-3">
                <span class="font-bold text-[10px] text-gray-600">NOME DO SOLICITANTE:</span>
                <span class="font-black text-sm uppercase">${dados.nomeSolicitante}</span>
              </div>
              <div class="grid grid-cols-1 border-b border-blue-700 p-1.5 pl-3">
                <span class="font-bold text-[10px] text-gray-600">CARGO / FUNÇÃO:</span>
                <span class="font-black text-sm uppercase">${dados.cargoSolicitante || '-'}</span>
              </div>
              <div class="grid grid-cols-1 p-1.5 pl-3">
                <span class="font-bold text-[10px] text-gray-600">CONTATO / RAMAL DA UNIDADE:</span>
                <span class="font-black text-sm">${dados.contatoSolicitante || '-'}</span>
              </div>
            </div>
            <div class="col-span-5 flex flex-col justify-between p-3 bg-gray-50/50">
              <div class="w-full text-center text-[9px] font-black uppercase text-gray-400 tracking-wider">RESERVA TÉCNICA / VISTORIA E ASSINATURA</div>
              <div class="border-t border-dashed border-gray-400 w-full mb-4"></div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;

    setHtmlPreview(htmlImpressao);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-950">
      {htmlPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/80">
          <div className="flex items-center justify-between bg-slate-900 px-6 py-3 shrink-0">
            <span className="text-white font-black text-sm uppercase tracking-wider">
              Pré-visualização da O.S.
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleImprimirDoModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider px-5 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                Imprimir
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
            title="Preview da O.S."
          />
        </div>
      )}
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Módulo de Ordens de Serviço (Histórico)</h1>
          <p className="text-xs text-gray-500 mt-1">Gerencie, filtre e controle o andamento dos chamados S.O.S</p>
        </div>

        {/* FILTROS AVANÇADOS */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-4">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Filtros de Busca Avançados</span>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <input 
                type="text"
                placeholder="BUSCAR POR Nº OS, UNIDADE, SOLICITANTE OU DESCRIÇÃO..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-xs font-bold text-gray-900 placeholder-gray-400 focus:outline-none  focus:border-blue-500 uppercase focus:bg-white"
              />
            </div>
            <div>
              <input 
                type="text"
                placeholder="Ex: 18/05/2026"
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2.5 text-xs font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 text-center focus:bg-white"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs font-bold text-gray-500">
            <div>
              <span>{chamadosFiltrados.length} encontrados</span>
            </div>
          </div>
        </div>

        {/* TABELA DADOS REAIS */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-black border-b border-gray-200 uppercase tracking-wider text-[10px]">
                  <th className="p-4 text-center w-20">Nº OS</th>
                  <th className="p-4 w-52">Unidade Solicitante</th>
                  <th className="p-4">Descrição do Serviço</th>
                  <th className="p-4 text-center w-32">Data Solic.</th>
                  <th className="p-4 text-center w-40">Status (Clique p/ alterar)</th>
                  <th className="p-4 text-center w-28">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-bold">
                {chamadosFiltrados.length > 0 ? (
                  chamadosFiltrados.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="p-4 text-center text-gray-500 font-mono text-sm">{item.numeroOS}/{item.ano}</td>
                      <td className="p-4 text-gray-900 uppercase tracking-wide">
                        {item.unidade}
                        <span className="block text-[10px] text-gray-400 font-normal">Por: {item.nomeSolicitante}</span>
                      </td>
                      <td className="p-4 text-gray-700 max-w-xs md:max-w-md uppercase font-mono text-[11px] whitespace-pre-line break-words">
                        {item.descricaoServico}
                        {item.observacao && (
                          <span className="block text-[10px] text-amber-600 font-sans mt-1">Obs: {item.observacao}</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-gray-500 font-mono">{item.dataSolicitacao}</td>
                      <td className="p-4 text-center">
                        <button
                          type="button"
                          onClick={() => alternarStatus(item.id, item.status)}
                          className={`px-2.5 py-1 rounded text-[9px] font-black tracking-wider uppercase border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                            item.status === 'PENDENTE' ? 'bg-amber-50 border-amber-300 heart-700 text-amber-700 hover:bg-amber-100' :
                            item.status === 'EM ATENDIMENTO' ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' :
                            'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {item.status}
                        </button>
                      </td>
                      
                      {/* COLUNA DE AÇÕES */}
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* BOTÃO IMPRIMIR */}
                          <button
                            type="button"
                            onClick={() => dispararImpressao(item)}
                            title="Imprimir OS"
                            className="w-9 h-9 flex items-center justify-center bg-[#edf3fc] border border-[#d2e3fc] text-[#1a73e8] rounded-xl hover:bg-[#e1ecfc] transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 5.75h10.56M4.5 9.25h15m-15 0a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25m-15 0h15M16.5 13.5h-9v5.25h9V13.5z" />
                            </svg>
                          </button>

                          {/* BOTÃO EXCLUIR */}
                          <button
                            type="button"
                            onClick={() => deletarSOS(item.id, item.numeroOS)}
                            title="Excluir OS"
                            className="w-9 h-9 flex items-center justify-center bg-[#fce8e6] border border-[#fad2cf] text-[#d93025] rounded-xl hover:bg-[#fa3c30]/10 transition-all"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-gray-400 font-black tracking-wide uppercase">
                      Nenhuma ordem de serviço S.O.S encontrada no banco local.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}