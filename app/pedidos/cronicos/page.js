'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Search, Plus, Trash2, X, RefreshCw, AlertTriangle, Info } from 'lucide-react';
// Importação do hook de produtos puxando do Supabase
import { useProdutosPedidos } from '@/hooks/useProdutosPedidos'; 
import ExcelJS from 'exceljs';
// Importação da logo do arquivo separado para manter o código limpo
import { LOGO_PREFEITURA_BASE64 } from './assets';

export default function PedidoCronicos() {
  const [unidade, setUnidade] = useState('');
  const [busca, setBusca] = useState('');

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
  
  // Estado para gerenciar o catálogo puxando 'cronicos' do Supabase
  const { produtos: produtosOficiais, sincronizarComSupabase, isSyncing } = useProdutosPedidos('cronicos'); // Se o nome da tabela no Supabase for outro, mude 'cronicos' aqui
  const [itensCatalogo, setItensCatalogo] = useState([]);
  const [valores, setValores] = useState({});

  const handleAtualizarProdutos = () => {
    abrirConfirmacao(
      'Atualizar Produtos',
      'Isso vai descartar itens adicionados/removidos nesta sessão e recarregar a lista oficial mais recente. Deseja continuar?',
      async () => {
        await sincronizarComSupabase();
      }
    );
  };

  useEffect(() => {
    setItensCatalogo(produtosOficiais);
  }, [produtosOficiais]);
  
  useEffect(() => {
    const unidadePadrao = localStorage.getItem('fspss_unidade_padrao');
  
    if (unidadePadrao) {
      setUnidade(unidadePadrao.toUpperCase());
    }

    // Puxa a lista oficial ao abrir a tela
    sincronizarComSupabase();
  }, []);
  
  // Estados para controlar o novo Modal compatível com Electron
  const [modalAberto, setModalAberto] = useState(false);
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novaDescricao, setNovaDescricao] = useState('');
  const [novaUnidade, setNovaUnidade] = useState('UND');
  const [novaCategoria, setNovaCategoria] = useState('CORRELATOS');

  const handleQtdChange = (id, qtd) => {
    setValores({ ...valores, [id]: qtd });
  };

  // Salvar novo item vindo do Modal com trava de duplicidade
  const salvarNovoItem = (e) => {
    e.preventDefault();

    if (!novoCodigo.trim() || !novaDescricao.trim()) return;

    const idFormatado = parseInt(novoCodigo) || novoCodigo.trim();

    // Trava de segurança: Verifica se o código já existe na lista atual
    const codigoJaExiste = itensCatalogo.some(
      (item) => String(item.codigo) === String(idFormatado)
    );

    if (codigoJaExiste) {
      abrirAlerta('Código Duplicado', `O código "${idFormatado}" já está cadastrado na lista!`);
      return;
    }

    setItensCatalogo([
      { 
        id: idFormatado, 
	codigo: idFormatado,
        nome: novaDescricao.toUpperCase(),    
        unidade: novaUnidade.toUpperCase(),
        categoria: novaCategoria.toUpperCase()
      },
      ...itensCatalogo
    ]);

    // Limpa os campos e fecha o modal
    setNovoCodigo('');
    setNovaDescricao('');
    setNovaUnidade('UND');
    setNovaCategoria('CORRELATOS');
    setModalAberto(false);
  };

  // Remover item do catálogo
  const excluirItem = (id) => {
    abrirConfirmacao(
      'Remover Item',
      'DESEJA REALMENTE REMOVER ESTE ITEM DA VISUALIZAÇÃO?',
      () => {
        setItensCatalogo((prev) => prev.filter((item) => item.id !== id));
      }
    );
  };

  // Lógica para exportar os dados preenchidos para Excel com imagem e larguras exatas
  const gerarExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Pedido');
  
    // 1. AJUSTE DE LARGURA DAS COLUNAS (Suas medidas exatas solicitadas)
    worksheet.columns = [
      { width: 3.43 },  // A - Índice sequencial (1, 2, 3...)
      { width: 7 },     // B - COD
      { width: 57.57 }, // C - DESCRIÇÃO DO MATERIAL
      { width: 5.14 },  // D - UN
      { width: 10.29 }, // E - SOLICITADO
      { width: 11 },    // F - FORNECIDO
    ];
  
    // 2. INSERÇÃO DA IMAGEM VINDA DO ASSETS.JS (A1 até F6)
    try {
      const logoId = workbook.addImage({
        base64: LOGO_PREFEITURA_BASE64,
        extension: 'png',
      });
  
      worksheet.addImage(logoId, {
        tl: { col: 0, row: 0 },
        br: { col: 6, row: 6 },
        editAs: 'oneCell'
      });
    } catch (error) {
      console.error("Erro ao carregar imagem do assets:", error);
    }
  
    // Linha onde começa o cabeçalho institucional (Abaixo da foto)
    let currentRow = 7;
  
    // Estilo padrão para o bloco de cabeçalho institucional
    const styleHeaderBlock = {
      font: { bold: true, size: 11, name: 'Arial' },
      alignment: { horizontal: 'center', vertical: 'middle' },
      border: {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      }
    };
  
    // Estilo das células comuns de dados da planilha
    const thinBorder = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  
    // 3. TEXTOS DO CABEÇALHO (Almoxarifado, Unidade, Data) com mesclagem e bordas
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const cellAlmox = worksheet.getCell(`A${currentRow}`);
    cellAlmox.value = 'ALMOXARIFADO SAÚDE';
    cellAlmox.style = styleHeaderBlock;
    currentRow++;
  
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const cellUnidade = worksheet.getCell(`A${currentRow}`);
    cellUnidade.value = `UNIDADE : ${unidade.toUpperCase()}`;
    cellUnidade.style = { ...styleHeaderBlock, alignment: { horizontal: 'left', vertical: 'middle' } };
    currentRow++;
  
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const cellData = worksheet.getCell(`A${currentRow}`);
    cellData.value = `DATA: ${new Date().toLocaleDateString('pt-BR')}`;
    cellData.style = { ...styleHeaderBlock, alignment: { horizontal: 'left', vertical: 'middle' } };
    currentRow++;
  
    // Pula uma linha em branco igual ao modelo
    currentRow++;
  
    // Categorias mapeadas conforme aparecem no seu impresso oficial
    const categorias = [
      { chave: 'CORRELATOS', titulo: 'CORRELATOS - PACIENTES CRÔNICOS/ ACAMADOS', cabecalhoCod: 'COD', cabecalhoDesc: 'DESCRIÇÃO DO MATERIAL', cabecalhoUni: 'UN' },
      { chave: 'CREMES', titulo: 'CREMES / POMADAS', cabecalhoCod: 'CÓD.', cabecalhoDesc: 'DESC. DO MATERIAL', cabecalhoUni: 'UNI.' },
      { chave: 'FRASCOS', titulo: 'FRASCOS', cabecalhoCod: 'CÓD.', cabecalhoDesc: 'DESC. DO MATERIAL', cabecalhoUni: 'UNI.' }
    ];
  
    // 4. LAÇO QUE GERA CADA CATEGORIA E SEUS RESPECTIVOS ITENS
    categorias.forEach((cat) => {
      // Filtra os itens que pertencem a esta categoria específica
      // Caso o item não possua categoria definida no banco de dados, ele entra por padrão em CORRELATOS
      const itensDaCategoria = itensCatalogo.filter(item => {
        const itemCat = item.categoria ? item.categoria.toUpperCase() : 'CORRELATOS';
        if (cat.chave === 'CORRELATOS') return itemCat === 'CORRELATOS' || itemCat === 'CRONICOS' || itemCat === 'CORRELATOS - PACIENTES CRÔNICOS/ ACAMADOS';
        if (cat.chave === 'CREMES') return itemCat === 'CREMES' || itemCat === 'CREMES / POMADAS';
        return itemCat === cat.chave;
      });
  
      // Se não houver itens nessa categoria no catálogo, não renderiza a seção na planilha
      if (itensDaCategoria.length === 0) return;
  
      // Pula linha de respiro antes da nova categoria (exceto se for a primeira)
      if (currentRow > 11) {
        currentRow++;
      }
  
      // Escreve a faixa de TÍTULO DA CATEGORIA (Ex: CREMES / POMADAS)
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const cellTituloCat = worksheet.getCell(`A${currentRow}`);
      cellTituloCat.value = cat.titulo;
      cellTituloCat.style = {
        font: { bold: true, size: 10, name: 'Arial' },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: thinBorder
      };
      currentRow++;
  
      // Escreve a LINHA DE CABEÇALHO da tabela da categoria
      const headerRow = worksheet.getRow(currentRow);
      headerRow.getCell(1).value = '';
      headerRow.getCell(2).value = cat.cabecalhoCod;
      headerRow.getCell(3).value = cat.cabecalhoDesc;
      headerRow.getCell(4).value = cat.cabecalhoUni;
      headerRow.getCell(5).value = 'SOLICITADO';
      headerRow.getCell(6).value = 'FORNECIDO';
  
      // Aplica estilo e alinhamento no cabeçalho da tabela
      for (let col = 1; col <= 6; col++) {
        const cell = headerRow.getCell(col);
        cell.style = {
          font: { bold: true, size: 9, name: 'Arial' },
          alignment: { 
            horizontal: col === 3 ? 'left' : 'center', 
            vertical: 'middle' 
          },
          border: thinBorder
        };
      }
      currentRow++;
  
      // Adiciona os itens da categoria linha por linha
      let itemIndex = 1;
      itensDaCategoria.forEach((item) => {
        const row = worksheet.getRow(currentRow);
        
        row.getCell(1).value = itemIndex; // Numeração sequencial da coluna A (1, 2, 3...)
        row.getCell(2).value = item.codigo;    // Código oficial do material
        row.getCell(3).value = item.nome ? item.nome.toUpperCase() : '';
        row.getCell(4).value = item.unidade ? item.unidade.toUpperCase() : 'UND';
        
        // Pega a quantidade digitada pelo usuário na tela. Se não digitou nada, deixa em branco.
        const qtdDigitada = valores[item.id];
        row.getCell(5).value = qtdDigitada ? parseInt(qtdDigitada) : ''; 
        row.getCell(6).value = ''; // Campo "Fornecido" fica vazio para o almoxarifado preencher à mão
  
        // Aplica formatação visual em todas as células da linha do item
        for (let col = 1; col <= 6; col++) {
          const cell = row.getCell(col);
          cell.style = {
            font: { size: 9, name: 'Arial' },
            alignment: { 
              horizontal: col === 3 ? 'left' : 'center', 
              vertical: 'middle' 
            },
            border: thinBorder
          };
          // Se for a coluna de Solicitação, garante formatação numérica caso tenha valor
          if (col === 5 && qtdDigitada) {
            cell.numFmt = '#,##0';
          }
        }
  
        itemIndex++;
        currentRow++;
      });
    });
  
    // 5. SEÇÃO DE ASSINATURA (Sempre inserida no final de todas as tabelas)
    currentRow += 2;
    worksheet.getRow(currentRow).getCell(1).value = 'ASS.: __________________________________________________';
    worksheet.getRow(currentRow).getCell(5).value = 'DATA: ______/______/_______';
    
    // Formatação simples da linha de assinatura
    worksheet.getRow(currentRow).getCell(1).font = { size: 9, name: 'Arial' };
    worksheet.getRow(currentRow).getCell(5).font = { size: 9, name: 'Arial' };
  
    // 6. ADICIONA NOTA DE REVISÃO NO RODAPÉ DA PÁGINA
    currentRow += 4;
    worksheet.getRow(currentRow).getCell(1).value = 'REVISÃO 001/2022';
    worksheet.getRow(currentRow).getCell(1).font = { size: 8, name: 'Arial', italic: true };
  
    // 7. SALVAR E FAZER DOWNLOAD DO ARQUIVO COMPLETO
    const buffer = await workbook.xlsx.writeBuffer();
    const fileBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(fileBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `PEDIDO_CRONICOS_${unidade.replace(/\s+/g, '_')}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8 bg-gray-100 min-h-screen text-black relative" suppressHydrationWarning>
      <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-xl overflow-hidden border border-gray-200">
        
        {/* HEADER VISUAL DA PÁGINA */}
        <div className="p-8 border-b bg-white">
          <div className="flex justify-between items-start mb-6">
             <div className="text-center w-full">
                <h1 className="text-xl font-black text-gray-800 tracking-tighter">
                  FUNDAÇÃO DE SAÚDE PÚBLICA DE SÃO SEBASTIÃO
                </h1>
                <p className="text-xs italic text-gray-500">
                  Lei Complementar nº 168/2013 e alterações
                </p>
                <div className="mt-4 inline-block bg-green-700 text-white px-4 py-1 rounded text-sm font-bold uppercase tracking-widest">
                  PEDIDO MENSAL – CRONICOS E ACAMADOS 2026
                </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div>
              <label className="text-[10px] font-black text-green-600 uppercase">UNIDADE DE SAÚDE</label>
              <input 
                className="w-full bg-transparent border-b-2 border-gray-300 focus:border-green-600 outline-none font-bold text-lg uppercase text-gray-800"
                value={unidade} 
                onChange={(e) => setUnidade(e.target.value.toUpperCase())}
              />
            </div>
            <div className="text-right">
              <label className="text-[10px] font-black text-gray-400 uppercase">DATA DO PEDIDO</label>
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
                placeholder="Filtrar produtos de crônicos..." 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-80 outline-none focus:ring-2 ring-green-500 text-gray-900 bg-white"
                onChange={(e) => setBusca(e.target.value.toLowerCase())}
              />
            </div>
            <button 
              onClick={() => setModalAberto(true)}
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
            onClick={gerarExcel}
            className="flex items-center gap-2 bg-green-800 text-white px-8 py-2 rounded-lg font-black text-sm hover:bg-green-900 shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet size={18}/> GERAR PLANILHA EXCEL
          </button>
        </div>

        {/* TABELA DE PREENCHIMENTO DIRETO NO NAVEGADOR */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200 text-[10px] uppercase font-black text-gray-600">
                <th className="p-4 w-24 text-center">Código</th>
                <th className="p-4">Descrição do Material (Crônicos/Correlatos)</th>
                <th className="p-4 w-20 text-center">Unid.</th>
                <th className="p-4 w-32 text-center bg-green-50 text-green-700">Qtd. Pedido</th>
                <th className="p-4 w-16"></th>
              </tr>
            </thead>
            <tbody>
              {itensCatalogo
                .filter(i => i.nome && i.nome.toLowerCase().includes(busca))
                .map((item) => (
                  <tr key={item.id} className="border-b hover:bg-green-50 transition-colors group">
                    <td className="p-4 text-xs font-bold text-gray-500 text-center">{item.codigo}</td>
                    <td className="p-4 text-sm font-bold uppercase text-gray-700">
                      {item.nome}
                      {item.categoria && (
                        <span className="ml-2 block text-[9px] font-normal text-gray-400 lowercase">
                          ({item.categoria})
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-center font-bold text-gray-600">{item.unidade}</td>
                    <td className="p-4 bg-green-50/50">
                      <input 
                        type="number" 
                        placeholder="0"
                        className="w-full bg-white border-2 border-gray-300 rounded-md p-2 text-center font-black text-green-700 focus:border-green-600 outline-none transition-all shadow-sm"
                        value={valores[item.id] || ''}
                        onChange={(e) => handleQtdChange(item.id, e.target.value)}
                      />
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => excluirItem(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Remover da lista temporariamente"
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

      {/* MODAL REACT COMPATÍVEL COM ELECTRON */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-200">
            
            <div className="bg-green-700 p-4 text-white flex justify-between items-center">
              <h3 className="font-black text-sm uppercase tracking-wider">Adicionar Novo Item</h3>
              <button 
                onClick={() => setModalAberto(false)} 
                className="text-green-100 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={salvarNovoItem} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase text-gray-600 mb-1">Código do Item</label>
                <input 
                  type="number" 
                  required
                  placeholder="Ex: 4052"
                  value={novoCodigo}
                  onChange={(e) => setNovoCodigo(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-2.5 text-sm font-bold text-gray-800 outline-none focus:border-green-600 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase text-gray-600 mb-1">Descrição do Material</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: CURATIVO ESPECIAL"
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg p-2.5 text-sm font-bold uppercase text-gray-800 outline-none focus:border-green-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-600 mb-1">Unidade</label>
                  <input 
                    type="text" 
                    required
                    placeholder="UND, PCT, KIT..."
                    value={novaUnidade}
                    onChange={(e) => setNovaUnidade(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg p-2.5 text-sm font-bold uppercase text-gray-800 outline-none focus:border-green-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase text-gray-600 mb-1">Categoria</label>
                  <select 
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg p-2.5 text-sm font-bold text-gray-800 outline-none focus:border-green-600 transition-colors bg-white"
                  >
                    <option value="CORRELATOS">CORRELATOS</option>
                    <option value="CREMES">CREMES</option>
                    <option value="FRASCOS">FRASCOS</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-1/2 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="w-1/2 py-2.5 bg-green-600 hover:bg-green-700 text-white font-black rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                >
                  Salvar Item
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* NOVO MODAL CUSTOMIZADO (ALERTA / CONFIRMAÇÃO NATIVO REACT PARA ELECTRON) */}
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
                } py-2 bg-green-700 hover:bg-green-800 text-white font-black rounded-lg text-xs uppercase tracking-wider transition-colors shadow-md cursor-pointer`}
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