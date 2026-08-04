'use client'; // 👈 1. O SEGREDO: Avisa o Next que essa tela roda no navegador!

import React, { useState, useEffect } from 'react';
import { useProtocolos, ProtocoloExame } from '../../hooks/useProtocolos';
import { RefreshCw, Search, ExternalLink, FileText } from 'lucide-react';
import { supabase } from '@/utils/supabase-client';
import { Link2, Download } from 'lucide-react';

// 👇 2. CORRIGIDO PARA "export default function"
export default function PageProtocolos() { 
  const { protocolos, isSyncing, sincronizarComSupabase } = useProtocolos();
  const [busca, setBusca] = useState('');
  const [protocoloSelecionado, setProtocoloSelecionado] = useState<ProtocoloExame | null>(null);
  const [linksInstitucionais, setLinksInstitucionais] = useState<any[]>([]);

  useEffect(() => {
    sincronizarComSupabase();
    carregarLinks();
  }, []);

  const carregarLinks = async () => {
    const { data, error } = await supabase
      .from('links_institucionais')
      .select('*')
      .order('titulo', { ascending: true });

    if (!error) setLinksInstitucionais(data || []);
  };


  // Filtro de pesquisa rápida local (por nome ou sigla)
  const protocolosFiltrados = protocolos.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.sigla.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto bg-slate-50 min-h-screen">
      
      {/* CABEÇALHO IGUAL AO DA IMAGEM */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Protocolos de Exames & Preparos
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Repositório offline de orientações e checklists para solicitação de exames.
          </p>
        </div>

        <button
          onClick={() => sincronizarComSupabase()}
          disabled={isSyncing}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'ATUALIZANDO...' : 'ATUALIZAR LISTA'}
        </button>
      </div>

      {/* BARRA DE PESQUISA */}
      <div className="relative mb-6">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="DIGITE O NOME DO EXAME OU SIGLA (EX: EDA, COLONO, SANGUE)..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase placeholder:text-slate-400 placeholder:font-normal"
        />
      </div>
      {/* Link externo para protocolo de regulação geral */}
      {linksInstitucionais.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
            <Link2 size={14} /> Documentos e Protocolos Externos
          </h3>
          <div className="space-y-2">
            {linksInstitucionais.map((link) => (
              <div key={link.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                <span className="text-xs font-bold text-slate-700">{link.titulo}</span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-600 hover:text-white px-2.5 py-1.5 rounded-lg transition-all uppercase"
                >
                  <Download size={11} /> Baixar
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* LISTA DE CARDS */}
      <div className="space-y-3">
        {protocolosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400">
            Nenhum protocolo encontrado no cache local.
          </div>
        ) : (
          protocolosFiltrados.map((item) => (
            <div 
              key={item.id}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {item.sigla}
                  </span>
                  <h3 className="text-base font-bold text-slate-800 mt-1 uppercase">
                    {item.nome}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setProtocoloSelecionado(item)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 border border-blue-200 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors"
              >
                ABRIR CHECKLIST <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* RODAPÉ DE STATUS OFFLINE */}
      <div className="text-center mt-8 text-xs font-bold text-amber-600 tracking-wider">
        ⚡ • OS PROTOCOLOS EXIBIDOS ESTÃO ARMAZENADOS LOCALMENTE
      </div>

      {/* MODAL SIMPLES PARA EXIBIR O CHECKLIST */}
      {protocoloSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl">
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {protocoloSelecionado.sigla}
                </span>
                <h2 className="text-xl font-bold text-slate-800 mt-1 uppercase">
                  {protocoloSelecionado.nome}
                </h2>
              </div>
              <button 
                onClick={() => setProtocoloSelecionado(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="prose max-w-none text-slate-600 whitespace-pre-wrap font-sans text-sm bg-slate-50 p-4 rounded-xl border">
              {protocoloSelecionado.checklist || "Nenhum checklist cadastrado para este exame."}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setProtocoloSelecionado(null)}
                className="bg-slate-900 text-white font-bold px-5 py-2 rounded-xl text-sm"
              >
                FECHAR
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}