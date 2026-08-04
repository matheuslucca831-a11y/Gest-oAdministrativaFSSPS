"use client";

import './globals.css';
import Sidebar from '@/components/Sidebar';
import ConfiguracaoInicial from '@/components/ConfiguracaoInicial';
import React, { useEffect } from 'react';
import { db } from '@/db';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  useEffect(() => {
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

        <ConfiguracaoInicial />

        <aside className="print:hidden flex-shrink-0 h-full">
          <Sidebar />
        </aside>

        <main className="flex-1 h-full overflow-y-auto print:block print:h-auto print:w-full print:p-0 print:overflow-visible">
          {children}
        </main>

      </body>
    </html>
  );
}
