'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, List, Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
// Importa o db direto da raiz do projeto
import { db } from '../../db'; 
// Importa as imagens do arquivo imagens.js (ajuste as '../' se a pasta app estiver em outro nível)
import { imprimirHtmlNoDesktop } from '@/utils/print';
import { gerarHtmlRemessa } from '@/utils/geradorLayoutPrint';

export default function CriarRemessa() {
  const [htmlPreview, setHtmlPreview] = useState(null);
  const [novaRemessa, setNovaRemessa] = useState({
    de: '',
    para: '',
    ac: 'RESPONSÁVEL',
    assunto: '',
    descricao: '',
  });

  const [remessaGerada, setRemessaGerada] = useState(null);
  const [proximoNumero, setProximoNumero] = useState(null);
  const [carregandoNumero, setCarregandoNumero] = useState(true);

  // BUSCA O PRÓXIMO NÚMERO DIRETO DO DEXIE (À PROVA DE F5)
  useEffect(() => {
    async function buscarUltimoNumero() {
      try {
        setCarregandoNumero(true);
        const anoAtual = new Date().getFullYear().toString();

        // Pega TODAS as remessas salvas localmente para garantir a leitura correta
        const todasAsRemessas = await db.remessas.toArray();

        // Filtra apenas as que pertencem ao ano atual de forma segura
        const remessasDoAno = todasAsRemessas.filter(r => {
          if (!r.dataSaida) return false;
          // Aceita tanto formato DD/MM/AAAA quanto AAAA-MM-DD
          return r.dataSaida.includes(anoAtual);
        });

        if (remessasDoAno.length > 0) {
          // Extrai os números cadastrados, descobre o maior e soma +1
          const numeros = remessasDoAno.map(r => Number(r.numeroRemessa) || 0);
          const maiorNumero = Math.max(...numeros);
          setProximoNumero(maiorNumero + 1);
        } else {
          // Se for um ano novo ou banco limpo, começa em 1
          setProximoNumero(1);
        }
      } catch (error) {
        console.error('Erro ao ler dados do IndexedDB:', error);
        setProximoNumero(1); 
      } finally {
        setCarregandoNumero(false);
      }
    }

    buscarUltimoNumero();
  }, []);

  // CARREGA A UNIDADE PADRÃO SALVA NAS CONFIGURAÇÕES
  useEffect(() => {
    const unidadSalva = localStorage.getItem('fspss_unidade_padrao');

    if (unidadSalva) {
      setNovaRemessa(prev => ({
        ...prev,
        de: unidadSalva.toUpperCase()
      }));
    }
  }, []);

  const handleSalvarEMostrar = async (e) => {
    e.preventDefault();
    if (!proximoNumero) return;

    const anoAtual = new Date().getFullYear().toString();
    const dataHoje = new Date().toLocaleDateString('pt-BR'); // Ex: 16/05/2026

    const documento = {
      numeroRemessa: proximoNumero,
      de: novaRemessa.de,
      destino: novaRemessa.para, // Mapeado exatamente para a coluna 'destino' do seu db.js
      ac: novaRemessa.ac,
      assunto: novaRemessa.assunto,
      descricao: novaRemessa.descricao || 'SEM MAIS',
      dataSaida: dataHoje,
      status: 'Pendente'
    };

    try {
      // SALVAMENTO REAL NO NAVEGADOR
      // Guardamos o ID real gerado no Dexie para buscar na página de impressão
      const idGerado = await db.remessas.add(documento);

      // Mantém exatamente o seu objeto remessaGerada original, mas incluindo o ID do banco
      setRemessaGerada({
        id: idGerado, // Guarda o ID gerado pelo Dexie para a URL
        ano: anoAtual,
        ...documento
      });
    } catch (error) {
      console.error('Erro crítico ao gravar no IndexedDB:', error);
      alert('Erro ao salvar localmente. Abra o console do navegador (F12).');
    }
  };

  const limparFormulario = () => {
    setNovaRemessa({ ...novaRemessa, descricao: '' });
    setProximoNumero((prev) => prev + 1);
    setRemessaGerada(null);
  };

  const abrirJanelaImpressao = () => {
    if (!remessaGerada) return;

    const corpoHTML = gerarHtmlRemessa(remessaGerada);
    const htmlCompleto = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Guia de Remessa #${remessaGerada.numeroRemessa}</title>
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
  };

  const handleImprimirDoModal = () => {
    if (htmlPreview) {
      imprimirHtmlNoDesktop(htmlPreview);
    }
  };

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
      
      {/* CABEÇALHO COM OS LOGOS IMPORTADOS */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Emissão de Remessas</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">FSPSS - Gestão Clínica</p>
          </div>
        </div>
        
        <div className="flex items-center gap-5">
          <Link 
            href="/remessas/historico"
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded-lg text-xs shadow-md"
          >
            <List size={14} /> Abrir Histórico
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {!remessaGerada && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <form onSubmit={handleSalvarEMostrar} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-700 uppercase mb-1">Origem (DE)</label>
                <input
                  type="text"
                  value={novaRemessa.de}
                  onChange={(e) => setNovaRemessa({...novaRemessa, de: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-2 text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-700 uppercase mb-1">Destino (PARA)</label>
                <input
                  type="text"
                  value={novaRemessa.para}
                  onChange={(e) => setNovaRemessa({...novaRemessa, para: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-2 text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-700 uppercase mb-1">A/C</label>
                <input
                  type="text"
                  value={novaRemessa.ac}
                  onChange={(e) => setNovaRemessa({...novaRemessa, ac: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-2 text-sm font-bold"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-[10px] font-black text-gray-700 uppercase mb-1">Assunto</label>
                <input
                  type="text"
                  value={novaRemessa.assunto}
                  onChange={(e) => setNovaRemessa({...novaRemessa, assunto: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-2 text-sm font-black"
                  required
                />
              </div>

              <div className="md:col-span-3">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-black text-gray-700 uppercase">
                    Descrição
                  </label>
                  {/* Ajustado para 300 em todos os pontos */}
                  <span className={`text-[9px] font-black ${novaRemessa.descricao.length >= 300 ? 'text-red-600' : 'text-gray-400'}`}>
                    {novaRemessa.descricao.length}/300 caracteres
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={300} 
                  value={novaRemessa.descricao}
                  onChange={(e) => setNovaRemessa({...novaRemessa, descricao: e.target.value.toUpperCase()})}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-2 text-xs font-mono uppercase"
                  placeholder="Máximo de 300 caracteres..."
                  required
                />
              </div>

              <div className="md:col-span-3 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={carregandoNumero}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-6 py-3 rounded-lg text-xs uppercase tracking-wider flex items-center gap-2"
                >
                  {carregandoNumero ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Lendo Banco Local...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} /> Salvar e Gerar Guia (Nº {proximoNumero})
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {remessaGerada && (
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            
            <h2 className="text-xl font-black text-gray-900 mb-1">Guia de Remessa Nº {remessaGerada.numeroRemessa}!</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">...</p>
            
            <div className="flex justify-center gap-3">
              <button
                onClick={limparFormulario}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-5 rounded-lg text-xs"
              >
                Criar Nova Guia
              </button>
              
              <button
                onClick={abrirJanelaImpressao}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-lg text-xs flex items-center gap-2 uppercase tracking-wider"
              >
                <Eye size={14} /> Abrir Aba de Impressão (PDF)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}