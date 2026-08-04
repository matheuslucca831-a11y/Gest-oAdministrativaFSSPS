'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase-client';
import { sincronizarTudo } from '../utils/supabase-sync';
import { UploadCloud, Loader2, CheckCircle, AlertCircle, X, LogOut, WifiOff } from 'lucide-react';

export default function Sincronizar() {
  const [isOpen, setIsOpen] = useState(false);
  const [lembrarUnidade, setLembrarUnidade] = useState(false);
  const [fechandoOApp, setFechandoOApp] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    const emailSalvo = localStorage.getItem('fspss_unidade_lembrada');
    if (emailSalvo) {
      setEmail(emailSalvo);
      setLembrarUnidade(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleTentouFechar = () => {
      setFechandoOApp(true);
      setIsOpen(true);
    };
    window.addEventListener('tentou-fechar-app', handleTentouFechar);
    return () => window.removeEventListener('tentou-fechar-app', handleTentouFechar);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleBackup = async () => {
    if (!email || !senha) {
      setStatus('error');
      setMensagem('Digite o email e a senha.');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('loading');
    setMensagem('Verificando acesso...');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw new Error('Credenciais inválidas.');

      const prefixoEmail = email.split('@')[0];
      localStorage.setItem('fspss_unidade_ativa', prefixoEmail);

      if (lembrarUnidade) {
        localStorage.setItem('fspss_unidade_lembrada', email);
      } else {
        localStorage.removeItem('fspss_unidade_lembrada');
      }

      setMensagem('Sincronizando dados...');
      await sincronizarTudo();

      setStatus('success');
      setMensagem('Backup realizado com sucesso!');

      setTimeout(() => {
        setStatus('idle');
        setIsOpen(false);
        setSenha('');

        if (fechandoOApp) {
          const win = window as any;
          if (win.electronAPI?.fecharApp) {
            win.electronAPI.fecharApp();
          } else {
            alert('Backup feito! Feche no X novamente.');
            setFechandoOApp(false);
          }
        }
      }, 2000);

    } catch (err: any) {
      setStatus('error');
      setMensagem(err.message || 'Erro ao conectar.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setFechandoOApp(false);
          setIsOpen(true);
        }}
        className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 hover:text-green-400 transition-all text-xs font-bold border border-gray-700"
      >
        <UploadCloud size={16} />
        <span>Fazer Backup</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xl space-y-4 relative w-full max-w-sm">

            {!fechandoOApp && (
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900"
              >
                <X size={18} />
              </button>
            )}

            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase flex items-center gap-1.5">
                {fechandoOApp ? (
                  <><LogOut size={16} className="text-red-600" /> Faça o Backup antes de Sair</>
                ) : (
                  'Backup de Dados'
                )}
              </h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                {fechandoOApp ? 'Seus dados precisam ser enviados à nuvem.' : 'Enviar dados para a nuvem'}
              </p>
            </div>

            {isOffline ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
                <WifiOff className="mx-auto text-amber-600 animate-bounce" size={32} />
                <p className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  Sem conexão com a internet
                </p>
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  Verifique o cabo de rede ou o Wi-Fi do posto.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email da Unidade"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-emerald-500 outline-none"
                />

                <input
                  type="password"
                  placeholder="Senha da Unidade"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleBackup(); }}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-emerald-500 outline-none"
                />

                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={lembrarUnidade}
                    onChange={(e) => setLembrarUnidade(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-gray-600 select-none">
                    Lembrar meu email
                  </span>
                </label>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleBackup}
                disabled={status === 'loading' || isOffline}
                className={`w-full flex items-center justify-center gap-2 p-2.5 rounded-lg text-xs font-bold transition-all ${
                  isOffline ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                  status === 'success' ? 'bg-emerald-600 text-white' :
                  status === 'error' ? 'bg-red-600 text-white' :
                  'bg-gray-900 text-white hover:bg-black'
                }`}
              >
                {status === 'loading' ? <Loader2 size={16} className="animate-spin" /> :
                 status === 'success' ? <CheckCircle size={16} /> :
                 status === 'error' ? <AlertCircle size={16} /> :
                 <UploadCloud size={16} />}

                {status === 'loading' ? 'Processando...' :
                 status === 'success' ? 'Concluído!' :
                 status === 'error' ? 'Erro!' :
                 isOffline ? 'Conexão Necessária' :
                 fechandoOApp ? 'Fazer Backup e Sair' : 'Iniciar Backup'}
              </button>

              {fechandoOApp && status !== 'loading' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setFechandoOApp(false);
                    }}
                    className="w-full text-center py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100"
                  >
                    Cancelar e Continuar no Sistema
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const win = window as any;
                      if (win.electronAPI?.fecharApp) {
                        win.electronAPI.fecharApp();
                      }
                    }}
                    className="w-full text-center py-2 text-xs font-bold text-red-500 hover:text-red-700 transition-colors"
                  >
                    Fechar sem fazer backup
                  </button>
                </>
              )}
            </div>

            {mensagem && (
              <p className={`text-[10px] text-center font-bold ${status === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {mensagem}
              </p>
            )}

          </div>
        </div>
      )}
    </>
  );
}