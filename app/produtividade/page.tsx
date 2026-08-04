'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Printer, CalendarDays, User, Trash2, Edit, Save, X } from 'lucide-react';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import { db } from '../../db'; // Ajuste o caminho do seu arquivo db aqui se necessário

// IMPORTAÇÃO DOS TEMPLATES EM BASE64 (Ajuste o caminho relativo conforme sua estrutura de pastas)
import { TEMPLATE_NORMAL_B64, TEMPLATE_MEDICO_B64 } from '../../public/templates/docxBase64';

interface Profissional {
  id?: number;
  nome: string;
  matricula: string;
  vinculo: string;
  unidade: string;
  cargo: string;
  cargaHoraria: string;
  tipoTemplate?: string;
}

// Função utilitária para transformar Base64 em ArrayBuffer puro no navegador
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export default function RelatorioProdutividade() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalMesAberto, setModalMesAberto] = useState(false);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<Profissional | null>(null);
  const [mesEscolhido, setMesEscolhido] = useState('');

  const [form, setForm] = useState<Profissional>({
    nome: '', matricula: '', vinculo: 'CLT', unidade: '', cargo: 'ENFERMEIRO', cargaHoraria: '40H'
  });

  // Carregar dados do Dexie ao iniciar
  useEffect(() => {
    async function carregarDados() {
      try {
        // Apontando para a nova tabela exclusiva
        const dadosDB = await db.table('profissionais_produtividade').toArray();
        setProfissionais(dadosDB);
      } catch (error) {
        console.error("Erro ao carregar profissionais do banco:", error);
      }

      const unidadePadrao = localStorage.getItem('fspss_unidade_padrao');
      if (unidadePadrao) setForm(prev => ({ ...prev, unidade: unidadePadrao.toUpperCase() }));
    }
    carregarDados();
  }, []);

  const atualizarListaDaTela = async () => {
    // Apontando para a nova tabela exclusiva
    const listaAtualizada = await db.table('profissionais_produtividade').toArray();
    setProfissionais(listaAtualizada);
  };

  const handleSalvarProfissional = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.id) {
        // Apontando para a nova tabela exclusiva
        await db.table('profissionais_produtividade').put({
          ...form,
          id: Number(form.id)
        });
      } else {
        // Apontando para a nova tabela exclusiva
        await db.table('profissionais_produtividade').add({
          nome: form.nome,
          matricula: form.matricula,
          vinculo: form.vinculo,
          unidade: form.unidade,
          cargo: form.cargo,
          cargaHoraria: form.cargaHoraria
        });
      }
      
      await atualizarListaDaTela();
      setModalAberto(false);
      resetForm();
    } catch (error) {
      console.error("Erro ao salvar no banco:", error);
      alert("Não foi possível salvar os dados no banco.");
    }
  };

  const handleExcluir = async (id?: number) => {
    if (!id) return;
    if (confirm('Tem certeza que deseja remover este profissional do banco de dados?')) {
      try {
        // Apontando para a nova tabela exclusiva
        await db.table('profissionais_produtividade').delete(id);
        await atualizarListaDaTela();
      } catch (error) {
        console.error("Erro ao deletar:", error);
        alert("Erro ao excluir do banco de dados.");
      }
    }
  };

  const resetForm = () => {
    const unidadePadrao = localStorage.getItem('fspss_unidade_padrao') || '';
    setForm({ 
      nome: '', 
      matricula: '', 
      vinculo: 'CLT', 
      unidade: unidadePadrao.toUpperCase(), 
      cargo: 'ENFERMEIRO', 
      cargaHoraria: '40H' 
    });
  };

  const abrirModalEditar = (p: Profissional) => {
    setForm({
      ...p,
      cargo: p.cargo || 'ENFERMEIRO',
      vinculo: p.vinculo || 'CLT',
      cargaHoraria: p.cargaHoraria || '40H'
    });
    setModalAberto(true);
  };

  const calcularPeriodo = (dataIso?: string) => {
    const data = dataIso ? new Date(dataIso + '-01T12:00:00') : new Date();
    const mes = data.getMonth() + 1;
    const ano = data.getFullYear();
    const ultimoDia = new Date(ano, mes, 0).getDate();
    const mesFormatado = String(mes).padStart(2, '0');
    return `01 a ${ultimoDia}/${mesFormatado}/${ano}`;
  };

  // FUNÇÃO DE IMPRESSÃO 100% OFFLINE VIA BASE64
  const dispararImpressao = async (p: Profissional, dataIso?: string) => {
    try {
      const isMedico = p.cargo.toUpperCase() === 'MÉDICO' || p.tipoTemplate === 'medico';
      
      const stringBase64 = isMedico ? TEMPLATE_MEDICO_B64 : TEMPLATE_NORMAL_B64;
      
      if (!stringBase64 || stringBase64.trim() === '') {
        throw new Error("O conteúdo Base64 do template está vazio ou inválido.");
      }

      const arrayBuffer = base64ToArrayBuffer(stringBase64);
      const periodoCalculado = calcularPeriodo(dataIso);

      const zip = new PizZip(arrayBuffer);
      let xml = zip.files['word/document.xml'].asText();

      const substituicoes: Record<string, string> = {
        '{{NOME}}': p.nome.toUpperCase(),
        '{{MATRICULA}}': p.matricula.toUpperCase(),
        '{{VINCULO}}': p.vinculo.toUpperCase(),
        '{{PERIODO}}': periodoCalculado,
        '{{UNIDADE}}': p.unidade.toUpperCase(),
        '{{CARGO}}': p.cargo.toUpperCase(),
        '{{CARGA_HORARIA}}': p.cargaHoraria.toUpperCase(),
      };

      for (const [marcador, valor] of Object.entries(substituicoes)) {
        xml = xml.replaceAll(marcador, valor);
      }

      zip.file('word/document.xml', xml);

      const blob = zip.generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const nomeArquivo = `Produtividade_${p.nome.replace(/\s+/g, '_')}_${periodoCalculado.replace(/\//g, '-')}.docx`;
      saveAs(blob, nomeArquivo);

      setModalMesAberto(false);
    } catch (error) {
      console.error('Erro ao gerar docx:', error);
      alert(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* CABEÇALHO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4">
          <div>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">Recursos Humanos</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Gerador de Produtividade</h1>
            <p className="text-xs text-slate-500 mt-1">Cadastre a equipe uma vez e gere os relatórios mensais automaticamente.</p>
          </div>
          <button
            onClick={() => { resetForm(); setModalAberto(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Adicionar Profissional
          </button>
        </div>

        {/* LISTA */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] font-black tracking-wider border-b border-slate-200">
                  <th className="p-4">Nome do Profissional</th>
                  <th className="p-4 hidden sm:table-cell">Cargo / Matrícula</th>
                  <th className="p-4 hidden md:table-cell">Vínculo / Horas</th>
                  <th className="p-4 text-center">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {profissionais.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                      NENHUM PROFISSIONAL CADASTRADO NO BANCO DE DADOS.<br />
                      <span className="text-[10px] font-normal">Clique no botão azul acima para começar.</span>
                    </td>
                  </tr>
                ) : (
                  profissionais.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-bold uppercase text-slate-900">
                        {p.nome}
                        <span className="block text-[10px] font-normal text-slate-500 sm:hidden mt-0.5">
                          {p.cargo} | {p.matricula}
                        </span>
                      </td>
                      <td className="p-4 hidden sm:table-cell font-medium uppercase text-slate-700">
                        {p.cargo} 
                        <span className="block text-[10px] text-slate-400 mt-0.5">Mat: {p.matricula}</span>
                      </td>
                      <td className="p-4 hidden md:table-cell font-medium uppercase text-slate-700">
                        {p.vinculo} <span className="block text-[10px] text-slate-400 mt-0.5">{p.cargaHoraria}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => dispararImpressao(p)}
                            title="Gerar Mês Atual"
                            className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 p-2 rounded-lg transition-colors flex items-center gap-1.5 font-bold uppercase text-[10px]"
                          >
                            <Printer size={14} /> <span className="hidden xl:inline">Mês Atual</span>
                          </button>

                          <button
                            onClick={() => { setProfissionalSelecionado(p); setMesEscolhido(''); setModalMesAberto(true); }}
                            title="Escolher Mês Específico"
                            className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 p-2 rounded-lg transition-colors flex items-center gap-1.5 font-bold uppercase text-[10px]"
                          >
                            <CalendarDays size={14} /> <span className="hidden xl:inline">Outro Mês</span>
                          </button>

                          <div className="w-px h-6 bg-slate-200 mx-1"></div>

                          <button onClick={() => abrirModalEditar(p)} className="text-slate-400 hover:text-blue-600 p-2 transition-colors">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleExcluir(p.id)} className="text-slate-400 hover:text-rose-600 p-2 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL CADASTRAR / EDITAR */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <User size={18} className="text-blue-600" />
                {form.id ? 'Editar Profissional' : 'Novo Profissional'}
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>

            <form onSubmit={handleSalvarProfissional} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Nome Completo</label>
                <input required type="text" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase font-bold text-slate-900 focus:outline-none focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Matrícula</label>
                  <input required type="text" value={form.matricula} onChange={e => setForm({ ...form, matricula: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase font-bold text-slate-900 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Vínculo</label>
                  <select 
                    required 
                    value={form.vinculo} 
                    onChange={e => setForm({ ...form, vinculo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase font-bold text-slate-900 focus:outline-none focus:border-blue-500 bg-white h-[38px]"
                  >
                    <option value="CLT">CLT</option>
                    <option value="ESTATUTÁRIO">ESTATUTÁRIO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Cargo</label>
                  <select 
                    required 
                    value={form.cargo} 
                    onChange={e => setForm({ ...form, cargo: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase font-bold text-slate-900 focus:outline-none focus:border-blue-500 bg-white h-[38px]"
                  >
                    <option value="ENFERMEIRO">ENFERMEIRO</option>
                    <option value="MÉDICO">MÉDICO</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Carga Horária</label>
                  <select 
                    required 
                    value={form.cargaHoraria} 
                    onChange={e => setForm({ ...form, cargaHoraria: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase font-bold text-slate-900 focus:outline-none focus:border-blue-500 bg-white h-[38px]"
                  >
                    <option value="20H">20H</option>
                    <option value="40H">40H</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Unidade de Saúde</label>
                <input required type="text" value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase font-bold text-slate-900 focus:outline-none focus:border-blue-500 bg-slate-50" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setModalAberto(false)} className="px-5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg uppercase">Cancelar</button>
                <button type="submit" className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg uppercase flex items-center gap-2 shadow-sm">
                  <Save size={16} /> Salvar Profissional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ESCOLHER MÊS */}
      {modalMesAberto && profissionalSelecionado && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-slate-100 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h2 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <CalendarDays size={18} className="text-blue-600" />
                Selecione o Mês
              </h2>
              <button onClick={() => setModalMesAberto(false)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Gerando relatório para: <strong className="text-slate-900 uppercase">{profissionalSelecionado.nome}</strong>
              </p>

              <div>
                <label className="block text-[10px] font-black uppercase text-slate-500 mb-1.5">Mês e Ano Referência</label>
                <input type="month" value={mesEscolhido} onChange={e => setMesEscolhido(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500" />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => dispararImpressao(profissionalSelecionado, mesEscolhido)}
                  disabled={!mesEscolhido}
                  className="w-full px-5 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-lg uppercase flex items-center justify-center gap-2 shadow-sm transition-colors"
                >
                  <Printer size={16} /> Gerar e Baixar .docx
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}