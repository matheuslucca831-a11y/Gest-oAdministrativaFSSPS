'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db'; 
import { supabase } from '@/utils/supabase-client';

export const dynamic = 'force-dynamic';

export default function AbaArquivosImpressos() {
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [aviso, setAviso] = useState(null);
  
  // 1. LEITURA LOCAL (Dexie)
  const listaBase = useLiveQuery(async () => {
    return await db.table('arquivos_cache').toArray();
  }, []);
  
  const lista = useMemo(() => listaBase || [], [listaBase]);

  // Filtro instantâneo
  const arquivosFiltrados = useMemo(() => {
    if (!busca.trim()) return lista;
    const termo = busca.toLowerCase();
    
    return lista.filter(item => 
      item.titulo?.toLowerCase().includes(termo) ||
      item.categoria?.toLowerCase().includes(termo)
    );
  }, [lista, busca]);

  // 2. A LÓGICA DO BOTÃO ATUALIZAR
  const sincronizarComSupabase = useCallback(async (acessoSilencioso = false) => {
      // 1. Verificação de Segurança: Supabase existe?
      if (!supabase) {
        console.error("Supabase não inicializado!");
        setAviso({ texto: 'Erro interno: Cliente Supabase não configurado.', tipo: 'erro' });
        return;
      }

      if (typeof window !== 'undefined' && !navigator.onLine) {
        if (!acessoSilencioso) {
          setAviso({ 
            texto: 'Dispositivo sem internet.', 
            tipo: 'offline' 
          });
        }
        return;
      }

      setCarregando(true);
      setAviso(null);

      try {
        // 2. Tentar a conexão
        const { data, error } = await supabase
          .from('arquivos_gerais')
          .select('*');

        if (error) throw error;

        if (data) {
          await db.table('arquivos_cache').clear();
          await db.table('arquivos_cache').bulkAdd(data);
          if (!acessoSilencioso) {
            setAviso({ texto: 'Lista atualizada com sucesso!', tipo: 'ok' });
          }
        }
      } catch (err) {
        console.error('Erro detalhado do Supabase:', err); // Isso vai aparecer no console F12
        if (!acessoSilencioso) {
          setAviso({ texto: 'Erro ao conectar no servidor. Verifique o console.', tipo: 'erro' });
        }
      } finally {
        setCarregando(false);
      }
    }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-950 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
              Arquivos & Impressos Institucionais
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Repositório de formulários de ponto, folgas e documentos de uso contínuo da unidade.
            </p>
          </div>

          {/* BOTÃO ATUALIZAR */}
          <button
            type="button"
            onClick={() => sincronizarComSupabase(false)}
            disabled={carregando}
            className={`px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm ${
              carregando 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95 cursor-pointer'
            }`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" viewBox="0 0 24 24" 
              strokeWidth={2.5} stroke="currentColor" 
              className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {carregando ? 'Sincronizando...' : 'Atualizar Lista'}
          </button>
        </div>

        {/* BARRA DE FEEDBACK */}
        {aviso && (
          <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold animate-in fade-in duration-200 ${
            aviso.tipo === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
            aviso.tipo === 'offline' ? 'bg-amber-50 border-amber-200 text-amber-800' :
            'bg-red-50 border-red-200 text-red-800'
          }`}>
            <span>{aviso.texto}</span>
          </div>
        )}

        {/* CAMPO DE PESQUISA */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm space-y-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
            Pesquisa Rápida Local
          </span>
          <div className="relative">
            <input 
              type="text"
              placeholder="DIGITE O NOME DO ARQUIVO OU CATEGORIA (EX: PONTO, FOLGA)..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-xs font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white uppercase transition-colors"
            />
          </div>
        </div>

        {/* LISTAGEM DOS ARQUIVOS */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
          {arquivosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-black tracking-wide uppercase text-xs">
              {busca ? 'Nenhum documento coincide com a pesquisa.' : 'Banco local vazio. Clique no botão "Atualizar Lista" acima.'}
            </div>
          ) : (
            arquivosFiltrados.map((item) => (
              <div 
                key={item.id}
                className="p-4 sm:p-5 flex items-center justify-between hover:bg-blue-50/40 transition-colors group"
              >
                <div className="flex items-center gap-4 min-w-0 pr-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>

                  <div className="min-w-0">
                    <span className="text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 inline-block mb-1">
                      {item.categoria || 'Geral'}
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-gray-800 uppercase tracking-wide truncate group-hover:text-blue-600 transition-colors">
                      {item.titulo}
                    </h3>
                  </div>
                </div>

                <a
                  href={item.arquivo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#edf3fc] border border-[#d2e3fc] hover:bg-blue-600 text-[#1a73e8] hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
                >
                  <span>Abrir</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              </div>
            ))
          )}
        </div>

        <div className="text-center pt-2">
          <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">
            ⚡ Sistema Offline-First • Os arquivos exibidos estão armazenados localmente
          </span>
        </div>

      </div>
    </div>
  );
}