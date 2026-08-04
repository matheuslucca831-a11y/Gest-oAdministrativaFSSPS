'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  UserPlus, Package, Send, ArrowUpRight, 
  Activity, FileText, CheckCircle, Wrench,
  Download, Sparkles, X
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase-client';



// DEFINA AQUI A VERSÃO ATUAL DESTE BUILD DO SEU APP ELECTRON
const VERSAO_ATUAL_APP = "1.0.0"; 

interface DadosAtualizacao {
  versao: string;
  url_download: string;
  notas_atualizacao: string;
}

export default function Home() {
  // Estado para armazenar se há atualização disponível
  const [atualizacao, setAtualizacao] = useState<DadosAtualizacao | null>(null);
  const [ignorarAlerta, setIgnorarAlerta] = useState(false);

  // Indicadores rápidos de integridade e status do IndexedDB local
  const infoRapidas = [
    { label: 'Status do Sistema', value: 'Local / Offline', icon: <Activity size={16} className="text-emerald-500" /> },
    { label: 'Banco de Dados', value: 'IndexedDB Ativo', icon: <CheckCircle size={16} className="text-blue-500" /> },
    { label: 'Versão Instalada', value: `v${VERSAO_ATUAL_APP}`, icon: <Wrench size={16} className="text-purple-500" /> }
  ];

  // Busca a versão mais recente em segundo plano ao abrir o Dashboard
  useEffect(() => {
    async function checarNovasVersoes() {
      try {
        const { data, error } = await supabase
          .from('app_versoes')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) return;

        // Se a versão do banco for diferente da versão fixada no código, exibe o alerta
        if (data.versao !== VERSAO_ATUAL_APP) {
          setAtualizacao({
            versao: data.versao,
            url_download: data.url_download,
            notas_atualizacao: data.notas_atualizacao
          });
        }
      } catch (err) {
        console.log("Modo offline: não foi possível checar atualizações no Supabase.");
      }
    }

    checarNovasVersoes();
  }, []);

  // Função para abrir o link no navegador nativo (fora do Electron) ou baixar direto
  const abrirDownload = (url: string) => {
    if (typeof window !== 'undefined' && window.require) {
      // Se estiver rodando dentro do Electron, usa o shell do sistema
      const { shell } = window.require('electron');
      shell.openExternal(url);
    } else {
      // Se estiver no navegador normal (teste), abre em nova aba
      window.open(url, '_blank');
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 sm:p-8 text-gray-950">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* CABEÇALHO PRINCIPAL */}
        <div className="border-b-2 border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest block mb-1">
              FSPSS - Fundação de Saúde Pública de São Sebastião
            </span>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Gestão Clínica & Administrativa
            </h1>
            <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wide">
              Módulos locais integrados para otimização de fluxo de trabalho
            </p>
          </div>

          {/* INDICADORES RÁPIDOS DE STATUS */}
          <div className="flex flex-wrap gap-3">
            {infoRapidas.map((item, index) => (
              <div key={index} className="border p-3 rounded-xl flex items-center gap-3 bg-white shadow-sm min-w-[150px]">
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                  {item.icon}
                </div>
                <div>
                  <span className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">{item.label}</span>
                  <span className="text-xs font-black text-gray-800">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TELINHA / BANNER DE ATUALIZAÇÃO DISPONÍVEL (SÓ APARECE SE HOUVER NOVA v.) */}
        {/* ========================================================================= */}
        {atualizacao && !ignorarAlerta && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-5 rounded-2xl shadow-lg border border-amber-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20 text-white shrink-0 mt-0.5">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-white text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Nova Atualização
                  </span>
                  <h3 className="text-lg font-black tracking-tight">
                    Versão {atualizacao.versao} disponível para instalação!
                  </h3>
                </div>
                <p className="text-xs text-amber-100 mt-1 font-medium max-w-2xl leading-relaxed">
                  <strong className="text-white underline">O que mudou:</strong> {atualizacao.notas_atualizacao}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              <button
                onClick={() => setIgnorarAlerta(true)}
                className="px-3 py-2 text-xs font-bold text-amber-100 hover:text-white hover:bg-black/10 rounded-lg transition-colors"
              >
                Lembrar depois
              </button>
              <button
                onClick={() => abrirDownload(atualizacao.url_download)}
                className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:shadow-xl transition-all cursor-pointer group"
              >
                <Download size={16} className="text-amber-400 group-hover:translate-y-0.5 transition-transform" />
                <span>Baixar Instalador (.exe)</span>
              </button>
            </div>
          </div>
        )}
        {/* ========================================================================= */}

        {/* SEÇÃO DOS MÓDULOS */}
        <div className="space-y-4">
          <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
            Selecione o Módulo de Trabalho
          </h2>

          {/* GRADE DE LINKS DINÂMICA (4 COLUNAS EM TELAS GRANDES) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* CARD 1: ENCAMINHAMENTOS (REGULAÇÃO) */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <UserPlus size={20} />
                </div>
                <h3 className="font-black text-base text-gray-900 uppercase tracking-tight">Encaminhamentos</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                  Controle interno de demandas e triagem de guias. Organiza o fluxo local antes do envio físico para processamento e marcação na Regulação.
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
                <Link href="/encaminhamentos" className="flex items-center justify-between text-xs font-bold text-emerald-600 hover:underline py-1">
                  <span>Novo Registro / Entrada</span>
                  <ArrowUpRight size={14} />
                </Link>
                <Link href="/chegadas" className="flex items-center justify-between text-xs font-bold text-gray-600 hover:underline py-1">
                  <span>Marcar Chegada de Guia</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* CARD 2: REMESSAS (RECURSOS HUMANOS / ALMOXARIFADO) */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 mb-4 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <Send size={18} />
                </div>
                <h3 className="font-black text-base text-gray-900 uppercase tracking-tight">Remessas Oficiais</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                  Emissão e controle de guias de remessa com numeração sequencial anual. Ideal para o envio formalizado de ocorrências ao RH e documentos diversos.
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
                <Link href="/remessas" className="flex items-center justify-between text-xs font-bold text-emerald-600 hover:underline py-1">
                  <span>Emitir Nova Guia de Remessa</span>
                  <ArrowUpRight size={14} />
                </Link>
                <Link href="/remessas/historico" className="flex items-center justify-between text-xs font-bold text-gray-600 hover:underline py-1">
                  <span>Histórico de Envios (Baixas)</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* CARD 3: PEDIDOS MENSAIS */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-lg flex items-center justify-center text-amber-600 mb-4 transition-colors group-hover:bg-amber-600 group-hover:text-white">
                  <Package size={18} />
                </div>
                <h3 className="font-black text-base text-gray-900 uppercase tracking-tight">Pedidos Mensais</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                  Gestão recorrente e conferência de insumos da unidade. Controle de pedidos para materiais de limpeza, artigos de escritório e fórmulas para acamados.
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
                <Link href="/pedidos/limpeza" className="flex items-center justify-between text-xs font-bold text-emerald-600 hover:underline py-1">
                  <span>Material de Limpeza</span>
                  <ArrowUpRight size={14} />
                </Link>
                <Link href="/pedidos/escritorio" className="flex items-center justify-between text-xs font-bold text-gray-600 hover:underline py-1">
                  <span>Material de Escritório</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* CARD 4: MÓDULO S.O.S (MANUTENÇÃO) */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4 transition-colors group-hover:bg-purple-600 group-hover:text-white">
                  <Wrench size={18} />
                </div>
                <h3 className="font-black text-base text-gray-900 uppercase tracking-tight">Manutenção S.O.S</h3>
                <p className="text-xs text-gray-500 mt-1 font-medium leading-relaxed">
                  Abertura e monitoramento de reparos estruturais, técnicos e de urgência da unidade. Emissão imediata da ficha física de vistoria para a equipe técnica.
                </p>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col gap-2">
                <Link href="/sos/gerarsos" className="flex items-center justify-between text-xs font-bold text-emerald-600 hover:underline py-1">
                  <span>Gerar Nova Guia S.O.S</span>
                  <ArrowUpRight size={14} />
                </Link>
                <Link href="/sos/historicosos" className="flex items-center justify-between text-xs font-bold text-gray-600 hover:underline py-1">
                  <span>Controle de Chamados</span>
                  <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* NOTA DE RODAPÉ / AVISO DE SEGURANÇA */}
        <div className="p-4 bg-gray-800 text-gray-300 rounded-xl border border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-700 text-gray-300">
              <FileText size={16} />
            </div>
            <p className="text-[11px] font-medium leading-normal text-gray-400">
              <strong className="text-white block uppercase tracking-wide">Aviso Importante de Dados Localizados</strong>
              Este sistema opera de maneira estritamente local.
            </p>
          </div>
        </div>

      </div>
    </main>
  );
}