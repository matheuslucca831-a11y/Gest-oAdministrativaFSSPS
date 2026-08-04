'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase-client';
import { Lock, Download, FileText, LogOut, Loader2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function ArquivosPrivados() {
  const [carregandoSessao, setCarregandoSessao] = useState(true);
  const [logado, setLogado] = useState(false);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erroLogin, setErroLogin] = useState('');
  const [entrando, setEntrando] = useState(false);

  const [arquivos, setArquivos] = useState<{ id: number; titulo: string; arquivo: string }[]>([]);
  const [carregandoArquivos, setCarregandoArquivos] = useState(false);

  useEffect(() => {
    const verificarSessao = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setLogado(true);
        carregarArquivos();
      }
      setCarregandoSessao(false);
    };
    verificarSessao();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEntrando(true);
    setErroLogin('');

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErroLogin('E-mail ou senha incorretos.');
      setEntrando(false);
      setTimeout(() => setErroLogin(''), 3000);
      return;
    }

    setLogado(true);
    setEntrando(false);
    carregarArquivos();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLogado(false);
    setArquivos([]);
    setEmail('');
    setSenha('');
  };

  // 1. Carrega apenas os metadados (rápido e leve)
  const carregarArquivos = async () => {
    setCarregandoArquivos(true);
    try {
      const { data: registros, error } = await supabase
        .from('arquivos_privados')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;
      setArquivos(registros || []); // Guarda apenas os dados do banco
    } catch (err) {
      console.error('Erro ao carregar arquivos privados:', err);
    } finally {
      setCarregandoArquivos(false);
    }
  };

  // 2. Nova função: Gera o link de 5 min SÓ QUANDO CLICAR
  const handleBaixarArquivo = async (caminhoArquivo: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('arquivos-privados')
        .createSignedUrl(caminhoArquivo, 300);

      if (error) throw error;
      
      if (data?.signedUrl) {
        // Abre o link temporário em uma nova aba para iniciar o download
        window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      alert('Erro ao gerar link de download. Tente novamente.');
      console.error(err);
    }
  };
  if (carregandoSessao) return null;

  // ─── TELA DE LOGIN ───────────────────────────────────────────────────────
  if (!logado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm w-full max-w-sm space-y-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
              <Lock size={24} />
            </div>
            <h2 className="text-gray-900 text-sm font-black uppercase tracking-wider">Arquivos Impressos Privados</h2>
            <p className="text-xs text-gray-500">Entre com seu e-mail e senha pessoal para ver seus arquivos.</p>
          </div>

          <div className="space-y-2">
            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <input
              type="password"
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
            />
            {erroLogin && <p className="text-[10px] text-red-500 font-bold text-center uppercase">{erroLogin}</p>}
          </div>

          <button
            type="submit"
            disabled={entrando}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-60"
          >
            {entrando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    );
  }

  // ─── TELA COM OS ARQUIVOS ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">

        <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div>
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Meus Arquivos Privados</h1>
            <p className="text-xs text-gray-500 mt-1">Documentos enviados especificamente para você.</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
          {carregandoArquivos ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-400" /></div>
          ) : arquivos.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold uppercase text-xs">
              Nenhum arquivo privado disponível para você no momento.
            </div>
          ) : (
            arquivos.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-blue-50/40 transition-colors">
                <div className="flex items-center gap-4 min-w-0 pr-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide truncate">
                    {item.titulo}
                  </h3>
                </div>

		<button
  			onClick={() => handleBaixarArquivo(item.arquivo)}
  			className="bg-blue-50 border border-blue-200 hover:bg-blue-600 text-blue-700 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase 			tracking-wider flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
		>
 			<Download size={14} /> Baixar
		</button>
              </div>
            ))
          )}
        </div>

        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          🔒 Cada link de download é temporário e expira em poucos minutos por segurança.
        </p>
      </div>
    </div>
  );
}