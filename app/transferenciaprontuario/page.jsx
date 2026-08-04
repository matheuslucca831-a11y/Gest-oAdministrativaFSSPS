'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/db';

// ─── CONSTANTES ───────────────────────────────────────────────────────────────

const UNIDADES = [
  'USF BAREQUECABA',
  'USF BARRA DO SAHY',
  'USF BARRA DO UNA',
  'USF BOICUCANGA I',
  'USF BOICUCANGA II',
  'USF BORACÉIA',
  'USF CAMBURY I',
  'USF CAMBURY II',
  'USF CANTO DO MAR',
  'USF CENTRO',
  'USF ENSEADA I',
  'USF ENSEADA II',
  'USF ITATINGA I',
  'USF ITATINGA II',
  'USF JARAGUÁ',
  'USF JUQUEHY I',
  'USF JUQUEHY II',
  'USF MARESIAS I',
  'USF MARESIAS II',
  'USF MARESIAS III',
  'USF MORRO DO ABRIGO',
  'USF OLARIA',
  'USF PAUBA',
  'USF PONTAL DA CRUZ',
  'USF SÃO FRANCISCO',
  'USF VARADOURO',
  'OUTRO',
];

const MOTIVOS = [
  'MUDANÇA DE ENDEREÇO',
  'SOLICITAÇÃO DO PACIENTE',
  'OUTRO',
];

const TIPOS = ['CÓPIA', 'TRANSFERÊNCIA'];
const STATUS_LIST = ['PENDENTE', 'EM ANDAMENTO', 'CONCLUÍDO', 'CANCELADO'];

const STATUS_META = {
  'PENDENTE':     { bg: '#FFFBEB', border: '#FCD34D', text: '#92400E', dot: '#F59E0B' },
  'EM ANDAMENTO': { bg: '#EFF6FF', border: '#93C5FD', text: '#1E40AF', dot: '#3B82F6' },
  'CONCLUÍDO':    { bg: '#F0FDF4', border: '#86EFAC', text: '#166534', dot: '#22C55E' },
  'CANCELADO':    { bg: '#FFF1F2', border: '#FCA5A5', text: '#991B1B', dot: '#EF4444' },
};

const FORM_VAZIO = {
  unidadeSolicitante: '',
  outroUnidade: '',
  solicitanteEhPaciente: false,
  solicitante: '',
  paciente: '',
  cross: '',
  tipoSolicitacao: '',
  motivoSolicitacao: '',
  outroMotivo: '',
  envioPFSPSS: '',
  envioPUnidadeOrigem: '',
  recebimentoProntuario: '',
  entregaCopia: '',
  envioFormulario: '',
  recebimentoFormulario: '',
  status: 'PENDENTE',
  observacoes: '',
};

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────

const fmtData = (iso) => {
  if (!iso) return '—';
  try {
    const [y, m, d] = iso.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  } catch { return '—'; }
};

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const S = {
  page: {
    background: '#FFFFFF',
    minHeight: '100vh',
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    color: '#111827',
  },
  topbar: {
    background: '#FFFFFF',
    borderBottom: '1.5px solid #E5E7EB',
    padding: '0 32px',
    display: 'flex',
    alignItems: 'center',
    height: 56,
    gap: 16,
  },
  topbarTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#111827',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    flex: 1,
  },
  topbarSub: {
    fontSize: 11,
    color: '#6B7280',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  body: {
    padding: '24px 32px',
    background: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#9CA3AF',
    marginBottom: 10,
    marginTop: 0,
  },
  card: {
    background: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: 8,
    padding: '20px 24px',
    marginBottom: 16,
  },
  cardHeader: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#6B7280',
    borderBottom: '1px solid #F3F4F6',
    paddingBottom: 12,
    marginBottom: 18,
    marginTop: 0,
  },
  label: {
    display: 'block',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    padding: '8px 11px',
    fontSize: 13,
    fontWeight: 500,
    color: '#111827',
    background: '#FFFFFF',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
    boxSizing: 'border-box',
    outline: 'none',
    textTransform: 'uppercase',
    transition: 'border-color 0.15s',
  },
  inputDisabled: {
    width: '100%',
    border: '1px solid #E5E7EB',
    borderRadius: 6,
    padding: '8px 11px',
    fontSize: 13,
    fontWeight: 500,
    color: '#9CA3AF',
    background: '#F9FAFB',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
    boxSizing: 'border-box',
    outline: 'none',
    textTransform: 'uppercase',
    cursor: 'not-allowed',
  },
  select: {
    width: '100%',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    padding: '8px 11px',
    fontSize: 13,
    fontWeight: 500,
    color: '#111827',
    background: '#FFFFFF',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
    boxSizing: 'border-box',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
  },
  textarea: {
    width: '100%',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    padding: '8px 11px',
    fontSize: 13,
    fontWeight: 500,
    color: '#111827',
    background: '#FFFFFF',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    minHeight: 72,
    textTransform: 'uppercase',
  },
  btnPrimary: {
    background: '#111827',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: 6,
    padding: '9px 20px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnSecondary: {
    background: '#FFFFFF',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: 6,
    padding: '9px 20px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnDanger: {
    background: '#FFFFFF',
    color: '#B91C1C',
    border: '1px solid #FECACA',
    borderRadius: 6,
    padding: '9px 20px',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  btnGhost: {
    background: 'none',
    border: 'none',
    color: '#374151',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    padding: '9px 0',
  },
  th: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#6B7280',
    padding: '10px 16px',
    textAlign: 'left',
    borderBottom: '1.5px solid #E5E7EB',
    background: '#FAFAFA',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '11px 16px',
    borderBottom: '1px solid #F3F4F6',
    fontSize: 12,
    fontWeight: 500,
    color: '#111827',
    letterSpacing: '0.02em',
    verticalAlign: 'middle',
  },
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? STATUS_META['PENDENTE'];
  return (
    <span style={{
      background: m.bg,
      color: m.text,
      border: `1px solid ${m.border}`,
      borderRadius: 4,
      padding: '3px 10px',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

// ─── CAMPO DE FORMULÁRIO ──────────────────────────────────────────────────────

function Campo({ label, value, onChange, type = 'text', options, required, placeholder, span = 1 }) {
  const handleChange = (e) => {
    const val = type === 'date' ? e.target.value : e.target.value.toUpperCase();
    onChange(val);
  };

  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <label style={S.label}>
        {label}
        {required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
      </label>
      {options ? (
        <div style={{ position: 'relative' }}>
          <select value={value} onChange={e => onChange(e.target.value)} style={S.select}>
            <option value="">SELECIONAR...</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: '#6B7280' }}>▼</span>
        </div>
      ) : type === 'textarea' ? (
        <textarea value={value} onChange={handleChange} placeholder={placeholder} style={S.textarea} rows={3} />
      ) : type === 'date' ? (
        <input type="date" value={value} onChange={e => onChange(e.target.value)} style={{ ...S.input, textTransform: 'none' }} />
      ) : (
        <input type="text" value={value} onChange={handleChange} placeholder={placeholder} style={S.input} />
      )}
    </div>
  );
}
// ─── CAMPO COM BUSCA (AUTOCOMPLETE) ───────────────────────────────────────────

function CampoBusca({ label, value, onChange, options, required, placeholder, span = 1 }) {
  const [busca, setBusca] = useState(value || '');
  const [aberto, setAberto] = useState(false);

  // Mantém o input sincronizado caso o formulário seja limpo ou editado
  useEffect(() => {
    setBusca(value || '');
  }, [value]);

  // Filtra as opções com base no texto digitado
  const filtradas = options.filter(o => o.includes(busca.toUpperCase()));

  return (
    <div style={{ gridColumn: `span ${span}`, position: 'relative' }}>
      <label style={S.label}>
        {label}
        {required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
      </label>
      
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={busca}
          onChange={e => {
            setBusca(e.target.value.toUpperCase());
            setAberto(true); // Abre a lista ao digitar
          }}
          onFocus={() => setAberto(true)}
          // O timeout garante que o clique na lista(onClick) registre antes de fechar(onBlur)
          onBlur={() => setTimeout(() => setAberto(false), 200)}
          placeholder={placeholder || "DIGITE PARA BUSCAR..."}
          style={S.input}
        />
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: '#6B7280' }}>▼</span>
      </div>

      {aberto && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#FFFFFF', border: '1px solid #D1D5DB', borderRadius: 6,
          maxHeight: 200, overflowY: 'auto', zIndex: 50, padding: 0, margin: '4px 0 0 0',
          listStyle: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          {filtradas.map(o => (
            <li
              key={o}
              onClick={() => {
                onChange(o); // Atualiza o state do form principal
                setBusca(o); // Atualiza o input
                setAberto(false); // Fecha a lista
              }}
              style={{ padding: '8px 11px', fontSize: 12, fontWeight: 500, color: '#111827', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}
              onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
              onMouseLeave={e => e.currentTarget.style.background = '#FFFFFF'}
            >
              {o}
            </li>
          ))}
          {filtradas.length === 0 && (
            <li style={{ padding: '8px 11px', fontSize: 11, color: '#6B7280', fontWeight: 600 }}>
              NENHUMA UNIDADE ENCONTRADA
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
// ─── CAMPO SOLICITANTE (com lógica de "é o próprio paciente") ────────────────

function CampoSolicitante({ form, setF }) {
  const ehPaciente = form.solicitanteEhPaciente;

  function toggleEhPaciente() {
    const novo = !ehPaciente;
    setF('solicitanteEhPaciente')(novo);
    if (novo) {
      setF('solicitante')(form.paciente || '');
    } else {
      setF('solicitante')('');
    }
  }

useEffect(() => {
    if (ehPaciente) {
      setF('solicitante')(form.paciente || '');
    }
  }, [form.paciente, ehPaciente, setF]);

  return (
    <div style={{ gridColumn: 'span 1', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <label style={S.label}>
          SOLICITANTE<span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>
        </label>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: ehPaciente ? '#111827' : '#6B7280',
          userSelect: 'none',
        }}>
          <div style={{
            width: 32,
            height: 18,
            borderRadius: 9,
            background: ehPaciente ? '#111827' : '#D1D5DB',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
            onClick={toggleEhPaciente}
          >
            <div style={{
              position: 'absolute',
              top: 2,
              left: ehPaciente ? 16 : 2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#FFFFFF',
              transition: 'left 0.2s',
            }} />
          </div>
          O PRÓPRIO PACIENTE
        </label>
      </div>

      {ehPaciente ? (
        <div>
          <input
            type="text"
            value={form.paciente || ''}
            disabled
            style={S.inputDisabled}
          />
          <div style={{ marginTop: 5, fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: '#6B7280', textTransform: 'uppercase' }}>
            PREENCHIDO AUTOMATICAMENTE COM O NOME DO PACIENTE
          </div>
        </div>
      ) : (
        <input
          type="text"
          value={form.solicitante}
          onChange={e => setF('solicitante')(e.target.value.toUpperCase())}
          placeholder="NOME COMPLETO"
          style={S.input}
        />
      )}
    </div>
  );
}

// ─── MÉTRICA CARD ─────────────────────────────────────────────────────────────

function MetricCard({ label, valor, accent, onClick, ativo }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: ativo ? '#111827' : '#FFFFFF',
        border: `1.5px solid ${ativo ? '#111827' : '#E5E7EB'}`,
        borderTop: `3px solid ${ativo ? '#111827' : accent}`,
        borderRadius: 6,
        padding: '14px 18px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: ativo ? '#9CA3AF' : '#6B7280', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: ativo ? '#FFFFFF' : '#111827', lineHeight: 1 }}>
        {valor}
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function TransferenciaProntuario() {
  const [transferencias, setTransferencias] = useState([]);
  const [view, setView] = useState('lista');
  const [form, setForm] = useState(FORM_VAZIO);
  const [editId, setEditId] = useState(null);
  const [selecionado, setSelecionado] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await db.transferencias.orderBy('dataRegistro').reverse().toArray();
      setTransferencias(lista);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  const setF = (campo) => (val) => setForm(prev => ({ ...prev, [campo]: val }));

  async function salvar() {
    const solicitanteValido = form.solicitanteEhPaciente ? !!form.paciente : !!form.solicitante;
    if (
      !form.unidadeSolicitante || !form.paciente || !form.tipoSolicitacao || !form.motivoSolicitacao ||
      !solicitanteValido ||
      (form.unidadeSolicitante === 'OUTRO' && !form.outroUnidade) ||
      (form.motivoSolicitacao === 'OUTRO' && !form.outroMotivo)
    ) {
      setErro('PREENCHA OS CAMPOS OBRIGATÓRIOS.');
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      const agora = new Date().toISOString();
      const solicitanteGravado = form.solicitanteEhPaciente ? form.paciente : form.solicitante;
      const reg = {
        ...form,
        solicitante: solicitanteGravado,
        dataRegistro: editId
          ? (transferencias.find(t => t.id === editId)?.dataRegistro ?? agora)
          : agora,
        dataAtualizacao: agora,
      };
      if (editId) {
        await db.transferencias.update(editId, reg);
      } else {
        await db.transferencias.add(reg);
      }
      await carregar();
      setForm(FORM_VAZIO);
      setEditId(null);
      setView('lista');
    } catch (e) {
      console.error(e);
      setErro('ERRO AO SALVAR. TENTE NOVAMENTE.');
    }
    setSalvando(false);
  }

  async function excluir(id) {
    if (!confirm('CONFIRMAR EXCLUSÃO DESTE REGISTRO?')) return;
    await db.transferencias.delete(id);
    await carregar();
    if (selecionado?.id === id) setView('lista');
  }

  function abrirEdicao(t) {
    setForm({ ...FORM_VAZIO, ...t });
    setEditId(t.id);
    setErro('');
    setView('form');
  }

  function abrirDetalhes(t) {
    setSelecionado(t);
    setView('detalhes');
  }

  function voltar() {
    setView('lista');
    setEditId(null);
    setForm(FORM_VAZIO);
    setErro('');
  }

  const filtradas = transferencias.filter(t => {
    const q = busca.toUpperCase();
    const buscaOk = !q ||
      (t.paciente ?? '').toUpperCase().includes(q) ||
      (t.solicitante ?? '').toUpperCase().includes(q) ||
      (t.cross ?? '').toUpperCase().includes(q) ||
      (t.unidadeSolicitante ?? '').toUpperCase().includes(q);
    const statusOk = filtroStatus === 'TODOS' || t.status === filtroStatus;
    const tipoOk = filtroTipo === 'TODOS' || t.tipoSolicitacao === filtroTipo;
    return buscaOk && statusOk && tipoOk;
  });

  const cont = {
    total: transferencias.length,
    pendente: transferencias.filter(t => t.status === 'PENDENTE').length,
    andamento: transferencias.filter(t => t.status === 'EM ANDAMENTO').length,
    concluido: transferencias.filter(t => t.status === 'CONCLUÍDO').length,
  };

  // ── DETALHES ──────────────────────────────────────────────────────────────
  if (view === 'detalhes' && selecionado) {
    const t = selecionado;
    const solicitanteExibido = t.solicitanteEhPaciente
      ? `${t.paciente} (PRÓPRIO PACIENTE)`
      : t.solicitante;

    const campos = [
      { g: 'IDENTIFICAÇÃO', itens: [
        ['UNIDADE SOLICITANTE', t.unidadeSolicitante === 'OUTRO' && t.outroUnidade ? `OUTRO — ${t.outroUnidade}` : t.unidadeSolicitante],
        ['SOLICITANTE', solicitanteExibido],
        ['PACIENTE', t.paciente],
        ['Nº PRONTUÁRIO', t.cross],
        ['TIPO DE SOLICITAÇÃO', t.tipoSolicitacao],
        ['MOTIVO DA SOLICITAÇÃO', t.motivoSolicitacao === 'OUTRO' && t.outroMotivo ? `OUTRO — ${t.outroMotivo}` : t.motivoSolicitacao],
      ]},
      { g: 'CONTROLE DE DATAS', itens: t.tipoSolicitacao === 'CÓPIA' ? [
        ['ENVIO P/ FSPSS VIA 1DOC', fmtData(t.envioPFSPSS)],
        ['ENVIO DO FORMULÁRIO ASSINADO PARA FSPSS', fmtData(t.envioFormulario)],
        ['ENTREGA DA CÓPIA AO SOLICITANTE', fmtData(t.entregaCopia)],
      ] : [
        ['ENVIO P/ FSPSS VIA 1DOC', fmtData(t.envioPFSPSS)],
        ['ENVIO P/ UNIDADE DE ORIGEM', fmtData(t.envioPUnidadeOrigem)],
        ['RECEBIMENTO DO PRONTUÁRIO ORIGINAL E/OU CÓPIA', fmtData(t.recebimentoProntuario)],
        ['ENVIO DO FORMULÁRIO ASSINADO PARA FSPSS', fmtData(t.envioFormulario)],
      ]},
      { g: 'REGISTRO DO SISTEMA', itens: [
        ['DATA DO REGISTRO', fmtData(t.dataRegistro)],
        ['ÚLTIMA ATUALIZAÇÃO', fmtData(t.dataAtualizacao)],
      ]},
    ];

    return (
      <div style={S.page}>
        <div style={S.topbar}>
          <button onClick={voltar} style={S.btnGhost}>← VOLTAR</button>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <span style={S.topbarTitle}>CONTROLE DE PRONTUÁRIO — DETALHES</span>
          <button onClick={() => abrirEdicao(t)} style={S.btnSecondary}>EDITAR</button>
          <button onClick={() => excluir(t.id)} style={S.btnDanger}>EXCLUIR</button>
        </div>

        <div style={S.body}>
          <div style={{ ...S.card, borderTop: `3px solid ${STATUS_META[t.status]?.dot ?? '#6B7280'}`, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={S.sectionTitle}>PACIENTE</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#111827', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {t.paciente || '—'}
                </div>
                {t.cross && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 4 }}>
                    Nº PRONTUÁRIO: {t.cross}
                  </div>
                )}
                {t.solicitanteEhPaciente && (
                  <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 4, padding: '2px 8px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#166534', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      SOLICITANTE É O PRÓPRIO PACIENTE
                    </span>
                  </div>
                )}
              </div>
              <StatusBadge status={t.status} />
            </div>
          </div>

          {campos.map(({ g, itens }) => (
            <div key={g} style={S.card}>
              <p style={S.cardHeader}>{g}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px 24px' }}>
                {itens.map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{v || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {t.observacoes && (
            <div style={{ ...S.card, borderLeft: '3px solid #6B7280', borderRadius: '0 8px 8px 0' }}>
              <p style={S.cardHeader}>OBSERVAÇÕES</p>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#374151', textTransform: 'uppercase', lineHeight: 1.6 }}>
                {t.observacoes}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── FORMULÁRIO ────────────────────────────────────────────────────────────
  if (view === 'form') {
    const isCopia = form.tipoSolicitacao === 'CÓPIA';
    const isTransf = form.tipoSolicitacao === 'TRANSFERÊNCIA';
    const solicitanteValido = form.solicitanteEhPaciente ? !!form.paciente : !!form.solicitante;
    const camposObrigatorios =
      !form.unidadeSolicitante || !form.paciente || !form.tipoSolicitacao || !form.motivoSolicitacao ||
      !solicitanteValido ||
      (form.unidadeSolicitante === 'OUTRO' && !form.outroUnidade) ||
      (form.motivoSolicitacao === 'OUTRO' && !form.outroMotivo);

    return (
      <div style={S.page}>
        <div style={S.topbar}>
          <button onClick={voltar} style={S.btnGhost}>← VOLTAR</button>
          <span style={{ color: '#D1D5DB' }}>|</span>
          <span style={S.topbarTitle}>
            {editId ? 'EDITAR REGISTRO DE SOLICITAÇÃO' : 'NOVA SOLICITAÇÃO DE TRANSFERÊNCIA / CÓPIA'}
          </span>
        </div>

        <div style={S.body}>
          {erro && (
            <div style={{ background: '#FFF1F2', border: '1px solid #FECACA', borderRadius: 6, padding: '10px 16px', marginBottom: 16, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#991B1B', textTransform: 'uppercase' }}>
              {erro}
            </div>
          )}

          <div style={S.card}>
            <p style={S.cardHeader}>DADOS DA SOLICITAÇÃO</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px' }}>

              <CampoBusca 
                label="UNIDADE SOLICITANTE" 
                value={form.unidadeSolicitante} 
                onChange={setF('unidadeSolicitante')} 
                options={UNIDADES} 
                placeholder="SELECIONE OU DIGITE A UNIDADE"
                required 
              />
              {form.unidadeSolicitante === 'OUTRO' ? (
                <Campo label="ESPECIFICAR UNIDADE" value={form.outroUnidade} onChange={setF('outroUnidade')} placeholder="NOME DA UNIDADE SOLICITANTE" required />
              ) : <div />}

              <Campo label="NOME DO PACIENTE" value={form.paciente} onChange={setF('paciente')} placeholder="NOME COMPLETO DO PACIENTE" required />
              <CampoSolicitante form={form} setF={setF} />

              <Campo label="Nº DO PRONTUÁRIO" value={form.cross} onChange={setF('cross')} placeholder="EX: 123456" />
              <div />

              <Campo label="TIPO DE SOLICITAÇÃO" value={form.tipoSolicitacao} onChange={setF('tipoSolicitacao')} options={TIPOS} required />
              <Campo label="MOTIVO DA SOLICITAÇÃO" value={form.motivoSolicitacao} onChange={setF('motivoSolicitacao')} options={MOTIVOS} required />

              {form.motivoSolicitacao === 'OUTRO' && (
                <Campo label="ESPECIFICAR MOTIVO" value={form.outroMotivo} onChange={setF('outroMotivo')} placeholder="DESCREVA O MOTIVO DA SOLICITAÇÃO" required span={2} />
              )}
            </div>
          </div>

          <div style={S.card}>
            <p style={S.cardHeader}>CONTROLE DE DATAS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px' }}>
              {isCopia && <>
                <Campo label="ENVIO P/ FSPSS VIA 1DOC" value={form.envioPFSPSS} onChange={setF('envioPFSPSS')} type="date" />
                <Campo label="ENVIO DO FORMULÁRIO ASSINADO PARA FSPSS" value={form.envioFormulario} onChange={setF('envioFormulario')} type="date" />
                <Campo label="ENTREGA DA CÓPIA AO SOLICITANTE" value={form.entregaCopia} onChange={setF('entregaCopia')} type="date" />
              </>}
              {isTransf && <>
                <Campo label="ENVIO P/ FSPSS VIA 1DOC" value={form.envioPFSPSS} onChange={setF('envioPFSPSS')} type="date" />
                <Campo label="ENVIO P/ UNIDADE DE ORIGEM" value={form.envioPUnidadeOrigem} onChange={setF('envioPUnidadeOrigem')} type="date" />
                <Campo label="RECEBIMENTO DO PRONTUÁRIO ORIGINAL E/OU CÓPIA" value={form.recebimentoProntuario} onChange={setF('recebimentoProntuario')} type="date" />
                <Campo label="ENVIO DO FORMULÁRIO ASSINADO PARA FSPSS" value={form.envioFormulario} onChange={setF('envioFormulario')} type="date" />
              </>}
              {!isCopia && !isTransf && (
                <div style={{ gridColumn: 'span 2', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#9CA3AF', textTransform: 'uppercase', padding: '12px 0' }}>
                  SELECIONE O TIPO DE SOLICITAÇÃO PARA EXIBIR OS CAMPOS DE DATA.
                </div>
              )}
            </div>
          </div>

          <div style={S.card}>
            <p style={S.cardHeader}>STATUS E OBSERVAÇÕES</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 20px' }}>
              <Campo label="STATUS DA SOLICITAÇÃO" value={form.status} onChange={setF('status')} options={STATUS_LIST} />
              <div />
              <div style={{ gridColumn: 'span 2' }}>
                <label style={S.label}>OBSERVAÇÕES</label>
                <textarea
                  value={form.observacoes}
                  onChange={e => setF('observacoes')(e.target.value.toUpperCase())}
                  placeholder="INFORMAÇÕES ADICIONAIS..."
                  style={S.textarea}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button onClick={voltar} style={S.btnSecondary}>CANCELAR</button>
            <button
              onClick={salvar}
              disabled={salvando || camposObrigatorios}
              style={{ ...S.btnPrimary, opacity: (salvando || camposObrigatorios) ? 0.45 : 1, cursor: (salvando || camposObrigatorios) ? 'not-allowed' : 'pointer' }}
            >
              {salvando ? 'SALVANDO...' : editId ? 'SALVAR ALTERAÇÕES' : 'REGISTRAR SOLICITAÇÃO'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LISTA ─────────────────────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <div style={S.topbar}>
        <div style={{ flex: 1 }}>
          <div style={S.topbarSub}>FSPSS — LEI COMPLEMENTAR Nº 168/2013</div>
          <div style={S.topbarTitle}>CONTROLE — TRANSFERÊNCIA E CÓPIA DE PRONTUÁRIO</div>
        </div>
        <button
          onClick={() => { setForm(FORM_VAZIO); setEditId(null); setErro(''); setView('form'); }}
          style={S.btnPrimary}
        >
          + NOVA SOLICITAÇÃO
        </button>
      </div>

      <div style={S.body}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <MetricCard label="TOTAL DE REGISTROS" valor={cont.total} accent="#111827"
            onClick={() => setFiltroStatus('TODOS')} ativo={filtroStatus === 'TODOS'} />
          <MetricCard label="PENDENTES" valor={cont.pendente} accent="#F59E0B"
            onClick={() => setFiltroStatus(filtroStatus === 'PENDENTE' ? 'TODOS' : 'PENDENTE')} ativo={filtroStatus === 'PENDENTE'} />
          <MetricCard label="EM ANDAMENTO" valor={cont.andamento} accent="#3B82F6"
            onClick={() => setFiltroStatus(filtroStatus === 'EM ANDAMENTO' ? 'TODOS' : 'EM ANDAMENTO')} ativo={filtroStatus === 'EM ANDAMENTO'} />
          <MetricCard label="CONCLUÍDOS" valor={cont.concluido} accent="#22C55E"
            onClick={() => setFiltroStatus(filtroStatus === 'CONCLUÍDO' ? 'TODOS' : 'CONCLUÍDO')} ativo={filtroStatus === 'CONCLUÍDO'} />
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <input
              type="text"
              placeholder="BUSCAR POR PACIENTE, SOLICITANTE OU UNIDADE..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              style={{ ...S.input, paddingLeft: 36 }}
            />
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#9CA3AF' }}>⌕</span>
          </div>
          <div style={{ position: 'relative', width: 180 }}>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} style={S.select}>
              <option value="TODOS">TODOS OS TIPOS</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: '#6B7280' }}>▼</span>
          </div>
          <div style={{ position: 'relative', width: 200 }}>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={S.select}>
              <option value="TODOS">TODOS OS STATUS</option>
              {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: 10, color: '#6B7280' }}>▼</span>
          </div>
        </div>

        <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', background: '#FFFFFF' }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#9CA3AF', textTransform: 'uppercase' }}>
              CARREGANDO REGISTROS...
            </div>
          ) : filtradas.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#9CA3AF', textTransform: 'uppercase' }}>
                {transferencias.length === 0
                  ? 'NENHUM REGISTRO CADASTRADO. CLIQUE EM "+ NOVA SOLICITAÇÃO" PARA INICIAR.'
                  : 'NENHUM RESULTADO PARA OS FILTROS APLICADOS.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '14%' }} />
                  <col style={{ width: '11%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '5%' }} />
                </colgroup>
                <thead>
                  <tr>
                    {['UNIDADE', 'SOLICITANTE', 'PACIENTE', 'TIPO', 'MOTIVO', 'ENVIO FSPSS', 'STATUS', ''].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((t) => (
                    <tr
                      key={t.id}
                      style={{ background: '#FFFFFF', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                      onMouseLeave={e => (e.currentTarget.style.background = '#FFFFFF')}
                      onClick={() => abrirDetalhes(t)}
                    >
                      <td style={S.td}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
                          {t.unidadeSolicitante === 'OUTRO' && t.outroUnidade ? t.outroUnidade : (t.unidadeSolicitante || '—')}
                        </div>
                      </td>
                      <td style={S.td}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11 }}>
                          {t.solicitante || '—'}
                        </div>
                        {t.solicitanteEhPaciente && (
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#166534', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            PRÓPRIO PACIENTE
                          </div>
                        )}
                      </td>
                      <td style={S.td}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 }}>
                          {t.paciente || '—'}
                        </div>
                        {t.cross && (
                          <div style={{ fontSize: 10, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            Nº {t.cross}
                          </div>
                        )}
                      </td>
                      <td style={S.td}>
                        <span style={{
                          fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                          background: t.tipoSolicitacao === 'CÓPIA' ? '#F5F3FF' : '#EFF6FF',
                          color: t.tipoSolicitacao === 'CÓPIA' ? '#6D28D9' : '#1E40AF',
                          border: `1px solid ${t.tipoSolicitacao === 'CÓPIA' ? '#DDD6FE' : '#BFDBFE'}`,
                          padding: '2px 8px', borderRadius: 3, whiteSpace: 'nowrap',
                        }}>
                          {t.tipoSolicitacao || '—'}
                        </span>
                      </td>
                      <td style={{ ...S.td, fontSize: 11 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {t.motivoSolicitacao === 'OUTRO' && t.outroMotivo ? t.outroMotivo : (t.motivoSolicitacao || '—')}
                        </div>
                      </td>
                      <td style={{ ...S.td, fontSize: 11 }}>{fmtData(t.envioPFSPSS)}</td>
                      <td style={S.td}><StatusBadge status={t.status} /></td>
                      <td style={{ ...S.td, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => abrirEdicao(t)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#6B7280', padding: 4 }}
                          title="EDITAR"
                        >
                          ✎
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>
            {filtradas.length} REGISTRO{filtradas.length !== 1 ? 'S' : ''} EXIBIDO{filtradas.length !== 1 ? 'S' : ''}
            {(busca || filtroTipo !== 'TODOS' || filtroStatus !== 'TODOS') ? ` DE ${transferencias.length} TOTAL` : ''}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9CA3AF' }}>
            CONTROLE — TRANSFERÊNCIA E CÓPIA DE PRONTUÁRIO
          </div>
        </div>
      </div>
    </div>
  );
}