'use client';
import React, { useState, useEffect } from 'react';
import { useProdutosPedidos } from '@/hooks/useProdutosPedidos';
import { saveAs } from 'file-saver';
import * as docx from 'docx';
import { FileText, Search, Plus, Trash2, X, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { logoFSPSS, logoBrasil } from './imagens';

export default function PedidoLimpezaCompleto() {
  const [unidade, setUnidade] = useState('');
  const [busca, setBusca] = useState('');
  
  const { produtos: produtosOficiais, sincronizarComSupabase, isSyncing } = useProdutosPedidos('limpeza');
  const [itensCatalogo, setItensCatalogo] = useState([]);

  const [valores, setValores] = useState({});

  // --- ESTADOS DO MODAL ---
  const [modalAberta, setModalAberta] = useState(false);
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaUnidade, setNovaUnidade] = useState('UND');

  // ESTADO REUTILIZÁVEL PARA DIÁLOGOS DE ALERT E CONFIRM (COMPATÍVEL COM ELECTRON)
  const [dialogo, setDialogo] = useState({
    aberto: false,
    tipo: 'alert', // 'alert' ou 'confirm'
    titulo: '',
    mensagem: '',
    onConfirmar: null,
  });

  const abrirAlerta = (titulo, mensagem) => {
    setDialogo({
      aberto: true,
      tipo: 'alert',
      titulo,
      mensagem,
      onConfirmar: null,
    });
  };

  const abrirConfirmacao = (titulo, mensagem, onConfirmar) => {
    setDialogo({
      aberto: true,
      tipo: 'confirm',
      titulo,
      mensagem,
      onConfirmar,
    });
  };

  const fecharDialogo = () => {
    setDialogo((prev) => ({ ...prev, aberto: false }));
  };

  const handleConfirmarDialogo = () => {
    if (dialogo.onConfirmar) {
      dialogo.onConfirmar();
    }
    fecharDialogo();
  };

  useEffect(() => {
    const unidadeSalva = localStorage.getItem('fspss_unidade_padrao');

    if (unidadeSalva) {
      setUnidade(unidadeSalva);
    }

    sincronizarComSupabase(); // 👈 busca produtos do Supabase ao abrir
  }, []);

  useEffect(() => {
    setItensCatalogo(produtosOficiais);
  }, [produtosOficiais]);
  
  const handleQtdChange = (id, qtd) => {
    setValores({ ...valores, [id]: qtd });
  };

  // 1. Abrir Modal de Cadastro
  const abrirModalCadastro = () => {
    setNovoCodigo('');
    setNovaDescricao('');
    setNovaUnidade('UND');
    setModalAberta(true);
  };

  // 2. Salvar Item pelo Modal
  const salvarNovoItem = () => {
    if (!novoCodigo.trim() || !novaDescricao.trim()) {
      abrirAlerta('Campos Obrigatórios', 'Por favor, preencha o Código e a Descrição.');
      return;
    }

    setItensCatalogo([
      {
        id: novoCodigo.trim(),
        codigo: novoCodigo.trim(),
        nome: novaDescricao.trim().toUpperCase(),
        unidade: novaUnidade ? novaUnidade.trim().toUpperCase() : 'UND'

      },
      ...itensCatalogo
    ]);

    setModalAberta(false);
  };

  // Atualizar Produtos (com modal customizado no lugar do confirm() nativo)
  const handleAtualizarProdutos = () => {
    abrirConfirmacao(
      'Atualizar Produtos',
      'Isso vai descartar itens adicionados/removidos nesta sessão e recarregar a lista oficial mais recente. Deseja continuar?',
      async () => {
        await sincronizarComSupabase();
      }
    );
  };

  // 3. Função para Excluir Item do catálogo (com modal customizado no lugar do confirm() nativo)
  const excluirItem = (id) => {
    abrirConfirmacao(
      'Remover Item',
      'DESEJA REALMENTE REMOVER ESTE ITEM DO CATÁLOGO?',
      () => {
        setItensCatalogo((prev) => prev.filter((item) => item.id !== id));
      }
    );
  };

  const exportarDocx = () => {
    const todosOsItens = itensCatalogo;
    const base64ToUint8Array = (base64) => {
      const cleanBase64 = base64.includes(',')
        ? base64.split(',')[1]
        : base64;
  
      const binaryString = atob(cleanBase64);
  
      const bytes = new Uint8Array(binaryString.length);
  
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
  
      return bytes;
    };
  
    const doc = new docx.Document({
      styles: {
        default: {
          document: {
            run: { size: 20, font: "Arial" },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            margin: { 
              top: 1440,    // 1 in
              bottom: 1699, // 1,18 in
              left: 1138,   // 0,79 in
              right: 1555   // 1,08 in
            },
          },
        },
        headers: {
          default: new docx.Header({
            children: [
              new docx.Table({
                width: { size: 100, type: docx.WidthType.PERCENTAGE },
                borders: docx.TableBorders.NONE,
                rows: [
                  new docx.TableRow({
                    children: [
                      new docx.TableCell({
                        width: { size: 20, type: docx.WidthType.PERCENTAGE },
                        children: [
                          new docx.Paragraph({
                            children: [
                              new docx.ImageRun({
                                data: base64ToUint8Array(logoFSPSS),
                                transformation: {
                                  width: 91,
                                  height: 115,
                                },
                                type: 'png',
                              })
                            ],
                          }),
                        ],
                      }),
                      new docx.TableCell({
                        width: { size: 60, type: docx.WidthType.PERCENTAGE },
                        children: [
                          new docx.Paragraph({
                            children: [
                              new docx.TextRun({ 
                                text: "FUNDAÇÃO DE SAÚDE PÚBLICA DE SÃO SEBASTIÃO", 
                                font: "Times New Roman",
                                size: 24, 
                                color: "000000",
                                bold: true 
                              }),
                            ],
                            alignment: docx.AlignmentType.CENTER,
                            spacing: { line: 360 },
                          }),
                          new docx.Paragraph({
                            children: [
                              new docx.TextRun({ 
                                text: "Lei Complementar nº 168/2013 e alterações", 
                                font: "Times New Roman",
                                size: 22, 
                                color: "7F7F7F",
                              }),
                            ],
                            alignment: docx.AlignmentType.CENTER,
                            spacing: { 
                              line: 360, 
                              after: 800 
                            },
                          }),
                        ],
                        verticalAlign: docx.VerticalAlign.CENTER,
                      }),
                      new docx.TableCell({
                        width: { size: 20, type: docx.WidthType.PERCENTAGE },
                        children: [
                          new docx.Paragraph({
                            children: [
                              new docx.ImageRun({
                                data: base64ToUint8Array(logoBrasil),
                                transformation: {
                                  width: 88,
                                  height: 111,
                                },
                                type: 'png',
                              })
                            ],
                            alignment: docx.AlignmentType.RIGHT,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new docx.Paragraph({
            children: [
              new docx.TextRun({ 
                text: "PEDIDO MENSAL – MATERIAL DE LIMPEZA 2026", 
                font: "Arial",
                size: 22, 
                color: "000000",
                bold: true 
              }),
            ],
            alignment: docx.AlignmentType.CENTER,
            spacing: { before: 200, after: 120 },
          }),
  
          new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: docx.TableBorders.NONE,
            rows: [
              new docx.TableRow({
                children: [
                  new docx.TableCell({
                    width: { size: 70, type: docx.WidthType.PERCENTAGE },
                    children: [
                      new docx.Paragraph({
                        children: [
                          new docx.TextRun({ text: "UNIDADE DE SAÚDE: ", bold: true, size: 20 }),
                          new docx.TextRun({ text: unidade.toUpperCase(), bold: true, size: 20 }),
                        ],
                      }),
                    ],
                  }),
                  new docx.TableCell({
                    width: { size: 30, type: docx.WidthType.PERCENTAGE },
                    children: [
                      new docx.Paragraph({
                        children: [
                          new docx.TextRun({ text: "DATA: ", bold: true, size: 20 }),
                          new docx.TextRun({ text: new Date().toLocaleDateString('pt-BR'), bold: true, size: 20 }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
  
          new docx.Paragraph({ text: "", spacing: { after: 200 } }),
  
          new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            rows: [
              new docx.TableRow({
                children: [
                  new docx.TableCell({ width: { size: 12, type: docx.WidthType.PERCENTAGE }, children: [new docx.Paragraph({ text: "CÓDIGO", bold: true, alignment: docx.AlignmentType.CENTER })] }),
                  new docx.TableCell({ width: { size: 58, type: docx.WidthType.PERCENTAGE }, children: [new docx.Paragraph({ text: "DESCRIÇÃO", bold: true, alignment: docx.AlignmentType.CENTER })] }),
                  new docx.TableCell({ width: { size: 10, type: docx.WidthType.PERCENTAGE }, children: [new docx.Paragraph({ text: "UNID.", bold: true, alignment: docx.AlignmentType.CENTER })] }),
                  new docx.TableCell({ width: { size: 20, type: docx.WidthType.PERCENTAGE }, children: [new docx.Paragraph({ text: "PEDIDO", bold: true, alignment: docx.AlignmentType.CENTER })] }),
                ],
              }),
              ...todosOsItens.map(item => new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph({ text: item.codigo ? item.codigo.toString() : '' })] }),
                  new docx.TableCell({ children: [new docx.Paragraph({ text: item.nome.toUpperCase(), spacing: { before: 30, after: 30 } })] }),
                  new docx.TableCell({ children: [new docx.Paragraph({ text: item.unidade })] }),
                  new docx.TableCell({ children: [new docx.Paragraph({ text: valores[item.id] ? valores[item.id].toString() : "", bold: true })] }),
                ],
              })),
            ],
          }),
  
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "OBSERVAÇÃO: TODOS OS PEDIDOS ESTARÃO SUJEITOS A ANÁLISE E APROVAÇÃO DO DEPARTAMENTO ADMINISTRATIVO, (ALMOXARIFADO).",
                font: "Times New Roman",
                bold: true,
                size: 24,
              }),
            ],
            spacing: { before: 300 },
          }),
        ],
      }],
    });
  
    docx.Packer.toBlob(doc).then(blob => {
      const hoje = new Date();
    
      const data =
        hoje.getDate().toString().padStart(2, '0') + '-' +
        (hoje.getMonth() + 1).toString().padStart(2, '0') + '-' +
        hoje.getFullYear();
    
      saveAs(
        blob,
        `Pedido_Limpeza_${unidade}_${data}.docx`
      );
    });
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen text-black relative">
      <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-200">
        
        {/* HEADER DA PÁGINA */}
        <div className="p-8 border-b bg-white">
          <div className="flex justify-between items-start mb-6">
             <div className="text-center w-full">
                <h1 className="text-xl font-black text-gray-800 tracking-tighter">FUNDAÇÃO DE SAÚDE PÚBLICA DE SÃO SEBASTIÃO</h1>
                <p className="text-xs italic text-gray-500">Lei Complementar nº 168/2013 e alterações</p>
                <div className="mt-4 inline-block bg-gray-900 text-white px-4 py-1 rounded text-sm font-bold uppercase tracking-widest">
                  Pedido Mensal – Material de Limpeza 2026
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div>
              <label className="text-[10px] font-black text-blue-600 uppercase">Unidade de Saúde</label>
              <input 
                className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-600 outline-none font-bold text-lg uppercase"
                value={unidade} onChange={(e) => setUnidade(e.target.value.toUpperCase())}
              />
            </div>
            <div className="text-right">
              <label className="text-[10px] font-black text-gray-400 uppercase">Data do Pedido</label>
              <p className="font-bold text-lg text-gray-700">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* BARRA DE FERRAMENTAS */}
        <div className="px-8 py-4 bg-gray-50 border-b flex justify-between items-center">
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                placeholder="Filtrar descrição..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-80 outline-none focus:ring-2 ring-blue-500"
                onChange={(e) => setBusca(e.target.value.toLowerCase())}
              />
            </div>
            <button 
              onClick={abrirModalCadastro}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-md cursor-pointer"
            >
              <Plus size={16} /> ADICIONAR ITEM
            </button>
            <button 
              onClick={handleAtualizarProdutos}
              disabled={isSyncing}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-md cursor-pointer disabled:opacity-60"
            >
              <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} /> {isSyncing ? 'ATUALIZANDO...' : 'ATUALIZAR PRODUTOS'}
            </button>

          </div>
          
          <button 
            onClick={exportarDocx}
            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2 rounded-lg font-black text-sm hover:bg-blue-700 shadow-lg cursor-pointer"
          >
            <FileText size={18}/> GERAR ARQUIVO .DOCX
          </button>
        </div>

        {/* TABELA DE PREENCHIMENTO */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200 text-[10px] uppercase font-black text-gray-600">
                <th className="p-4 w-24 text-center">Código</th>
                <th className="p-4">Descrição do Material</th>
                <th className="p-4 w-20 text-center">Unid.</th>
                <th className="p-4 w-32 text-center bg-blue-50 text-blue-700">Qtd. Pedido</th>
                <th className="p-4 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {itensCatalogo.filter(i => i.nome.toLowerCase().includes(busca)).map((item) => (
                <tr key={item.id} className="border-b hover:bg-blue-50 transition-colors group">
                  <td className="p-4 text-xs font-bold text-gray-500 text-center">{item.codigo}</td>
                  <td className="p-4 text-sm font-bold uppercase text-gray-700">{item.nome}</td>
                  <td className="p-4 text-xs text-center font-medium">{item.unidade}</td>
                  <td className="p-4 bg-blue-50/50">
                    <input 
                      type="number" 
                      placeholder="0"
                      className="w-full bg-white border-2 border-gray-300 rounded-md p-2 text-center font-black text-blue-600 focus:border-blue-600 outline-none transition-all"
                      value={valores[item.id] || ''}
                      onChange={(e) => handleQtdChange(item.id, e.target.value)}
                    />
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => excluirItem(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Excluir item do catálogo"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- TELINHA DE CADASTRO (MODAL) --- */}
      {modalAberta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Cabeçalho Escuro */}
            <div className="bg-[#1e3a8a] text-white p-5 flex justify-between items-center">
              <h2 className="text-sm font-black tracking-wider uppercase">Cadastrar Novo Material</h2>
              <button 
                onClick={() => setModalAberta(false)}
                className="text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Corpo do Modal */}
            <div className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">Código do Item</label>
                <input 
                  type="text"
                  placeholder="EX: 4501"
                  className="w-full border-2 border-blue-500 rounded-lg p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-200 uppercase transition-all"
                  value={novoCodigo}
                  onChange={(e) => setNovoCodigo(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">Descrição do Material</label>
                <input 
                  type="text"
                  placeholder="EX: ÁGUA SANITÁRIA (FRASCO C/ 5 L)"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 uppercase transition-all"
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 uppercase mb-1">Unidade de Medida</label>
                <input 
                  type="text"
                  placeholder="UND, CX, PCT..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 uppercase transition-all"
                  value={novaUnidade}
                  onChange={(e) => setNovaUnidade(e.target.value)}
                />
              </div>
            </div>

            {/* Rodapé com Botões */}
            <div className="p-5 bg-gray-50 border-t flex justify-between gap-3">
              <button
                onClick={() => setModalAberta(false)}
                className="flex-1 py-3 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-black tracking-wider uppercase transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={salvarNovoItem}
                className="flex-1 py-3 px-4 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-lg text-xs font-black tracking-wider uppercase shadow-md transition-all cursor-pointer"
              >
                Salvar Item
              </button>
            </div>

          </div>
        </div>
      )}

      {/* NOVO MODAL CUSTOMIZADO (ALERTA / CONFIRMAÇÃO NATIVO REACT FOR ELECTRON) */}
      {dialogo.aberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 mb-4">
                {dialogo.tipo === 'confirm' ? (
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                ) : (
                  <Info className="h-6 w-6 text-blue-600" />
                )}
              </div>
              <h3 className="text-base font-black text-gray-900 uppercase tracking-tight mb-2">
                {dialogo.titulo}
              </h3>
              <p className="text-xs font-semibold text-gray-600">
                {dialogo.mensagem}
              </p>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end border-t border-gray-100">
              {dialogo.tipo === 'confirm' && (
                <button
                  onClick={fecharDialogo}
                  className="w-1/2 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleConfirmarDialogo}
                className={`${
                  dialogo.tipo === 'confirm' ? 'w-1/2' : 'w-full'
                } py-2 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer`}
              >
                {dialogo.tipo === 'confirm' ? 'Confirmar' : 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}