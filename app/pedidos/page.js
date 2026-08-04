'use client';

import React, { useState, useEffect } from 'react';
import { LISTA_LIMPEZA } from './produtos'; // Certifique-se de que os códigos batem com a imagem
import { saveAs } from 'file-saver';
import * as docx from 'docx';
import { Table, Trash2, Package, Search, FileText } from 'lucide-react';

export default function PedidosPage() {
  const [itensPedido, setItensPedido] = useState([]);
  const [busca, setBusca] = useState('');
  const [unidade, setUnidade] = useState('');

  useEffect(() => {
    const unidadeSalva = localStorage.getItem('fspss_unidade_padrao');
  
    if (unidadeSalva) {
      setUnidade(unidadeSalva);
    }
  }, []);
  
  // Adiciona item ou incrementa a quantidade
  const selecionarItem = (item) => {
    const existe = itensPedido.find(i => i.id === item.id);
    if (existe) {
      setItensPedido(itensPedido.map(i => 
        i.id === item.id ? {...i, quantidade: Number(i.quantidade) + 1} : i
      ));
    } else {
      setItensPedido([...itensPedido, { ...item, quantidade: 1 }]);
    }
  };

  const removerItem = (id) => {
    setItensPedido(itensPedido.filter(i => i.id !== id));
  };

  const atualizarQuantidade = (id, valor) => {
    setItensPedido(itensPedido.map(i => 
      i.id === id ? {...i, quantidade: valor} : i
    ));
  };

  // --- GERADOR DE DOCX (LAYOUT IDÊNTICO À IMAGEM) ---
  const exportarLimpezaDocx = () => {
    const doc = new docx.Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 }, // Margens estreitas
          },
        },
        children: [
          // CABEÇALHO
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "FUNDAÇÃO DE SAÚDE PÚBLICA DE SÃO SEBASTIÃO",
                bold: true,
                size: 20, // ~10pt
              }),
            ],
            alignment: docx.AlignmentType.CENTER,
          }),
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "Lei Complementar nº 168/2013 e alterações",
                italics: true,
                size: 14, // ~7pt
                color: "808080",
              }),
            ],
            alignment: docx.AlignmentType.CENTER,
            spacing: { after: 200 },
          }),

          // TÍTULO DO DOCUMENTO
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "PEDIDO MENSAL – MATERIAL DE LIMPEZA 2026",
                bold: true,
                size: 22, // ~11pt
              }),
            ],
            alignment: docx.AlignmentType.CENTER,
            spacing: { after: 300 },
          }),

          // LINHA DE UNIDADE E DATA
          new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            borders: docx.TableBorders.NONE,
            rows: [
              new docx.TableRow({
                children: [
                  new docx.TableCell({
                    children: [new docx.Paragraph({
                      children: [new docx.TextRun({ text: `UNIDADE DE SAÚDE: ${unidade}`, bold: true, size: 18 })]
                    })],
                  }),
                  new docx.TableCell({
                    children: [new docx.Paragraph({
                      children: [new docx.TextRun({ text: `DATA: ${new Date().toLocaleDateString('pt-BR')}`, bold: true, size: 18 })],
                      alignment: docx.AlignmentType.RIGHT,
                    })],
                  }),
                ],
              }),
            ],
          }),

          new docx.Paragraph({ text: "", spacing: { after: 200 } }),

          // TABELA PRINCIPAL
          new docx.Table({
            width: { size: 100, type: docx.WidthType.PERCENTAGE },
            rows: [
              // Linha de Títulos
              new docx.TableRow({
                children: [
                  new docx.TableCell({ 
                    width: { size: 15, type: docx.WidthType.PERCENTAGE },
                    children: [new docx.Paragraph({ text: "CÓDIGO", alignment: docx.AlignmentType.CENTER, style: "headerText" })],
                    shading: { fill: "F2F2F2" },
                  }),
                  new docx.TableCell({ 
                    width: { size: 55, type: docx.WidthType.PERCENTAGE },
                    children: [new docx.Paragraph({ text: "DESCRIÇÃO", alignment: docx.AlignmentType.CENTER })],
                    shading: { fill: "F2F2F2" },
                  }),
                  new docx.TableCell({ 
                    width: { size: 15, type: docx.WidthType.PERCENTAGE },
                    children: [new docx.Paragraph({ text: "UNID.", alignment: docx.AlignmentType.CENTER })],
                    shading: { fill: "F2F2F2" },
                  }),
                  new docx.TableCell({ 
                    width: { size: 15, type: docx.WidthType.PERCENTAGE },
                    children: [new docx.Paragraph({ text: "PEDIDO", alignment: docx.AlignmentType.CENTER })],
                    shading: { fill: "F2F2F2" },
                  }),
                ],
              }),
              // Conteúdo Dinâmico
              ...itensPedido.map(item => new docx.TableRow({
                children: [
                  new docx.TableCell({ children: [new docx.Paragraph({ text: item.id, alignment: docx.AlignmentType.CENTER })] }),
                  new docx.TableCell({ children: [new docx.Paragraph({ text: item.nome.toUpperCase() })] }),
                  new docx.TableCell({ children: [new docx.Paragraph({ text: item.unidade, alignment: docx.AlignmentType.CENTER })] }),
                  new docx.TableCell({ children: [new docx.Paragraph({ text: item.quantidade.toString(), alignment: docx.AlignmentType.CENTER })] }),
                ],
              })),
            ],
          }),

          new docx.Paragraph({ text: "", spacing: { before: 400 } }),

          // OBSERVAÇÃO FINAL
          new docx.Paragraph({
            children: [
              new docx.TextRun({
                text: "OBSERVAÇÃO: TODOS OS PEDIDOS ESTARÃO SUJEITOS A ANÁLISE E APROVAÇÃO DO DEPARTAMENTO ADMINISTRATIVO, (ALMOXARIFADO).",
                bold: true,
                size: 28,
              }),
            ],
          }),
        ],
      }],
    });

    docx.Packer.toBlob(doc).then(blob => {
      saveAs(blob, `Pedido_Limpeza_2026_${unidade}.docx`);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex text-black">
      {/* SELEÇÃO DE PRODUTOS (SIDEBAR ESQUERDA) */}
      <div className="w-96 bg-white border-r border-gray-200 p-4 flex flex-col shadow-lg">
        <div className="mb-6">
          <h2 className="font-bold text-blue-900 flex items-center gap-2 uppercase tracking-tighter">
            <Package size={20} /> Catálogo de Limpeza
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase">Clique para adicionar ao pedido</p>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Pesquisar produto..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 ring-blue-500 outline-none"
            onChange={(e) => setBusca(e.target.value.toLowerCase())}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
          {LISTA_LIMPEZA.filter(i => i.nome.toLowerCase().includes(busca)).map(item => (
            <button 
              key={item.id}
              onClick={() => selecionarItem(item)}
              className="w-full text-left p-3 rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all flex justify-between items-center group"
            >
              <div>
                <div className="text-[9px] font-bold text-blue-500">{item.id}</div>
                <div className="text-xs font-bold text-gray-700 uppercase group-hover:text-blue-800">{item.nome}</div>
              </div>
              <PlusIcon />
            </button>
          ))}
        </div>
      </div>

      {/* ÁREA DO PEDIDO (DIREITA) */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden min-h-full flex flex-col">
          
          {/* HEADER DA TELA */}
          <div className="p-6 bg-gray-900 text-white flex justify-between items-center">
            <div>
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Novo Pedido Mensal</span>
              <h2 className="text-xl font-bold uppercase">Material de Limpeza</h2>
            </div>
            <button 
              onClick={exportarLimpezaDocx}
              disabled={itensPedido.length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-6 py-3 rounded-xl font-black text-xs transition-all shadow-lg"
            >
              <FileText size={18} /> GERAR .DOCX OFICIAL
            </button>
          </div>

          {/* CAMPOS DE INFO */}
          <div className="p-6 grid grid-cols-2 gap-4 bg-gray-50 border-b">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Unidade Solicitante</label>
              <input 
                className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold uppercase text-sm focus:ring-2 ring-blue-500 outline-none"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Data de Emissão</label>
              <div className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl font-bold text-sm text-gray-500">
                {new Date().toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          {/* LISTA DE ITENS SELECIONADOS */}
          <div className="flex-1 p-6">
            {itensPedido.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 py-20">
                <Package size={64} className="mb-4 opacity-10" />
                <p className="font-medium italic">Seu pedido está vazio. Adicione itens pelo catálogo.</p>
              </div>
            ) : (
              <table className="w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-[10px] font-black text-gray-400 uppercase">
                    <th className="px-4 pb-2 text-left">Material Selecionado</th>
                    <th className="px-4 pb-2 text-center w-32">Qtd Pedida</th>
                    <th className="px-4 pb-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {itensPedido.map(item => (
                    <tr key={item.id} className="bg-gray-50 group transition-all">
                      <td className="p-4 rounded-l-2xl border-y border-l border-gray-100">
                        <div className="text-[10px] font-bold text-blue-600">{item.id}</div>
                        <div className="font-bold text-gray-800 uppercase text-sm">{item.nome}</div>
                        <div className="text-[10px] text-gray-400">UNIDADE: {item.unidade}</div>
                      </td>
                      <td className="p-4 border-y border-gray-100">
                        <input 
                          type="number" 
                          className="w-full bg-white border-2 border-gray-200 rounded-xl py-2 text-center font-black text-blue-600 focus:border-blue-500 outline-none transition-all"
                          value={item.quantidade}
                          onChange={(e) => atualizarQuantidade(item.id, e.target.value)}
                        />
                      </td>
                      <td className="p-4 rounded-r-2xl border-y border-r border-gray-100 text-right">
                        <button 
                          onClick={() => removerItem(item.id)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Pequeno componente de ícone para a lista
function PlusIcon() {
  return (
    <div className="p-1 bg-gray-100 rounded-md text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
    </div>
  );
}