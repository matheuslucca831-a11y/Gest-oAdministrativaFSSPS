'use client';

import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { useModal } from '@/components/ModalProvider';
import {
  Printer, UserPlus, CalendarCheck, LayoutGrid, Save, Trash2,
  CheckCircle2, X, Eye, Building2, ZoomIn, ZoomOut, RotateCcw,
} from 'lucide-react';
import { FREQUENCIA_FUNDO_BASE64 } from '@/assets/frequenciaFundo';

// ============================================================================
// ASSETS EM BASE64 — troque pelas logos reais da sua unidade
// ============================================================================
const LOGO_ESQUERDA_BASE64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNjY2MiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMDAwIiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TE9HTyAxPC90ZXh0Pjwvc3ZnPg==';
const LOGO_DIREITA_BASE64 =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDUwIDUwIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNjY2MiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjMDAwIiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TE9HTyAyPC90ZXh0Pjwvc3ZnPg==';

// ============================================================================
// TIPOS
// ============================================================================
interface Profissional {
  id: number;
  nome: string;
  matricula?: string;
  cargo: string;
  cargaHoraria: string;
}

interface EscalaItem {
  id: number;
  profissional_id: number;
  segunda?: string;
  terca?: string;
  quarta?: string;
  quinta?: string;
  sexta?: string;
}

interface FrequenciaItem {
  id: number;
  profissional_id: number;
  data: string;
  status: string;
  observacao: string;
}

type Aba = 'frequencia' | 'quadro' | 'cadastro';

const DIAS_SEMANA: { chave: keyof EscalaItem; label: string }[] = [
  { chave: 'segunda', label: 'Segunda' },
  { chave: 'terca', label: 'Terça' },
  { chave: 'quarta', label: 'Quarta' },
  { chave: 'quinta', label: 'Quinta' },
  { chave: 'sexta', label: 'Sexta' },
];

const OPCOES_STATUS = [
  'PRESENTE',
  'FALTOU',
  'ATESTADO',
  'FOLGA',
  'FÉRIAS',
  'DECLARAÇÃO DE HORAS',
  'OUTROS: OBSERVAÇÃO',
];

const OPCOES_CARGA_HORARIA = ['20h', '30h', '40h'];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
export default function FrequenciaEQuadro() {
  const { confirmar, avisar } = useModal();
  const [zoom, setZoom] = useState(0.8);

  const [abaAtiva, setAbaAtiva] = useState<Aba>('frequencia');
  const [modoPreview, setModoPreview] = useState(false);

  const hojeISO = new Date().toISOString().split('T')[0];
  const [dataFrequencia, setDataFrequencia] = useState(hojeISO);
  const [unidadeAtual, setUnidadeAtual] = useState('');
  const [statusMap, setStatusMap] = useState<Record<number, { status: string; observacao: string }>>({});

  const [novoNome, setNovoNome] = useState('');
  const [novaMatricula, setNovaMatricula] = useState('');
  const [novoCargo, setNovoCargo] = useState('');
  const [novaCargaHoraria, setNovaCargaHoraria] = useState('40h');

  const profissionais = useLiveQuery(() => db.table('profissionais').toArray(), []) as Profissional[] | undefined;
  const escalas = useLiveQuery(() => db.table('escala').toArray(), []) as EscalaItem[] | undefined;
  const frequenciasSalvas = useLiveQuery(
    () => db.table('frequencia').where('data').equals(dataFrequencia).toArray(),
    [dataFrequencia]
  ) as FrequenciaItem[] | undefined;

  const qtdProfissionais = profissionais?.length || 0;

  useEffect(() => {
    const unidadeSalva = localStorage.getItem('fspss_unidade_padrao');
    if (unidadeSalva) {
      setUnidadeAtual(unidadeSalva);
    }
  }, []);

  useEffect(() => {
    if (!profissionais) return;
    const mapaInicial: Record<number, { status: string; observacao: string }> = {};
    profissionais.forEach((p) => {
      const salvo = frequenciasSalvas?.find((f) => f.profissional_id === p.id);
      mapaInicial[p.id] = {
        status: salvo?.status || 'PRESENTE',
        observacao: salvo?.observacao || '',
      };
    });
    setStatusMap(mapaInicial);
  }, [dataFrequencia, frequenciasSalvas, profissionais]);

  const handleSalvarFrequencia = async () => {
    if (!profissionais || profissionais.length === 0) {
      avisar('Cadastre ao menos um funcionário antes de salvar a frequência.', 'erro');
      return;

    }
    localStorage.setItem('fspss_unidade_padrao', unidadeAtual); // 👈 novo

    for (const p of profissionais) {
      const dados = statusMap[p.id] || { status: 'PRESENTE', observacao: '' };
      const existente = await db
        .table('frequencia')
        .where('[profissional_id+data]')
        .equals([p.id, dataFrequencia])
        .first();
      if (existente) {
        await db.table('frequencia').update(existente.id, {
          status: dados.status,
          observacao: dados.observacao,
        });
      } else {
        await db.table('frequencia').add({
          profissional_id: p.id,
          data: dataFrequencia,
          status: dados.status,
          observacao: dados.observacao,
        });
      }
    }
    avisar('Frequência salva com sucesso!', 'sucesso');
  };

  const handleAtualizarEscala = async (profId: number, campo: string, valor: string) => {
    const escalaExistente = await db.table('escala').where('profissional_id').equals(profId).first();
    if (escalaExistente) {
      await db.table('escala').update(escalaExistente.id, { [campo]: valor });
    } else {
      await db.table('escala').add({ profissional_id: profId, [campo]: valor });
    }
  };

  const handleCadastrarProfissional = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoCargo.trim()) {
      avisar('Preencha ao menos o nome e o cargo.', 'erro');
      return;
    }
    await db.table('profissionais').add({
      nome: novoNome.trim().toUpperCase(),
      matricula: novaMatricula.trim(),
      cargo: novoCargo.trim().toUpperCase(),
      cargaHoraria: novaCargaHoraria,
    });
    setNovoNome('');
    setNovaMatricula('');
    setNovoCargo('');
    setNovaCargaHoraria('40h');
    avisar('Funcionário cadastrado!', 'sucesso');
  };

  const handleExcluirProfissional = async (id: number, nome: string) => {
    const ok = await confirmar(
      `Isso vai remover "${nome}" e todos os dados de escala/frequência associados a ele. Essa ação não pode ser desfeita.`,
      'Excluir funcionário'
    );
    if (!ok) return;
    await db.table('profissionais').delete(id);
    await db.table('escala').where('profissional_id').equals(id).delete();
    avisar('Funcionário removido.', 'sucesso');
  };

  const handleImprimir = async (opcoes?: { landscape?: boolean }) => {
    if ((window as any).electronAPI?.gerarPdfEAbrir) {
      await (window as any).electronAPI.gerarPdfEAbrir(opcoes);
    } else {
      window.print();
    }
  };

  const formatarDataBR = (strData: string) => {
    if (!strData) return '';
    const [ano, mes, dia] = strData.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <div
      className={`min-h-screen ${modoPreview ? 'bg-gray-900' : 'bg-gray-100'} p-2 sm:p-6 text-gray-800 transition-colors print:!bg-white print:!min-h-0 print:!h-auto print:!p-0 print:!m-0`}
    >
      <EstilosDeImpressao />

      {modoPreview && (
        <ModalPreview onFechar={() => setModoPreview(false)} onImprimir={handleImprimir}>
          <ContainerComZoom zoom={zoom}>
            <ConteudoImpressaoFrequencia
              unidadeAtual={unidadeAtual}
              dataFrequencia={dataFrequencia}
              formatarDataBR={formatarDataBR}
              profissionais={profissionais}
              statusMap={statusMap}
              setStatusMap={setStatusMap}
            />
          </ContainerComZoom>
        </ModalPreview>
      )}

      <div className={`no-print max-w-6xl mx-auto space-y-4 mb-6 ${modoPreview ? 'hidden' : 'block'}`}>
        <Cabecalho />
        <AbasNavegacao abaAtiva={abaAtiva} setAbaAtiva={setAbaAtiva} qtdProfissionais={qtdProfissionais} />
      </div>

      <div className={`max-w-6xl mx-auto ${modoPreview ? 'hidden' : 'block'}`}>
        {abaAtiva === 'frequencia' && (
          <AbaFrequencia
            dataFrequencia={dataFrequencia}
            setDataFrequencia={setDataFrequencia}
            unidadeAtual={unidadeAtual}
            setUnidadeAtual={setUnidadeAtual}
            onSalvar={handleSalvarFrequencia}
            onVisualizar={() => setModoPreview(true)}
            zoom={zoom}
            setZoom={setZoom}
          >
            <ContainerComZoom zoom={zoom}>
              <ConteudoImpressaoFrequencia
                unidadeAtual={unidadeAtual}
                dataFrequencia={dataFrequencia}
                formatarDataBR={formatarDataBR}
                profissionais={profissionais}
                statusMap={statusMap}
                setStatusMap={setStatusMap}
              />
            </ContainerComZoom>
          </AbaFrequencia>
        )}

        {abaAtiva === 'quadro' && (
          <AbaQuadroDaParede
            unidadeAtual={unidadeAtual}
            profissionais={profissionais}
            escalas={escalas}
            onAtualizarEscala={handleAtualizarEscala}
            onImprimir={() => handleImprimir({ landscape: true })}
          />
        )}

        {abaAtiva === 'cadastro' && (
          <AbaCadastro
            profissionais={profissionais}
            qtdProfissionais={qtdProfissionais}
            novoNome={novoNome}
            setNovoNome={setNovoNome}
            novaMatricula={novaMatricula}
            setNovaMatricula={setNovaMatricula}
            novoCargo={novoCargo}
            setNovoCargo={setNovoCargo}
            novaCargaHoraria={novaCargaHoraria}
            setNovaCargaHoraria={setNovaCargaHoraria}
            onSubmit={handleCadastrarProfissional}
            onExcluir={handleExcluirProfissional}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SUBCOMPONENTES DE ESTRUTURA
// ============================================================================

function EstilosDeImpressao() {
  return (
    <style jsx global>{`
      @media print {
        html, body {
          background: white !important;
          color: black !important;
          margin: 0 !important;
          padding: 0 !important;
          height: auto !important;
          min-height: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
        @page {
          size: A4 landscape;
          margin: 1mm 10mm 1mm 10mm;
        }
        .pagina-impressao {
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          box-shadow: none !important;
          border: none !important;
        }
        /* O zoom da TELA nunca deve afetar o PDF — sempre imprime no tamanho real da página */
        .zoom-wrapper {
          width: 100% !important;
          margin: 0 auto !important;
        }
      }
    `}</style>
  );
}

// 🔧 ZOOM CORRIGIDO: agora define uma largura em pixels de verdade (não porcentagem
// relativa a si mesma), então o zoom realmente aumenta/diminui o tamanho visível.
const BASE_LARGURA_TELA = 1300; // px — tamanho de referência quando o zoom está em 100%

function ContainerComZoom({ zoom, children }: { zoom: number; children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <div className="zoom-wrapper" style={{ width: `${BASE_LARGURA_TELA * zoom}px`, maxWidth: 'none' }}>
        {children}
      </div>
    </div>
  );
}

function Cabecalho() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
      <div>
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
          <CalendarCheck className="text-blue-600" size={24} /> Frequência da Unidade
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Gestão de presença, escala e impressão estruturada.</p>
      </div>
    </div>
  );
}

function AbasNavegacao({
  abaAtiva,
  setAbaAtiva,
  qtdProfissionais,
}: {
  abaAtiva: Aba;
  setAbaAtiva: (a: Aba) => void;
  qtdProfissionais: number;
}) {
  const abas: { chave: Aba; label: string; icone: React.ReactNode }[] = [
    { chave: 'frequencia', label: 'Frequência Diária', icone: <CalendarCheck size={16} /> },
    { chave: 'quadro', label: 'Quadro da Parede', icone: <LayoutGrid size={16} /> },
    { chave: 'cadastro', label: `Funcionários (${qtdProfissionais})`, icone: <UserPlus size={16} /> },
  ];

  return (
    <div className="flex bg-gray-200/80 p-1 rounded-xl gap-1 text-xs font-bold">
      {abas.map((aba) => (
        <button
          key={aba.chave}
          onClick={() => setAbaAtiva(aba.chave)}
          className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            abaAtiva === aba.chave ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {aba.icone} {aba.label}
        </button>
      ))}
    </div>
  );
}

function ModalPreview({
  onFechar,
  onImprimir,
  children,
}: {
  onFechar: () => void;
  onImprimir: (opcoes?: { landscape?: boolean }) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 bg-gray-900/90 overflow-y-auto flex flex-col items-center p-4 sm:p-8 print:static print:bg-white print:p-0 print:block">
      <div className="no-print w-full max-w-5xl flex justify-between items-center bg-white p-4 rounded-t-xl shadow-lg">
        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <Eye className="text-blue-600" /> Pré-visualização de Impressão
        </h2>
        <div className="flex gap-3">
          <button
            onClick={onFechar}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <X size={16} /> Cancelar
          </button>
          <button
            onClick={() => onImprimir({ landscape: true })}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Printer size={16} /> Gerar PDF / Imprimir
          </button>
        </div>
      </div>
      <div className="w-full max-w-none bg-white shadow-2xl rounded-b-xl p-8 mb-10 overflow-auto print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full">
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// ABA: FREQUÊNCIA DIÁRIA
// ============================================================================
function AbaFrequencia({
  dataFrequencia,
  setDataFrequencia,
  unidadeAtual,
  setUnidadeAtual,
  onSalvar,
  onVisualizar,
  zoom,
  setZoom,
  children,
}: {
  dataFrequencia: string;
  setDataFrequencia: (v: string) => void;
  unidadeAtual: string;
  setUnidadeAtual: (v: string) => void;
  onSalvar: () => void;
  onVisualizar: () => void;
  zoom: number;
  setZoom: (v: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="pagina-impressao bg-white border border-gray-300 shadow-lg rounded-xl overflow-hidden p-4 sm:p-6">
      <div className="no-print bg-blue-50/60 border border-blue-100 p-4 rounded-xl mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Data da Frequência</label>
            <input
              type="date"
              value={dataFrequencia}
              onChange={(e) => setDataFrequencia(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
              <Building2 size={11} /> Unidade
            </label>
            <input
              type="text"
              value={unidadeAtual}
              onChange={(e) => setUnidadeAtual(e.target.value.toUpperCase())}
              className="bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Zoom</label>
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setZoom(Math.max(0.5, +(zoom - 0.1).toFixed(2)))}
                className="p-1 rounded hover:bg-gray-100"
                title="Diminuir"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[10px] font-bold text-gray-600 w-9 text-center">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom(Math.min(2, +(zoom + 0.1).toFixed(2)))}
                className="p-1 rounded hover:bg-gray-100"
                title="Aumentar"
              >
                <ZoomIn size={14} />
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="p-1 rounded hover:bg-gray-100"
                title="Restaurar"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSalvar}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs uppercase transition-all cursor-pointer flex items-center gap-2"
          >
            <Save size={14} /> Salvar
          </button>
          <button
            onClick={onVisualizar}
            className="bg-gray-800 hover:bg-black text-white font-bold px-4 py-2 rounded-lg text-xs uppercase transition-all cursor-pointer flex items-center gap-2"
          >
            <Eye size={14} /> Visualizar Impressão
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}

const IMG_LARGURA = 1754;
const IMG_ALTURA = 1241;

const pctX = (px: number) => `${(px / IMG_LARGURA) * 100}%`;
const pctY = (px: number) => `${(px / IMG_ALTURA) * 100}%`;
// 🔧 RECALIBRADO: agora usa o tamanho real em pt de cada campo da planilha,
// convertido pra pixel-de-imagem (150dpi) e depois pra cqw. Antes os números
// estavam quase 2x menores que o correto.
const cqw = (imgPx: number) => `${(imgPx / IMG_LARGURA) * 100}cqw`;

const COORDS = {
  data: { x: 605, y: 177.5, largura: 989, altura: 43.5 },
  unidade: { x: 605, y: 221, largura: 989, altura: 39 },
  tabela: {
    inicioY: 319,
    alturaLinha: 29.69,
    colunas: {
      nome: { x: 158, largura: 447 },
      cargo: { x: 605, largura: 319 },
      status: { x: 924, largura: 356 },
      observacao: { x: 1280, largura: 314 },
    },
  },
};

// Tamanhos de fonte calibrados a partir dos pt reais da planilha (18/16/14/11pt @150dpi)
const FONTE = {
  data: cqw(38),      // 18pt
  unidade: cqw(33),   // 16pt
  cabecalho: cqw(29), // 14pt (Nome Completo / Cargo / Observações)
  corpo: cqw(23),     // 11pt (nomes, cargos, status, observação de cada linha)
};

function ConteudoImpressaoFrequencia({
  unidadeAtual,
  dataFrequencia,
  formatarDataBR,
  profissionais,
  statusMap,
  setStatusMap,
}: {
  unidadeAtual: string;
  dataFrequencia: string;
  formatarDataBR: (d: string) => string;
  profissionais?: Profissional[];
  statusMap: Record<number, { status: string; observacao: string }>;
  setStatusMap: React.Dispatch<React.SetStateAction<Record<number, { status: string; observacao: string }>>>;
}) {
  const lista = profissionais || [];
  const MAX_LINHAS_TEMPLATE = 27;

  return (
    <div
      className="relative mx-auto w-full"
      style={{
        aspectRatio: `${IMG_LARGURA} / ${IMG_ALTURA}`,
        containerType: 'inline-size',
        backgroundImage: `url(${FREQUENCIA_FUNDO_BASE64})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        fontFamily: 'Calibri, Arial, sans-serif',
      }}
    >
      {/* DATA */}
      <div
        className="absolute flex items-center justify-center font-bold uppercase text-black"
        style={{
          left: pctX(COORDS.data.x), top: pctY(COORDS.data.y),
          width: pctX(COORDS.data.largura), height: pctY(COORDS.data.altura),
          fontSize: FONTE.data,
        }}
      >
        {formatarDataBR(dataFrequencia)}
      </div>

      {/* UNIDADE */}
      <div
        className="absolute flex items-center justify-center font-bold uppercase text-black"
        style={{
          left: pctX(COORDS.unidade.x), top: pctY(COORDS.unidade.y),
          width: pctX(COORDS.unidade.largura), height: pctY(COORDS.unidade.altura),
          fontSize: FONTE.unidade,
        }}
      >
        {unidadeAtual}
      </div>

      {/* LINHAS DE FUNCIONÁRIOS */}
      {lista.slice(0, MAX_LINHAS_TEMPLATE).map((p, i) => {
        const yPx = COORDS.tabela.inicioY + i * COORDS.tabela.alturaLinha;
        const statusAtual = statusMap[p.id]?.status || 'PRESENTE';
        const obsAtual = statusMap[p.id]?.observacao || '';

        return (
          <React.Fragment key={p.id}>
            <div
              className="absolute flex items-center px-2 font-bold uppercase text-black overflow-hidden"
              style={{
                left: pctX(COORDS.tabela.colunas.nome.x), top: pctY(yPx),
                width: pctX(COORDS.tabela.colunas.nome.largura), height: pctY(COORDS.tabela.alturaLinha),
                fontSize: FONTE.corpo,
              }}
            >
              {p.nome}
            </div>
            <div
              className="absolute flex items-center justify-center px-1 uppercase text-black font-semibold overflow-hidden"
              style={{
                left: pctX(COORDS.tabela.colunas.cargo.x), top: pctY(yPx),
                width: pctX(COORDS.tabela.colunas.cargo.largura), height: pctY(COORDS.tabela.alturaLinha),
                fontSize: FONTE.corpo,
              }}
            >
              {p.cargo}
            </div>

            <div
              className="absolute flex items-center justify-center text-black font-bold uppercase"
              style={{
                left: pctX(COORDS.tabela.colunas.status.x), top: pctY(yPx),
                width: pctX(COORDS.tabela.colunas.status.largura), height: pctY(COORDS.tabela.alturaLinha),
                fontSize: FONTE.corpo,
              }}
            >
              <span className="print-only hidden">{statusAtual}</span>
              <select
                value={statusAtual}
                onChange={(e) => setStatusMap((prev) => ({ ...prev, [p.id]: { ...prev[p.id], status: e.target.value } }))}
                className="no-print w-full h-full bg-transparent border-none text-center font-bold uppercase outline-none cursor-pointer"
                style={{ fontSize: FONTE.corpo }}
              >
                {OPCOES_STATUS.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            <div
              className="absolute flex items-center px-1 text-black font-bold uppercase"
              style={{
                left: pctX(COORDS.tabela.colunas.observacao.x), top: pctY(yPx),
                width: pctX(COORDS.tabela.colunas.observacao.largura), height: pctY(COORDS.tabela.alturaLinha),
                fontSize: FONTE.corpo,
              }}
            >
              <span className="print-only hidden">{obsAtual}</span>
              <input
                type="text"
                placeholder="Ex: DAY-OFF"
                value={obsAtual}
                onChange={(e) => setStatusMap((prev) => ({ ...prev, [p.id]: { ...prev[p.id], observacao: e.target.value } }))}
                className="no-print w-full h-full bg-transparent border-none px-1 font-bold uppercase outline-none"
                style={{ fontSize: FONTE.corpo }}
              />
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================================
// ABA: QUADRO DA PAREDE
// ============================================================================
function AbaQuadroDaParede({
  unidadeAtual,
  profissionais,
  escalas,
  onAtualizarEscala,
  onImprimir,
}: {
  unidadeAtual: string;
  profissionais?: Profissional[];
  escalas?: EscalaItem[];
  onAtualizarEscala: (profId: number, campo: string, valor: string) => void;
  onImprimir: () => void;
}) {
  return (
    <div className="bg-white border border-gray-300 shadow-lg rounded-xl overflow-hidden p-6">
      <div className="no-print mb-4 flex justify-between items-center">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <LayoutGrid className="text-blue-600" /> Gestão de Horários
        </h2>
        <button
          onClick={() => onImprimir()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex gap-2 transition-all"
        >
          <Printer size={16} /> Imprimir Quadro
        </button>
      </div>

      <div className="pagina-impressao w-full text-black">
        <div className="text-center font-bold mb-4 border-2 border-black bg-[#fdf2d6] p-3 uppercase tracking-widest text-lg sm:text-xl">
          <h2>QUADRO DE HORÁRIOS - {unidadeAtual}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-black text-xs text-center min-w-[700px]">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-black divide-x-2 divide-black text-[11px] font-black uppercase">
                <th className="p-2 border-b-2 border-black w-[18%]">Profissional</th>
                <th className="p-2 border-b-2 border-black w-[12%]">Cargo</th>
                <th className="p-2 border-b-2 border-black w-[10%]">Carga</th>
                {DIAS_SEMANA.map((dia) => (
                  <th key={dia.chave} className="p-2 border-b-2 border-black">
                    {dia.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black border-2 border-black">
              {profissionais?.map((p) => {
                const escala = escalas?.find((e) => e.profissional_id === p.id) || ({} as EscalaItem);
                return (
                  <tr key={p.id} className="divide-x-2 divide-black bg-white hover:bg-gray-50 transition-colors">
                    <td className="p-2 font-bold uppercase text-left">{p.nome}</td>
                    <td className="p-2 uppercase font-semibold text-left">{p.cargo}</td>
                    <td className="p-2 uppercase font-semibold text-gray-500">{p.cargaHoraria}</td>
                    {DIAS_SEMANA.map((dia) => (
                      <td key={dia.chave} className="p-0.5">
                        <input
                          type="text"
                          value={(escala as any)[dia.chave] || ''}
                          onChange={(e) => onAtualizarEscala(p.id, dia.chave, e.target.value)}
                          placeholder="08h às 17h"
                          className="w-full text-center text-[10px] font-bold outline-none border-none bg-transparent uppercase"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
              {(!profissionais || profissionais.length === 0) && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500 font-bold uppercase">
                    Nenhum funcionário cadastrado. Vá até a aba &quot;Funcionários&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ABA: CADASTRO DE FUNCIONÁRIOS
// ============================================================================
function AbaCadastro({
  profissionais,
  qtdProfissionais,
  novoNome,
  setNovoNome,
  novaMatricula,
  setNovaMatricula,
  novoCargo,
  setNovoCargo,
  novaCargaHoraria,
  setNovaCargaHoraria,
  onSubmit,
  onExcluir,
}: {
  profissionais?: Profissional[];
  qtdProfissionais: number;
  novoNome: string;
  setNovoNome: (v: string) => void;
  novaMatricula: string;
  setNovaMatricula: (v: string) => void;
  novoCargo: string;
  setNovoCargo: (v: string) => void;
  novaCargaHoraria: string;
  setNovaCargaHoraria: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onExcluir: (id: number, nome: string) => void;
}) {
  return (
    <div className="no-print bg-white p-6 rounded-xl border border-gray-300 shadow-sm">
      <h2 className="font-bold mb-4 text-gray-800 flex items-center gap-2">
        <UserPlus className="text-blue-600" /> Cadastrar Novo Funcionário
      </h2>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
          <input
            type="text"
            value={novoNome}
            onChange={(e) => setNovoNome(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Matrícula</label>
          <input
            type="text"
            value={novaMatricula}
            onChange={(e) => setNovaMatricula(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cargo</label>
          <input
            type="text"
            value={novoCargo}
            onChange={(e) => setNovoCargo(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Carga Horária</label>
          <select
            value={novaCargaHoraria}
            onChange={(e) => setNovaCargaHoraria(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            {OPCOES_CARGA_HORARIA.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
          >
            <Save size={16} /> Salvar
          </button>
        </div>
      </form>

      <h3 className="font-bold text-gray-800 mb-3 text-sm uppercase">Equipe da Unidade ({qtdProfissionais})</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse text-sm text-left">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="p-3 font-bold text-gray-600 uppercase text-xs">Nome</th>
              <th className="p-3 font-bold text-gray-600 uppercase text-xs">Matrícula</th>
              <th className="p-3 font-bold text-gray-600 uppercase text-xs">Cargo</th>
              <th className="p-3 font-bold text-gray-600 uppercase text-xs">Carga</th>
              <th className="p-3 font-bold text-gray-600 uppercase text-xs text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {profissionais?.map((p) => (
              <tr key={p.id} className="bg-white hover:bg-gray-50 transition-colors">
                <td className="p-3 font-bold text-gray-800 uppercase">{p.nome}</td>
                <td className="p-3 text-gray-600">{p.matricula || '-'}</td>
                <td className="p-3 text-gray-600 font-semibold uppercase">{p.cargo}</td>
                <td className="p-3 text-gray-600 font-semibold">{p.cargaHoraria}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => onExcluir(p.id, p.nome)}
                    className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                    title="Excluir Funcionário"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {(!profissionais || profissionais.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500 text-sm font-semibold">
                  Nenhum funcionário cadastrado no banco de dados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}