'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Phone, Save, Edit2, Info } from 'lucide-react';

export default function ConfiguracaoInicial() {
  const [aberto, setAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [unidade, setUnidade] = useState('');
  const [telefone, setTelefone] = useState('');

  const formatarTelefone = (value: string) => {
    let numbers = value.replace(/\D/g, '');
    if (numbers.length > 11) numbers = numbers.substring(0, 11);
    if (numbers.length > 6) return numbers.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
    else if (numbers.length > 2) return numbers.replace(/(\d{2})(\d{0,4})/, '($1) $2');
    else if (numbers.length > 0) return numbers.replace(/(\d{0,2})/, '($1');
    return numbers;
  };

  useEffect(() => {
    const u = localStorage.getItem('fspss_unidade_padrao') || '';
    const t = localStorage.getItem('fspss_telefone_padrao') || '';

    setUnidade(u);
    setTelefone(t);

    if (!u.trim()) {
      setModoEdicao(true);
      setAberto(true);
    } else {
      setAberto(false);
    }
    setIsReady(true);
  }, []);

  const salvarConfiguracoes = () => {
    if (!unidade.trim()) {
      alert('Por favor, preencha a Unidade.');
      return;
    }

    localStorage.setItem('fspss_unidade_padrao', unidade.trim().toUpperCase());
    localStorage.setItem('fspss_telefone_padrao', telefone.trim());

    setModoEdicao(false);
    setAberto(false);
  };

  if (!isReady || !aberto) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* HEADER */}
        <div className="border-b px-6 py-5 bg-gray-50">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            Sistema FSPSS
          </span>
          <h2 className="text-xl font-black text-gray-900 uppercase mt-1">
            {modoEdicao ? 'Configuração Inicial' : 'Confirmar Dados'}
          </h2>
        </div>

        {/* CONTEÚDO */}
        <div className="p-6">
          {!modoEdicao ? (
            /* MODO VISUALIZAÇÃO */
            <div className="space-y-4">
              <div className="border rounded-xl p-4 bg-gray-50 space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Building2 size={16} className="text-gray-400" />
                  <div>
                    <span className="text-[9px] text-gray-400 font-black uppercase block">Unidade</span>
                    <p className="text-black font-bold">{unidade}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-gray-400" />
                  <div>
                    <span className="text-[9px] text-gray-400 font-black uppercase block">Telefone</span>
                    <p className="text-black font-bold">{telefone || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setModoEdicao(true)} className="flex-1 border text-black rounded-xl py-3 text-xs font-black uppercase flex items-center justify-center gap-2">
                  <Edit2 size={14} /> Editar
                </button>
                <button onClick={() => setAberto(false)} className="flex-1 bg-blue-600 text-white rounded-xl py-3 text-xs font-black uppercase">
                  Continuar
                </button>
              </div>
            </div>
          ) : (
            /* MODO EDIÇÃO */
            <div className="space-y-3">
              <input
                value={unidade}
                onChange={(e) => setUnidade(e.target.value.toUpperCase())}
                placeholder="Unidade (Ex: UBS CENTRO)"
                className="w-full px-4 py-3 border rounded-xl text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none uppercase"
              />
              <input
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                placeholder="Telefone (XX) XXXXX-XXXX"
                className="w-full px-4 py-3 border rounded-xl text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none"
              />

              <button onClick={salvarConfiguracoes} className="w-full bg-blue-600 text-white rounded-xl py-3 mt-2 text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-700 transition">
                <Save size={14} /> Salvar e continuar
              </button>
            </div>
          )}

          {/* DICA */}
          <div className="mt-5 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
            <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <p className="text-[13px] text-blue-900 leading-relaxed font-medium">
              <strong>Dica:</strong> Recomendamos acessar a aba <strong className="font-bold">Manual & FAQ</strong> no menu lateral para tirar suas dúvidas iniciais e aprender como utilizar o sistema com mais agilidade.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}