'use client';

import React, { useState, useRef } from 'react';
import { db } from '../../db'; 
import { useLiveQuery } from 'dexie-react-hooks';
import { PlusCircle, Trash2, ArrowLeft, UserCheck, Search, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function Exames() {
  const [formData, setFormData] = useState({
    cross: '',
    nome: '',
    dataNasc: '',
    telefone: '',
    exame: ''
  });
  
  const [showSugestao, setShowSugestao] = useState(false);
  const [sugestao, setSugestao] = useState<any>(null);
  
  // Estados para Filtro e Paginação
  const [filtroPesquisa, setFiltroPesquisa] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  // Referências para a esteira de foco por teclado
  const crossRef = useRef<HTMLInputElement>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const dataNascRef = useRef<HTMLInputElement>(null);
  const telefoneRef = useRef<HTMLInputElement>(null);
  const examenRef = useRef<HTMLInputElement>(null);
  const btnSugestaoRef = useRef<HTMLButtonElement>(null);

  // Consulta Unificada com Join dinâmico
  const examesComPacientes = useLiveQuery(async () => {
    const examesLista = await (db as any).exames.reverse().toArray();
    
    const listaCompleta = await Promise.all(
      examesLista.map(async (exameReg: any) => {
        let paciente = await (db as any).pacientes.get(exameReg.cross);
        
        if (!paciente) {
          paciente = await (db as any).encaminhamentos.where('cross').equals(exameReg.cross).first();
        }

        return {
          ...exameReg,
          nome: paciente ? paciente.nome : 'PACIENTE NÃO ENCONTRADO',
          dataNasc: paciente ? paciente.dataNasc : '',
          telefone: paciente ? paciente.telefone : ''
        };
      })
    );
    return listaCompleta;
  }) || [];

  // Filtragem
  const examesFiltrados = examesComPacientes.filter((item: any) => {
    const termo = filtroPesquisa.toUpperCase();
    return (
      (item.nome && item.nome.toUpperCase().includes(termo)) ||
      (item.cross && item.cross.toUpperCase().includes(termo)) ||
      (item.exame && item.exame.toUpperCase().includes(termo))
    );
  });

  // Paginação
  const totalItens = examesFiltrados.length;
  const totalPaginas = Math.ceil(totalItens / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const examesPaginados = examesFiltrados.slice(indiceInicial, indiceInicial + itensPorPagina);

  // Máscaras
  const aplicarMascaraData = (valor: string) => {
    const v = valor.replace(/\D/g, '').slice(0, 8);
    if (v.length >= 5) return `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    if (v.length >= 3) return `${v.slice(0, 2)}/${v.slice(2)}`;
    return v;
  };

  const aplicarMascaraTelefone = (valor: string) => {
    const v = valor.replace(/\D/g, '').slice(0, 11);
    if (v.length > 6) return `\(${v.slice(0, 2)}\) ${v.slice(2, 7)}-${v.slice(7)}`;
    if (v.length > 2) return `\(${v.slice(0, 2)}\) ${v.slice(2)}`;
    return v;
  };

  const pularAoApertarEnter = (e: React.KeyboardEvent, proximoRef: React.RefObject<HTMLInputElement | null>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      proximoRef.current?.focus();
    }
  };

  // Busca do Cadastro Centralizado
  const verificarCross = async (valor: string) => {
    const valorMaiusculo = valor.toUpperCase();
    setFormData(prev => ({...prev, cross: valorMaiusculo}));

    if (valorMaiusculo.length > 2) {
      let pacienteExistente = await (db as any).pacientes.get(valorMaiusculo);
      
      if (!pacienteExistente) {
        pacienteExistente = await (db as any).encaminhamentos.where('cross').equals(valorMaiusculo).first();
      }

      if (pacienteExistente) {
        setSugestao(pacienteExistente);
        setShowSugestao(true);
        setTimeout(() => btnSugestaoRef.current?.focus(), 50);
      } else {
        setShowSugestao(false);
      }
    }
  };

  const aceitarSugestao = () => {
    setFormData({
      cross: (sugestao.cross || '').toUpperCase(),
      nome: (sugestao.nome || '').toUpperCase(),
      dataNasc: sugestao.dataNasc || '',
      telefone: (sugestao.telefone || '').toUpperCase(),
      exame: ''
    });
    setShowSugestao(false);
    setTimeout(() => examenRef.current?.focus(), 50);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cross || !formData.nome || !formData.exame) {
      return alert("Preencha Nº CROSS, Nome e o Exame!");
    }

    try {
      const dataHoje = new Date().toLocaleDateString('pt-BR');

      // 1. Atualiza ou cria cadastro central
      await (db as any).pacientes.put({
        cross: formData.cross.toUpperCase(),
        nome: formData.nome.toUpperCase(),
        dataNasc: formData.dataNasc,
        telefone: formData.telefone.toUpperCase()
      });

      // 2. Já salva o exame com status 'Recebido' e data de chegada preenchida
      await (db as any).exames.add({
        cross: formData.cross.toUpperCase(),
        exame: formData.exame.toUpperCase(),
        status: 'Recebido',
        dataRegistro: dataHoje,
        dataChegada: dataHoje
      });

      // Reseta e foca no primeiro input para agilizar a fila (CORRIGIDO AQUI)
      setFormData({ cross: '', nome: '', dataNasc: '', telefone: '', exame: '' });
      setShowSugestao(false);
      setSugestao(null);
      setPaginaAtual(1);
      crossRef.current?.focus();

    } catch (error) {
      console.error("Erro ao salvar exame recebido:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 text-black selection:bg-blue-200">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center text-blue-600 hover:underline font-bold transition-all">
            <ArrowLeft size={20} className="mr-1" /> VOLTAR
          </Link>
          <h1 className="text-xl font-black text-blue-950 uppercase tracking-tight">FSPSS — Entrada de Exames Recebidos</h1>
        </div>

        {/* Alerta de Importação */}
        {showSugestao && (
          <div className="bg-blue-600 text-white p-4 rounded-xl mb-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center">
              <UserCheck className="mr-3" />
              <span>Paciente localizado no cadastro central: <strong className="underline">{sugestao.nome}</strong>. Deseja importar o cadastro?</span>
            </div>
            <div className="flex gap-2">
              <button ref={btnSugestaoRef} onClick={aceitarSugestao} className="bg-white text-blue-600 px-5 py-2 rounded-lg font-black hover:bg-gray-100 transition-all shadow text-xs uppercase">
                [ENTER] SIM
              </button>
              <button onClick={() => { setShowSugestao(false); nomeRef.current?.focus(); }} className="bg-blue-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-900 transition-all text-xs uppercase">
                NÃO
              </button>
            </div>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end">
          <div className="w-44">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nº CROSS</label>
            <input 
              ref={crossRef} 
              type="text" 
              className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-1 text-black font-black uppercase transition-all" 
              value={formData.cross} 
              onChange={(e) => verificarCross(e.target.value)} 
              onKeyDown={(e) => pularAoApertarEnter(e, nomeRef)} 
              placeholder="000.000" 
              required 
              autoFocus
            />
          </div>

          <div className="flex-1 min-w-[280px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nome Completo</label>
            <input 
              ref={nomeRef} 
              type="text" 
              className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-1 text-black font-bold uppercase transition-all" 
              value={formData.nome} 
              onChange={(e) => setFormData({...formData, nome: e.target.value.toUpperCase()})} 
              onKeyDown={(e) => pularAoApertarEnter(e, dataNascRef)} 
              placeholder="NOME DO PACIENTE" 
              required 
            />
          </div>

          <div className="w-36">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Data Nasc.</label>
            <input 
              ref={dataNascRef}
              type="text" 
              maxLength={10}
              className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-1 text-black font-bold transition-all" 
              value={formData.dataNasc} 
              onChange={(e) => setFormData({...formData, dataNasc: aplicarMascaraData(e.target.value)})} 
              onKeyDown={(e) => pularAoApertarEnter(e, telefoneRef)} 
              placeholder="DD/MM/AAAA" 
            />
          </div>

          <div className="w-40">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Telefone</label>
            <input 
              ref={telefoneRef}
              type="text" 
              maxLength={15}
              className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-1 text-black font-bold transition-all" 
              value={formData.telefone} 
              onChange={(e) => setFormData({...formData, telefone: aplicarMascaraTelefone(e.target.value)})} 
              onKeyDown={(e) => pularAoApertarEnter(e, examenRef)} 
              placeholder="(12) 99999-0000" 
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Exame Recebido</label>
            <input 
              ref={examenRef} 
              type="text" 
              className="w-full border-b-2 border-gray-200 focus:border-blue-600 outline-none py-1 text-black font-black uppercase transition-all" 
              value={formData.exame} 
              onChange={(e) => setFormData({...formData, exame: e.target.value.toUpperCase()})} 
              placeholder="Ex: ELETROCARDIOGRAMA" 
              required
            />
          </div>

          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 font-black transition-all flex items-center shrink-0 uppercase tracking-wide text-xs">
            <PlusCircle size={16} className="mr-2" /> Dar Entrada [Enter]
          </button>
        </form>

        {/* Histórico */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-1.5 w-full max-w-sm shadow-sm">
              <Search size={16} className="text-gray-400 mr-2" />
              <input 
                type="text"
                placeholder="Pesquisar exames arquivados..."
                value={filtroPesquisa}
                onChange={(e) => { setFiltroPesquisa(e.target.value); setPaginaAtual(1); }}
                className="outline-none text-xs bg-transparent w-full text-black placeholder-gray-400 font-medium"
              />
            </div>
            <div className="text-xs font-bold text-gray-500 uppercase">
              Total de Exames no Arquivo: <span className="text-blue-600 font-black">{totalItens}</span>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-gray-800 text-white uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-3">Data de Entrada</th>
                <th className="p-3">CROSS</th>
                <th className="p-3">Paciente</th>
                <th className="p-3">Nascimento</th>
                <th className="p-3">Exame</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {examesPaginados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-gray-400 font-bold uppercase">Nenhum exame no arquivo.</td>
                </tr>
              ) : (
                examesPaginados.map((reg: any) => (
                  <tr key={reg.id} className="hover:bg-blue-50/60 border-b border-gray-100 transition-colors">
                    <td className="p-3 text-gray-600 font-bold">{reg.dataChegada}</td>
                    <td className="p-3 font-black text-blue-700 uppercase">{reg.cross}</td>
                    <td className="p-3 font-bold text-gray-900 uppercase">
                      <div>{reg.nome}</div>
                      {reg.telefone && <div className="text-[10px] text-gray-400 font-normal">{reg.telefone}</div>}
                    </td>
                    <td className="p-3 text-gray-700 font-medium">{reg.dataNasc}</td>
                    <td className="p-3 font-extrabold text-slate-700 uppercase">{reg.exame}</td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-800">
                        <CheckCircle size={12} className="mr-1" /> Recebido
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button 
                        onClick={() => { if(confirm("Deseja deletar este registro de exame?")) (db as any).exames.delete(reg.id); }}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Paginação */}
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase">Página {paginaAtual} de {totalPaginas}</span>
            <div className="flex gap-1">
              <button 
                onClick={() => setPaginaAtual(p => Math.max(p - 1, 1))} 
                disabled={paginaAtual === 1}
                className="p-1 rounded border bg-white disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setPaginaAtual(p => Math.min(p + 1, totalPaginas))} 
                disabled={paginaAtual === totalPaginas}
                className="p-1 rounded border bg-white disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}