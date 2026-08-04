'use client';
import ExcelJS from 'exceljs';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Building2, CheckCircle2, Phone, Download, Upload, RefreshCw, FileSpreadsheet, FileDown
} from 'lucide-react';
import { db } from '@/db';

// ─── CONFIGURAÇÃO CENTRAL DAS TABELAS ────────────────────────────────────────
// Cada tabela do Dexie que pode ser exportada/importada individualmente.
// "chavePrimaria" é o campo que identifica um registro único (normalmente 'id',
// mas em "pacientes" é 'cross').
const TABELAS_CONFIG = [
  {
    chave: 'encaminhamentos',
    label: 'Encaminhamentos',
    chavePrimaria: 'id',
    colunas: [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'NOME', key: 'nome', width: 35 },
      { header: 'CROSS', key: 'cross', width: 15 },
      { header: 'DATA NASC', key: 'dataNasc', width: 15 },
      { header: 'TELEFONE', key: 'telefone', width: 20 },
      { header: 'EXAME / PROCEDIMENTO', key: 'especialidade', width: 30 },
      { header: 'STATUS (opcional - deixe em branco que o sistema calcula)', key: 'status', width: 40 },
      { header: 'DATA REGISTRO', key: 'dataRegistro', width: 15 },
      { header: 'DATA CHEGADA', key: 'dataChegada', width: 15 },
      { header: 'LOCAL CONSULTA', key: 'local', width: 30 },
      { header: 'DATA CONSULTA', key: 'dataConsulta', width: 15 },
      { header: 'HORA CONSULTA', key: 'horaConsulta', width: 15 },
      { header: 'OBSERVAÇÃO', key: 'obs', width: 45 },
      { header: 'MOTIVO CORREÇÃO', key: 'motivoCorrecao', width: 45 },
      { header: 'DATA RETORNO REGULAÇÃO', key: 'dataRetornoRegulacao', width: 20 }
    ]
  },
  {
    chave: 'exames',
    label: 'Exames',
    chavePrimaria: 'id',
    colunas: [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'CROSS', key: 'cross', width: 15 },
      { header: 'EXAME', key: 'exame', width: 25 },
      { header: 'STATUS', key: 'status', width: 15 },
      { header: 'DATA REGISTRO', key: 'dataRegistro', width: 15 },
      { header: 'DATA CHEGADA', key: 'dataChegada', width: 15 }
    ]
  },
  {
    chave: 'remessas',
    label: 'Remessas',
    chavePrimaria: 'id',
    colunas: [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nº REMESSA', key: 'numeroRemessa', width: 15 },
      { header: 'DESTINO', key: 'destino', width: 30 },
      { header: 'DE (ORIGEM)', key: 'de', width: 25 },
      { header: 'A/C', key: 'ac', width: 25 },
      { header: 'ASSUNTO', key: 'assunto', width: 40 },
      { header: 'DESCRIÇÃO', key: 'descricao', width: 50 },
      { header: 'STATUS', key: 'status', width: 18 },
      { header: 'DATA SAÍDA', key: 'dataSaida', width: 15 },
      { header: 'DATA RECEBIDO', key: 'dataRecebido', width: 18 },
      { header: 'RECEBIDO POR', key: 'recebidoPor', width: 35 }
    ]
  },
  {
    chave: 'sos',
    label: 'Manutenção SOS',
    chavePrimaria: 'id',
    colunas: [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'NÚMERO OS', key: 'numeroOS', width: 15 },
      { header: 'ANO', key: 'ano', width: 10 },
      { header: 'UNIDADE', key: 'unidade', width: 20 },
      { header: 'DATA SOLICITAÇÃO', key: 'dataSolicitacao', width: 18 },
      { header: 'STATUS', key: 'status', width: 15 },
      { header: 'DESCRIÇÃO', key: 'descricaoServico', width: 40 }
    ]
  },
  {
    chave: 'pacientes',
    label: 'Pacientes',
    chavePrimaria: 'cross',
    colunas: [
      { header: 'CROSS', key: 'cross', width: 15 },
      { header: 'NOME', key: 'nome', width: 35 },
      { header: 'DATA NASC', key: 'dataNasc', width: 15 },
      { header: 'TELEFONE', key: 'telefone', width: 20 }
    ]
  },
  {
    chave: 'transferencias',
    label: 'Transferências de Prontuário',
    chavePrimaria: 'id',
    colunas: [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'UNIDADE SOLICITANTE', key: 'unidadeSolicitante', width: 25 },
      { header: 'SOLICITANTE', key: 'solicitante', width: 25 },
      { header: 'PACIENTE', key: 'paciente', width: 30 },
      { header: 'TIPO SOLICITAÇÃO', key: 'tipoSolicitacao', width: 20 },
      { header: 'DATA REGISTRO', key: 'dataRegistro', width: 15 },
      { header: 'STATUS', key: 'status', width: 15 }
    ]
  },
  {
    chave: 'profissionais',
    label: 'Profissionais',
    chavePrimaria: 'id',
    colunas: [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'NOME', key: 'nome', width: 30 },
      { header: 'MATRÍCULA', key: 'matricula', width: 15 },
      { header: 'CARGO', key: 'cargo', width: 20 }
    ]
  },
  {
    chave: 'pedidos',
    label: 'Pedidos',
    chavePrimaria: 'id',
    colunas: [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nº PEDIDO', key: 'numeroPedido', width: 15 },
      { header: 'DATA', key: 'data', width: 15 },
      { header: 'CATEGORIA', key: 'categoria', width: 20 },
      { header: 'STATUS', key: 'status', width: 15 }
    ]
  },
  {
    chave: 'materiais',
    label: 'Materiais',
    chavePrimaria: 'id',
    colunas: [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'CÓDIGO', key: 'codigo', width: 15 },
      { header: 'DESCRIÇÃO', key: 'descricao', width: 40 }
    ]
  }
];

export default function Configuracoes() {
  const [unidade, setUnidade] = useState('');
  const [telefone, setTelefone] = useState('');
  const [salvo, setSalvo] = useState(false);
  const [statusBackup, setStatusBackup] = useState<{ tipo: 'sucesso' | 'erro'; msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados da nova importação/exportação por tabela
  const [tabelaSelecionada, setTabelaSelecionada] = useState(TABELAS_CONFIG[0].chave);
  const fileInputTabelaRef = useRef<HTMLInputElement>(null);

  const configAtual = TABELAS_CONFIG.find(t => t.chave === tabelaSelecionada)!;

  // ─── EXPORTAR TUDO PARA EXCEL (todas as tabelas, várias abas) ─────────────
  const handleExportarExcel = async () => {
    try {
      setStatusBackup({ tipo: 'sucesso', msg: 'Gerando relatório completo...' });

      const workbook = new ExcelJS.Workbook();

      for (const config of TABELAS_CONFIG) {
        const ws = workbook.addWorksheet(config.label);
        ws.columns = config.colunas.map(c => ({ header: c.header, key: c.key, width: c.width }));
        ws.getRow(1).eachCell((cell) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
          cell.alignment = { horizontal: 'center' };
        });
        const dados = await db.table(config.chave).toArray();
        dados.forEach((item: any) => ws.addRow(item));
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RELATORIO_COMPLETO_FSPSS_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      setStatusBackup({ tipo: 'sucesso', msg: 'Relatório exportado com sucesso!' });
    } catch (error) {
      console.error(error);
      setStatusBackup({ tipo: 'erro', msg: 'Erro ao gerar Excel completo.' });
    }
  };

  // ─── BAIXAR MODELO EM BRANCO DE UMA TABELA ESPECÍFICA ──────────────────────
  const handleBaixarModelo = async (config: typeof TABELAS_CONFIG[number]) => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(config.label);
      worksheet.columns = config.colunas.map(c => ({ header: c.header, key: c.key, width: c.width }));
      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } };
        cell.alignment = { horizontal: 'center' };
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MODELO_${config.chave}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);

      setStatusBackup({ tipo: 'sucesso', msg: `Modelo de "${config.label}" baixado! Preencha e importe de volta.` });
    } catch (error) {
      console.error(error);
      setStatusBackup({ tipo: 'erro', msg: 'Erro ao gerar o modelo.' });
    }
  };
  // Calcula o status de um encaminhamento automaticamente,
  // baseado nos dados disponíveis — usado quando a unidade não preenche a coluna Status na planilha
  function calcularStatusAutomaticoEncaminhamento(registro: any): string {
    if (registro.motivoCorrecao && String(registro.motivoCorrecao).trim() !== '') {
      return 'Retornado p/ Correção';
    }
    if (registro.dataConsulta && String(registro.dataConsulta).trim() !== '') {
      return 'Agendado';
    }
    return 'Enviado';
  }
  // ─── IMPORTAR PLANILHA PREENCHIDA DE VOLTA PARA UMA TABELA ─────────────────
  const handleImportarPlanilha = async (config: typeof TABELAS_CONFIG[number], file: File) => {
    try {
      setStatusBackup({ tipo: 'sucesso', msg: `Lendo a planilha de "${config.label}"...` });

      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];

      if (!worksheet) {
        setStatusBackup({ tipo: 'erro', msg: 'Não encontrei nenhuma planilha dentro desse arquivo.' });
        return;
      }

      // Descobre em qual coluna está cada campo, olhando o texto do cabeçalho
      const headerRow = worksheet.getRow(1);
      const colunaParaChave: Record<number, string> = {};
      headerRow.eachCell((cell, colNumber) => {
        const textoCabecalho = String(cell.value || '').trim().toLowerCase();
        const colunaConfig = config.colunas.find(c => c.header.trim().toLowerCase() === textoCabecalho);
        if (colunaConfig) colunaParaChave[colNumber] = colunaConfig.key;
      });

      if (Object.keys(colunaParaChave).length === 0) {
        setStatusBackup({ tipo: 'erro', msg: 'Não reconheci as colunas dessa planilha. Baixe o modelo certo e preencha nele.' });
        return;
      }

      // Monta a lista de registros a partir da linha 2 em diante
      const registros: any[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // pula o cabeçalho
        const registro: any = {};
        let temAlgumValor = false;
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const chave = colunaParaChave[colNumber];
          if (chave) {
            let valor = cell.value;

            // 👇 Novo: se o Excel mandou uma data de verdade (objeto Date), converte pra texto dd/mm/aaaa
            if (valor instanceof Date) {
              const dia = String(valor.getDate()).padStart(2, '0');
              const mes = String(valor.getMonth() + 1).padStart(2, '0');
              const ano = valor.getFullYear();
              valor = `${dia}/${mes}/${ano}`;
            }

            registro[chave] = valor;
            temAlgumValor = true;
          }
        });
        if (temAlgumValor) registros.push(registro);
      });

      if (registros.length === 0) {
        setStatusBackup({ tipo: 'erro', msg: 'A planilha está vazia. Preencha ao menos uma linha com dados.' });
        return;
      }

      const pk = config.chavePrimaria;
      const comId = registros.filter(r => r[pk] !== undefined && r[pk] !== null && r[pk] !== '');
      const semId = registros.filter(r => r[pk] === undefined || r[pk] === null || r[pk] === '');

      let registrosParaGravar: any[] = [...semId]; // registros novos (sem ID) sempre entram

      if (comId.length > 0) {
        const idsDaPlanilha = comId.map(r => r[pk]);
        const existentes = await db.table(config.chave).where(pk).anyOf(idsDaPlanilha).toArray();

        if (existentes.length > 0) {
          const nomeCampo = pk === 'id' ? 'ID' : 'CROSS';
          const confirmarSubstituicao = confirm(
            `Encontrei ${existentes.length} registro(s) na planilha que JÁ EXISTEM no sistema (mesmo ${nomeCampo}).\n\n` +
            `Clique em "OK" para SUBSTITUIR esses registros: os dados atuais deles serão apagados e trocados pelo que está na planilha.\n\n` +
            `Clique em "Cancelar" para NÃO mexer nos registros que já existem — nesse caso, só os registros novos da planilha serão adicionados.`
          );

          if (confirmarSubstituicao) {
            registrosParaGravar = [...registrosParaGravar, ...comId];
          }
          // Se cancelar, os registros com ID repetido são simplesmente ignorados
        } else {
          // Tinham ID preenchido mas nenhum bate com o que já existe -> trata como novos mesmo
          registrosParaGravar = [...registrosParaGravar, ...comId];
        }
      }

      if (registrosParaGravar.length === 0) {
        setStatusBackup({ tipo: 'sucesso', msg: 'Nenhum registro novo para importar.' });
        return;
      }

      // Para tabelas com ID automático, remove o campo 'id' quando vier vazio,
      // assim o sistema gera um novo ID sozinho
      const registrosFinais = registrosParaGravar.map(r => {
        let registro = { ...r };

        if (pk === 'id' && (registro.id === undefined || registro.id === null || registro.id === '')) {
          const { id, ...resto } = registro;
          registro = resto;
        }

        // 👇 Novo: se for a tabela de encaminhamentos e o status veio vazio, o sistema decide sozinho
        if (config.chave === 'encaminhamentos' && (!registro.status || String(registro.status).trim() === '')) {
          registro.status = calcularStatusAutomaticoEncaminhamento(registro);
        }

        return registro;
      });

      await db.table(config.chave).bulkPut(registrosFinais);

      setStatusBackup({
        tipo: 'sucesso',
        msg: `${registrosFinais.length} registro(s) importado(s) com sucesso em "${config.label}"!`
      });
    } catch (error) {
      console.error(error);
      setStatusBackup({ tipo: 'erro', msg: 'Erro ao importar a planilha. Confira se ela segue o modelo baixado, sem alterar os nomes das colunas.' });
    } finally {
      if (fileInputTabelaRef.current) fileInputTabelaRef.current.value = '';
    }
  };

  const formatarTelefone = (value: string) => {
    let numbers = value.replace(/\D/g, '');
    if (numbers.length > 11) numbers = numbers.substring(0, 11);
    if (numbers.length > 6) return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    else if (numbers.length > 2) return numbers.replace(/(\d{2})(\d{0,4})/, '($1) $2');
    else if (numbers.length > 0) return numbers.replace(/(\d{0,2})/, '($1');
    return numbers;
  };

  useEffect(() => {
    const unidadeSalva = localStorage.getItem('fspss_unidade_padrao');
    const telefoneSalvo = localStorage.getItem('fspss_telefone_padrao');
    if (unidadeSalva) setUnidade(unidadeSalva);
    if (telefoneSalvo) setTelefone(telefoneSalvo);
  }, []);

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('fspss_unidade_padrao', unidade.trim());
    localStorage.setItem('fspss_telefone_padrao', telefone.trim());
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  };

  const handleExportarDados = async () => {
    try {
      setStatusBackup(null);
      const tabelas = TABELAS_CONFIG.map(t => t.chave); // todas as tabelas de dados (sem os caches)
      const dadosDexie: Record<string, any[]> = {};
      for (const tabela of tabelas) {
        dadosDexie[tabela] = await (db as any).table(tabela).toArray();
      }
      const dadosConfig = {
        fspss_unidade_padrao: localStorage.getItem('fspss_unidade_padrao') || '',
        fspss_telefone_padrao: localStorage.getItem('fspss_telefone_padrao') || '',
        fspss_mensagem_zap_padrao: localStorage.getItem('fspss_mensagem_zap_padrao') || '',
      };
      const objetoBackup = {
        sistema: 'GestaoClinicaFSPSS',
        dataExportacao: new Date().toLocaleDateString('pt-BR'),
        configuracoes: dadosConfig,
        bancoDados: dadosDexie
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(objetoBackup, null, 2));
      const a = document.createElement('a');
      a.setAttribute("href", dataStr);
      a.setAttribute("download", `BACKUP_GERAL_FSPSS_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStatusBackup({ tipo: 'sucesso', msg: 'Backup gerado e baixado com sucesso!' });
    } catch (error) {
      setStatusBackup({ tipo: 'erro', msg: 'Falha ao gerar arquivo de exportação.' });
    }
  };

  const handleImportarDados = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = e.target.files;
    if (!arquivos || arquivos.length === 0) return;
    const leitor = new FileReader();
    leitor.onload = async (evento) => {
      try {
        const conteudo = evento.target?.result as string;
        const dadosImportados = JSON.parse(conteudo);
        if (dadosImportados.sistema !== 'GestaoClinicaFSPSS') throw new Error('Arquivo inválido.');
        if (!confirm('Atenção: A importação irá mesclar ou substituir registros locais. Deseja continuar?')) return;
        if (dadosImportados.configuracoes) {
          Object.entries(dadosImportados.configuracoes).forEach(([chave, valor]) => {
            localStorage.setItem(chave, valor as string);
          });
          setUnidade(dadosImportados.configuracoes.fspss_unidade_padrao || '');
          setTelefone(dadosImportados.configuracoes.fspss_telefone_padrao || '');
        }
        if (dadosImportados.bancoDados) {
          for (const [nomeTabela, registros] of Object.entries(dadosImportados.bancoDados)) {
            if (Array.isArray(registros)) {
              await (db as any).table(nomeTabela).clear();
              await (db as any).table(nomeTabela).bulkAdd(registros);
            }
          }
        }
        setStatusBackup({ tipo: 'sucesso', msg: 'Dados importados! Recarregando...' });
        setTimeout(() => window.location.reload(), 2000);
      } catch (error: any) {
        setStatusBackup({ tipo: 'erro', msg: error?.message || 'Erro ao processar o backup.' });
      }
    };
    leitor.readAsText(arquivos[0]);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-6 sm:p-8 text-gray-950">
      <div className="max-w-xl mx-auto space-y-6">

        <div className="border-b border-gray-200 pb-4">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">
            Preferências do Sistema
          </span>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
            Configurações Gerais
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Defina os dados padrão para preenchimento automático de formulários e gerencie a migração ou cópia de segurança dos dados locais.
          </p>
        </div>

        {salvo && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Configurações padrão salvas com sucesso!
          </div>
        )}

        {statusBackup && (
          <div className={`p-3 border rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${
            statusBackup.tipo === 'sucesso' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <RefreshCw size={16} className={statusBackup.tipo === 'sucesso' ? 'animate-spin text-blue-600' : 'text-red-600'} />
            {statusBackup.msg}
          </div>
        )}

        {/* MIGRAÇÃO GERAL (JSON completo) */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">Migração e Cópia Local</span>
            <h3 className="font-black text-sm text-gray-900 uppercase tracking-tight">Transferência entre Computadores</h3>
            <p className="text-xs text-gray-500 mt-0.5">Salve um arquivo com tudo que está salvo neste PC para abrir em outro navegador.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button type="button" onClick={handleExportarDados}
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg py-2.5 px-4 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer">
              <Download size={14} className="text-blue-600" /> Exportar Dados (.json)
            </button>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-lg py-2.5 px-4 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer">
              <Upload size={14} className="text-emerald-600" /> Importar Dados
            </button>
            <button type="button" onClick={handleExportarExcel}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2.5 px-4 text-xs font-black uppercase tracking-wider transition-colors col-span-1 sm:col-span-2 cursor-pointer">
              <Download size={14} /> Exportar Tudo p/ Excel (.xlsx)
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImportarDados} accept=".json" className="hidden" />
          </div>
        </div>

        {/* NOVA SEÇÃO: IMPORTAÇÃO POR TABELA COM MODELO */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">Preenchimento em Massa</span>
            <h3 className="font-black text-sm text-gray-900 uppercase tracking-tight">Importar Dados por Planilha</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Escolha uma tabela, baixe o modelo em branco, preencha no Excel e depois importe de volta.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">
              Qual tabela você quer preencher?
            </label>
            <select
              value={tabelaSelecionada}
              onChange={(e) => setTabelaSelecionada(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-gray-900 font-medium"
            >
              {TABELAS_CONFIG.map(config => (
                <option key={config.chave} value={config.chave}>{config.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleBaixarModelo(configAtual)}
              className="flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg py-2.5 px-4 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <FileDown size={14} /> Baixar Modelo
            </button>
            <button
              type="button"
              onClick={() => fileInputTabelaRef.current?.click()}
              className="flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg py-2.5 px-4 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
            >
              <FileSpreadsheet size={14} /> Importar Planilha Preenchida
            </button>
            <input
              type="file"
              ref={fileInputTabelaRef}
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (arquivo) handleImportarPlanilha(configAtual, arquivo);
              }}
            />
          </div>

          <p className="text-[10px] text-gray-400 leading-relaxed">
            💡 Não altere os nomes das colunas do modelo baixado — o sistema usa esse texto pra saber onde
            colocar cada informação. Se uma linha da planilha tiver o mesmo ID de um registro que já existe,
            o sistema vai perguntar antes de substituir.
          </p>
        </div>

        {/* PREFERÊNCIAS PADRÃO */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSalvar} className="space-y-4">

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Building2 size={12} /> Unidade de Saúde Padrão
              </label>
              <input type="text" placeholder="Ex: USF Barra do Sahy" value={unidade}
                onChange={(e) => setUnidade(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900 font-medium uppercase" />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Essa unidade virá pré-selecionada ao gerar remessas, pedidos e chamados S.O.S.
              </span>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Phone size={12} /> Telefone / Ramal da Unidade
              </label>
              <input type="text" placeholder="Ex: (12) 3865-0000" value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-gray-900 font-medium" />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Número que aparecerá no rodapé impresso da Ordem de Serviço e documentos da unidade.
              </span>
            </div>

            <div className="pt-2 border-t border-gray-100 mt-6">
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer">
                <Save size={14} /> Salvar Definições Padrão
              </button>
            </div>

          </form>
        </div>

      </div>
    </main>
  );
}
