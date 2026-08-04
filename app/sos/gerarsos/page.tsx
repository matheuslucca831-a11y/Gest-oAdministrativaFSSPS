'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/db'; 
import { logoFSPSS } from '@/app/imagens';

interface DadosSOS {
  numeroOS: string;
  ano: string;
  unidade: string;
  descricaoServico: string;
  observacao: string;
  dataSolicitacao: string;
  nomeSolicitante: string;
  cargoSolicitante: string;
  contatoSolicitante: string;
}

export default function GerarSOS() {
  const [loading, setLoading] = useState(false);
  const [nomeLembrado, setNomeLembrado] = useState('');
  const [cargoLembrado, setCargoLembrado] = useState('');
  const [mostrarSugestaoDados, setMostrarSugestaoDados] = useState(false);

  const [form, setForm] = useState<DadosSOS>({
    numeroOS: '001',
    ano: new Date().getFullYear().toString(),
    unidade: '',
    descricaoServico: '',
    observacao: '',
    dataSolicitacao: new Date().toLocaleDateString('pt-BR'),
    nomeSolicitante: '',
    cargoSolicitante: '',
    contatoSolicitante: '',
  });

  const anoAtual = form.ano;

  useEffect(() => {
    const unidadeSalva = localStorage.getItem('fspss_unidade_padrao') || '';
    const telefoneSalvo = localStorage.getItem('fspss_telefone_padrao') || '';
    const nomeSalvo = localStorage.getItem('fspss_sos_nome_padrao') || '';
    const cargoSalvo = localStorage.getItem('fspss_sos_cargo_padrao') || '';

    setNomeLembrado(nomeSalvo);
    setCargoLembrado(cargoSalvo);

    setForm(prev => ({
      ...prev,
      unidade: unidadeSalva.toUpperCase() || 'USF BOIÇUCANGA I',
      nomeSolicitante: nomeSalvo.toUpperCase(),
      cargoSolicitante: cargoSalvo.toUpperCase(),
      contatoSolicitante: telefoneSalvo,
    }));

    async function definirProximoNumeroOS() {
      try {
        const registrosDoAno = await db.table('sos')
          .where('ano').equals(anoAtual).toArray();

        if (registrosDoAno.length > 0) {
          const numeros = registrosDoAno.map((r: any) => parseInt(r.numeroOS, 10));
          const proximo = Math.max(...numeros) + 1;
          setForm(prev => ({ ...prev, numeroOS: String(proximo).padStart(3, '0') }));
        } else {
          setForm(prev => ({ ...prev, numeroOS: '001' }));
        }
      } catch (error) {
        console.error('Erro ao calcular próximo número de OS:', error);
      }
    }

    definirProximoNumeroOS();
  }, [anoAtual]);

  const handleVerificarMudanca = () => {
    const nomeAtual = form.nomeSolicitante.trim().toUpperCase();
    const cargoAtual = form.cargoSolicitante.trim().toUpperCase();
    
    if (
      (nomeAtual && nomeAtual !== nomeLembrado.toUpperCase()) || 
      (cargoAtual && cargoAtual !== cargoLembrado.toUpperCase())
    ) {
      setMostrarSugestaoDados(true);
    }
  };

  const handleLembrarDados = () => {
    const nomeAtual = form.nomeSolicitante.trim().toUpperCase();
    const cargoAtual = form.cargoSolicitante.trim().toUpperCase();
    
    localStorage.setItem('fspss_sos_nome_padrao', nomeAtual);
    localStorage.setItem('fspss_sos_cargo_padrao', cargoAtual);
    
    setNomeLembrado(nomeAtual);
    setCargoLembrado(cargoAtual);
    setMostrarSugestaoDados(false);
  };

  const handleNaoLembrarDados = () => {
    setMostrarSugestaoDados(false);
  };

  const handleSalvarEServir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descricaoServico.trim()) return;
    
    setLoading(true);
    
    try {
      await db.table('sos').add({
        numeroOS: form.numeroOS,
        ano: form.ano,
        unidade: form.unidade.toUpperCase(),
        descricaoServico: form.descricaoServico.toUpperCase(),
        observacao: form.observacao.toUpperCase(),
        dataSolicitacao: form.dataSolicitacao,
        nomeSolicitante: form.nomeSolicitante.toUpperCase(),
        cargoSolicitante: form.cargoSolicitante.toUpperCase(),
        contatoSolicitante: form.contatoSolicitante.toUpperCase(),
        status: 'PENDENTE'
      });

      const htmlImpressao = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>S.O.S - Solicitação de Ordem de Serviço #${form.numeroOS}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page { 
                margin: 0.5cm !important; 
                size: landscape; 
              }
              body { background: #fff !important; padding: 0 !important; }
              .print-container { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
            }
            body { background-color: #525659; font-family: ui-sans-serif, system-ui, sans-serif; padding: 30px 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .print-container { max-width: 1040px; margin: 0 auto; background: #fff; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); min-height: 100vh; display: flex; flex-direction: column; }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="w-full border-2 border-blue-700 text-black text-xs bg-white flex-1 flex flex-col justify-between">
              
              <div>
                <div class="grid grid-cols-6 items-center text-center border-b-2 border-blue-700">
                  <div class="col-span-1 p-2 border-r-2 border-blue-700 flex items-center justify-center">
                    <img
                      src="${logoFSPSS}"
                      alt="Logo Fundação"
                      style="max-height: 58px; width: auto; object-fit: contain;"
                    />
                  </div>
                  <div class="col-span-5 p-2">
                    <h1 class="text-xl font-black tracking-wider text-black">S.O.S. SOLICITAÇÃO DE ORDEM DE SERVIÇO</h1>
                  </div>
                </div>

                <div class="grid grid-cols-6 border-b-2 border-blue-700 items-stretch font-bold">
                  <div class="col-span-4 p-2 border-r-2 border-blue-700">
                    <span class="text-[9px] text-black block font-black uppercase">UNIDADE:</span>
                    <span class="text-sm tracking-wide font-black uppercase">${form.unidade}</span>
                  </div>
                  <div class="col-span-1 p-2 border-r-2 border-blue-700 text-center flex flex-col justify-center">
                    <span class="text-[9px] text-black block font-black">Nº</span>
                    <span class="text-sm font-black text-emerald-700">${form.numeroOS}</span>
                  </div>
                  <div class="col-span-1 p-2 text-center flex flex-col justify-center">
                    <span class="text-[9px] text-black block font-black">ANO</span>
                    <span class="text-sm font-black">${form.ano}</span>
                  </div>
                </div>

                <div class="border-b-2 border-blue-700">
                  <div class="bg-gray-100 border-b border-blue-700 px-2 py-1 font-black text-[10px] uppercase tracking-wider">DESCRIÇÃO DO SERVIÇO:</div>
                  <div class="p-3 min-h-[220px] font-mono text-sm leading-relaxed uppercase whitespace-pre-line">${form.descricaoServico || 'NENHUM SERVIÇO DESCRITO.'}</div>
                </div>

                <div class="border-b-2 border-blue-700">
                  <div class="bg-gray-100 border-b border-blue-700 px-2 py-1 font-black text-[10px] uppercase tracking-wider">OBSERVAÇÃO:</div>
                  <div class="p-3 min-h-[100px] font-mono text-sm leading-relaxed uppercase whitespace-pre-line">${form.observacao || '-'}</div>
                </div>
              </div>

              <div class="grid grid-cols-12 items-stretch text-xs mt-auto">
                <div class="col-span-7 border-r-2 border-blue-700">
                  <div class="grid grid-cols-1 border-b border-blue-700 p-1.5 pl-3">
                    <span class="font-bold text-[10px] text-gray-600">DATA:</span>
                    <span class="font-black text-sm">${form.dataSolicitacao}</span>
                  </div>
                  <div class="grid grid-cols-1 border-b border-blue-700 p-1.5 pl-3">
                    <span class="font-bold text-[10px] text-gray-600">NOME:</span>
                    <span class="font-black text-sm uppercase">${form.nomeSolicitante}</span>
                  </div>
                  <div class="grid grid-cols-1 border-b border-blue-700 p-1.5 pl-3">
                    <span class="font-bold text-[10px] text-gray-600">CARGO:</span>
                    <span class="font-black text-sm uppercase">${form.cargoSolicitante}</span>
                  </div>
                  <div class="grid grid-cols-1 p-1.5 pl-3">
                    <span class="font-bold text-[10px] text-gray-600">CONTATO:</span>
                    <span class="font-black text-sm uppercase">${form.contatoSolicitante}</span>
                  </div>
                </div>
                <div class="col-span-5 flex flex-col justify-between p-3 bg-gray-50/50">
                  <div class="w-full text-center text-[9px] font-black uppercase text-gray-400 tracking-wider">RESERVA TÉCNICA / VISTORIA</div>
                  <div class="border-t border-dashed border-gray-400 w-full mb-2"></div>
                </div>
              </div>

            </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { 
                window.print();
              }, 250);
            };
          </script>
        </body>
        </html>
      `;

      const electronAPI = typeof window !== 'undefined' ? (window as any).electronAPI : undefined;

      if (electronAPI?.imprimirHtml) {
        // Dentro do Electron: abre o HTML no navegador padrão do sistema (Edge/Chrome)
        await electronAPI.imprimirHtml(htmlImpressao);
      } else {
        // Fora do Electron (web normal): mantém o comportamento antigo
        const novaAba = window.open('', '_blank');
        if (novaAba) {
          novaAba.document.write(htmlImpressao);
          novaAba.document.close();
        }
      }

      setForm(prev => ({
        ...prev,
        descricaoServico: '',
        observacao: '',
        numeroOS: String(parseInt(prev.numeroOS, 10) + 1).padStart(3, '0')
      }));

    } catch (error) {
      console.error('Erro ao registrar a Ordem de Serviço no Dexie.', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto text-gray-950">
        
        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">Módulo de Manutenção</span>
            <h1 className="text-xl font-black text-gray-900 tracking-wide uppercase">SOLICITAÇÃO DE ORDEM DE SERVIÇO (S.O.S)</h1>
            <p className="text-xs text-gray-500 mt-0.5">Gere novos chamados salvos localmente</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] block text-gray-400 font-black uppercase tracking-wider">Nº OS ATUAL</span>
            <span className="text-base font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{form.numeroOS} / {form.ano}</span>
          </div>
        </div>

        <form onSubmit={handleSalvarEServir} className="space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Unidade Solicitante</label>
              <input 
                type="text" 
                value={form.unidade} 
                onChange={(e) => setForm({...form, unidade: e.target.value})}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase font-bold text-gray-900"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Contato / Ramal</label>
              <input 
                type="text" 
                value={form.contatoSolicitante} 
                onChange={(e) => setForm({...form, contatoSolicitante: e.target.value})}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase font-bold text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Nome do Solicitante</label>
              <input
                type="text"
                placeholder="NOME"
                value={form.nomeSolicitante}
                onChange={(e) => {
                  setMostrarSugestaoDados(false);
                  setForm({...form, nomeSolicitante: e.target.value.toUpperCase()});
                }}
                onBlur={handleVerificarMudanca}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase font-bold text-gray-900"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Cargo do Solicitante</label>
              <input
                type="text"
                placeholder="EX: AUXILIAR ADMINISTRATIVO"
                value={form.cargoSolicitante}
                onChange={(e) => {
                  setMostrarSugestaoDados(false);
                  setForm({...form, cargoSolicitante: e.target.value.toUpperCase()});
                }}
                onBlur={handleVerificarMudanca}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase font-bold text-gray-900"
              />
            </div>
          </div>

          {mostrarSugestaoDados && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 gap-3">
              <span className="text-[11px] text-blue-800 font-bold">
                Deseja usar <span className="text-blue-600">{form.nomeSolicitante.trim()}</span> e <span className="text-blue-600">{form.cargoSolicitante.trim()}</span> como padrão?
              </span>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleLembrarDados}
                  className="text-[10px] font-black uppercase bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={handleNaoLembrarDados}
                  className="text-[10px] font-black uppercase bg-white text-gray-600 border border-gray-300 px-3 py-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Não
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Descrição Detalhada do Serviço</label>
            <textarea 
              rows={6}
              placeholder="DESCREVA AQUI O PROBLEMA APRESENTADO OU O REPARO ESTRUTURAL/TÉCNICO NECESSÁRIO..."
              value={form.descricaoServico}
              onChange={(e) => setForm({...form, descricaoServico: e.target.value})}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase text-gray-900 placeholder-gray-400 tracking-wide"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Observações Adicionais / Detalhes de Urgência</label>
            <textarea 
              rows={2}
              placeholder="EX: VAZAMENTO ATIVO, FIÇÃO EXPOSTA, RISCO DE QUEDA, ETC..."
              value={form.observacao}
              onChange={(e) => setForm({...form, observacao: e.target.value})}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white uppercase text-gray-900 placeholder-gray-400 tracking-wide"
            />
          </div>

          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold text-gray-700">
            <div>
              <span className="text-gray-400 block text-[9px] font-black uppercase tracking-wider mb-0.5">Solicitante:</span>
              <span className="text-gray-900 uppercase">{form.nomeSolicitante || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[9px] font-black uppercase tracking-wider mb-0.5">Cargo / Função:</span>
              <span className="text-gray-900 uppercase">{form.cargoSolicitante || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-[9px] font-black uppercase tracking-wider mb-0.5">Data de Abertura:</span>
              <span className="text-blue-600 font-mono">{form.dataSolicitacao}</span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'SALVANDO NO BANCO LOCAL...' : 'REGISTRAR E IMPRIMIR S.O.S'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
