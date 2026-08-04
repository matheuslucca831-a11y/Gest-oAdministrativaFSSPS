"use client";

import './globals.css';
import Sidebar from '@/components/Sidebar';
import ConfiguracaoInicial from '@/components/ConfiguracaoInicial';
import React, { useEffect } from 'react';
import { db } from '@/db';
import { AvisosToast } from '@/components/AvisosToast';
import { ModalProvider } from '@/components/ModalProvider'; // 👈 novo

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  useEffect(() => {
    const corrigirDatasQuebradas = async () => {
      // Roda só uma vez — depois disso, marca como feito e nunca mais roda de novo
      const jaCorrigido = localStorage.getItem('fspss_correcao_datas_v1');
      if (jaCorrigido === 'true') return;

      try {
        const tabelasParaVerificar = [
          'encaminhamentos', 'exames', 'remessas', 'sos', 'pacientes',
          'transferencias', 'profissionais', 'pedidos', 'materiais'
        ];

        for (const nomeTabela of tabelasParaVerificar) {
          const registros = await (db as any).table(nomeTabela).toArray();

          for (const registro of registros) {
            let precisaCorrigir = false;
            const registroCorrigido: any = { ...registro };

            for (const chave in registroCorrigido) {
              if (registroCorrigido[chave] instanceof Date) {
                const d = registroCorrigido[chave] as Date;
                const dia = String(d.getDate()).padStart(2, '0');
                const mes = String(d.getMonth() + 1).padStart(2, '0');
                const ano = d.getFullYear();
                registroCorrigido[chave] = `${dia}/${mes}/${ano}`;
                precisaCorrigir = true;
              }
            }

            if (precisaCorrigir) {
              await (db as any).table(nomeTabela).put(registroCorrigido);
              console.log(`Corrigido registro na tabela ${nomeTabela}:`, registro.id ?? registro.cross);
            }
          }
        }

        localStorage.setItem('fspss_correcao_datas_v1', 'true');
        console.log('Correção de datas concluída com sucesso.');
      } catch (err) {
        console.error('Erro ao corrigir datas quebradas:', err);
      }
    };

    corrigirDatasQuebradas();

    const loadInitialData = async () => {
      if (typeof window !== 'undefined' && (window as any).require) {
        try {
          const fs = (window as any).require('fs');
          const path = (window as any).require('path');

          const tables = ['encaminhamentos', 'pedidos', 'sos', 'materiais', 'remessas'] as const;

          for (const table of tables) {
            const filePath = path.join(process.cwd(), `${table}.json`);

            if (fs.existsSync(filePath)) {
              const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              const tableInstance = db[table as keyof typeof db] as any;
              await tableInstance.clear();
              await tableInstance.bulkAdd(data);
              console.log(`Tabela ${table} carregada com sucesso!`);
            }
          }
        } catch (err) {
          console.error("Erro ao sincronizar arquivos:", err);
        }
      }
    };

    loadInitialData();
  }, []);

  return (
    <html lang="pt-br">
      <body className="flex h-screen overflow-hidden bg-gray-50 m-0 p-0 print:block print:bg-white">
        <ModalProvider>
          <ConfiguracaoInicial />

          <aside className="print:hidden flex-shrink-0 h-full">
            <Sidebar />
          </aside>

          <main className="flex-1 h-full overflow-y-auto print:block print:h-auto print:w-full print:p-0 print:overflow-visible">
            {children}
          </main>

          <AvisosToast />
        </ModalProvider>
      </body>
    </html>
  );
}