import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ezqmhnmjlrhwljozysaq.supabase.co';
// Substitua pela sua anon key completa
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6cW1obm1qbHJod2xqb3p5c2FxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NDMxMzQsImV4cCI6MjA5NjAxOTEzNH0.egPosHPSJvAKH_iddTRfrgk1pVOJFteWHHUjQ-lDal4'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Login({ onLoginSuccess }: { onLoginSuccess: (unidade: string) => void }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Lembrar apenas o e-mail por motivos de segurança física no posto de saúde
  useEffect(() => {
    const emailSalvo = localStorage.getItem('fspss_lembrar_email');
    if (emailSalvo) {
      setEmail(emailSalvo);
      setLembrar(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: senha,
      });

      if (error) throw error;

      // Recupera o metadado que injetamos via SQL Editor
      const nomeUnidade = data.user?.user_metadata?.nome_unidade || 'Unidade Desconhecida';
      
      // Salva a unidade ativa localmente
      localStorage.setItem('fspss_unidade_ativa', nomeUnidade);

      if (lembrar) {
        localStorage.setItem('fspss_lembrar_email', email);
      } else {
        localStorage.removeItem('fspss_lembrar_email');
      }

      onLoginSuccess(nomeUnidade);
    } catch (err: any) {
      setErro(err.message || 'Erro ao realizar login. Verifique as credenciais.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>FSPSS - Gestão Clínica</h2>
        <p style={styles.subtitle}>Insira as credenciais da sua unidade</p>
        
        {erro && <div style={styles.errorBox}>{erro}</div>}

        <form onSubmit={handleLogin} style={styles.form}>
          <input 
            type="email" 
            placeholder="Ex: usfboicucanga1@adm.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input 
            type="password" 
            placeholder="Senha" 
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            style={styles.input}
            required
          />
          
          <label style={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={lembrar} 
              onChange={(e) => setLembrar(e.target.checked)} 
              style={{ marginRight: '8px' }}
            />
            Lembrar usuário (e-mail)
          </label>

          <button type="submit" disabled={carregando} style={styles.button}>
            {carregando ? 'Entrando...' : 'Acessar Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f3f4f6' },
  card: { padding: '2.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' as const },
  title: { margin: '0 0 0.5rem 0', color: '#1f2937', fontSize: '1.5rem', fontWeight: 'bold' },
  subtitle: { margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column' as const, gap: '1rem' },
  input: { padding: '0.75rem', borderRadius: '4px', border: '1px solid #d1d5db', fontSize: '1rem', outline: 'none', color: '#000' },
  checkboxLabel: { display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#4b5563', cursor: 'pointer', textAlign: 'left' as const },
  button: { padding: '0.75rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '1rem', cursor: 'pointer', fontWeight: '600' },
  errorBox: { padding: '0.5rem', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'left' as const }
};