'use client';

import React, { useEffect, useState } from 'react';
import { db } from '../../../db'; // Ajustado para subir 3 níveis de pasta até a raiz

import { logoBrasil, logoFSPSS } from '../../imagens';

export default function PrintRemessa() {
  const [remessa, setRemessa] = useState(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const idStr = urlParams.get('id');
        
        if (idStr) {
          const id = parseInt(idStr, 10);
          const registro = await db.remessas.get(id);
          
          if (registro) {
            const anoAtual = new Date().getFullYear().toString();
            setRemessa({
              ano: anoAtual,
              ...registro
            });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar remessa para impressão:', error);
      }
    }
    carregarDados();
  }, []);

  useEffect(() => {
    if (remessa) {
      const timer = setTimeout(() => {
        window.print();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [remessa]);

  if (!remessa) {
    return (
      <div className="p-6 text-xs font-black uppercase text-gray-500 tracking-wider">
        Carregando dados da guia de remessa...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-0 sm:p-4 text-black print:p-0">
      <div className="max-w-[780px] mx-auto flex flex-col justify-between h-[96vh] print:h-[97vh] bg-white">
        
        {/* ========================================== */}
        {/* VIA 1: ORIGINAL (PARTE SUPERIOR)           */}
        {/* ========================================== */}
        <div className="border-2 border-black bg-white text-xs flex flex-col justify-between h-[46vh] print:inside-avoid">
          <div className="grid grid-cols-6 border-b border-black items-stretch text-center">
            
            {/* LOGO ESQUERDA - PEIXINHO */}
            <div className="col-span-1 border-r border-black flex items-center justify-center p-1">
              <img
                src={logoBrasil}
                alt="Logo Prefeitura"
                className="max-h-12 w-auto object-contain"
              />
            </div>
            
            <div className="col-span-4 p-1.5 flex flex-col justify-center">
              <h2 className="font-black text-[11px] tracking-tight leading-tight">FSPSS - FUNDAÇÃO DE SAÚDE PÚBLICA DE SÃO SEBASTIÃO</h2>
              <h3 className="font-black text-xs underline uppercase tracking-wide mt-0.5">Guia de Remessa Nº {remessa.numeroRemessa} /{remessa.ano}</h3>
            </div>
            
            {/* LOGO DIREITA - FUNDAÇÃO */}
            <div className="col-span-1 border-l border-black flex items-center justify-center p-1">
              <img
                src={logoFSPSS}
                alt="Logo Fundação"
                className="max-h-12 w-auto object-contain"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 border-b border-black items-stretch text-[11px]">
            <div className="border-r border-black p-1.5 flex flex-col justify-between min-h-[50px]">
              <span className="font-black block">DE:</span>
              <span className="font-black text-center text-xs my-auto block">{remessa.de}</span>
              <span className="text-[8px] text-gray-500 block">.</span>
            </div>
            <div className="p-1.5 flex flex-col justify-between min-h-[50px]">
              <span className="font-black block">PARA:</span>
              <span className="font-black text-center text-xs my-auto block">{remessa.destino}</span>
              <div className="text-right text-[9px] font-bold w-full flex justify-end gap-1">
                <span>AC/</span><span className="underline">{remessa.ac}</span>
              </div>
            </div>
          </div>

          <div className="border-b border-black bg-gray-200 px-2 py-0.5 font-black text-[10px] uppercase tracking-wider">Assunto</div>
          <div className="border-b border-black px-2 py-1.5 text-xs font-bold bg-white">{remessa.assunto}</div>
          
          <div className="border-b border-black bg-gray-200 px-2 py-0.5 font-black text-[10px] uppercase tracking-wider">Descrição</div>
          <div className="flex-grow p-2.5 bg-white min-h-[80px] flex flex-col justify-between">
            <p className="font-mono text-xs leading-normal uppercase font-bold whitespace-pre-line break-words overflow-hidden">
              {remessa.descricao}
            </p>
            <div className="text-right text-[8px] font-black text-gray-400 tracking-widest uppercase">Via: ORIGINAL</div>
          </div>

          <div className="grid grid-cols-2 items-end p-2 min-h-[55px] bg-white border-t border-black">
            <div className="text-left font-bold text-[11px] pb-1">São Sebastião, <span className="ml-1">{remessa.dataSaida}</span></div>
            <div className="flex flex-col items-center">
              <div className="w-full border-t border-black text-center text-[8px] font-medium pt-0.5 text-gray-500 uppercase">assinatura e carimbo do responsável pelo envio</div>
            </div>
          </div>
        </div>

        {/* LINHA DE CORTE */}
        <div className="my-1 border-b border-dashed border-black text-center select-none print:my-0">
          <span className="text-[9px] font-bold text-gray-500 bg-white px-4 uppercase tracking-wider">Corte aqui</span>
        </div>

        {/* ========================================== */}
        {/* VIA 2: PROTOCOLO (PARTE INFERIOR)          */}
        {/* ========================================== */}
        <div className="border-2 border-black bg-white text-xs flex flex-col justify-between h-[46vh] print:inside-avoid">
          <div className="grid grid-cols-6 border-b border-black items-stretch text-center">
            
            {/* LOGO ESQUERDA - PEIXINHO */}
            <div className="col-span-1 border-r border-black flex items-center justify-center p-1">
              <img
                  src={logoBrasil}
                  alt="Logo Prefeitura"
                  className="max-h-12 w-auto object-contain"
                />
            </div>
            
            <div className="col-span-4 p-1.5 flex flex-col justify-center">
              <h2 className="font-black text-[11px] tracking-tight leading-tight">FSPSS - FUNDAÇÃO DE SAÚDE PÚBLICA DE SÃO SEBASTIÃO</h2>
              <h3 className="font-black text-xs underline uppercase tracking-wide mt-0.5">Guia de Remessa Nº {remessa.numeroRemessa} /{remessa.ano}</h3>
            </div>
            
            {/* LOGO DIREITA - FUNDAÇÃO */}
            <div className="col-span-1 border-l border-black flex items-center justify-center p-1">
              <img
                src={logoFSPSS}
                alt="Logo Fundação"
                className="max-h-12 w-auto object-contain"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 border-b border-black items-stretch text-[11px]">
            <div className="border-r border-black p-1.5 flex flex-col justify-between min-h-[50px]">
              <span className="font-black block">DE:</span>
              <span className="font-black text-center text-xs my-auto block">{remessa.de}</span>
              <span className="text-[8px] text-gray-500 block">...</span>
            </div>
            <div className="p-1.5 flex flex-col justify-between min-h-[50px]">
              <span className="font-black block">PARA:</span>
              <span className="font-black text-center text-xs my-auto block">{remessa.destino}</span>
              <div className="text-right text-[9px] font-bold w-full flex justify-end gap-1">
                <span>AC/</span><span className="underline">{remessa.ac}</span>
              </div>
            </div>
          </div>

          <div className="border-b border-black bg-gray-200 px-2 py-0.5 font-black text-[10px] uppercase tracking-wider">Assunto</div>
          <div className="border-b border-black px-2 py-1.5 text-xs font-bold bg-white">{remessa.assunto}</div>

          <div className="border-b border-black bg-gray-200 px-2 py-0.5 font-black text-[10px] uppercase tracking-wider">Descrição</div>
          <div className="flex-grow p-2.5 bg-white min-h-[80px] flex flex-col justify-between">
            <p className="font-mono text-xs leading-normal uppercase font-bold whitespace-pre-line break-words overflow-hidden">
              {remessa.descricao}
            </p>
            <div className="text-right text-[8px] font-black text-gray-400 tracking-widest uppercase">Via: CÓPIA / PROTOCOLO</div>
          </div>

          <div className="flex flex-col w-full">
            <div className="border-t border-b border-black bg-gray-200 px-2 py-0.5 font-black text-[10px] uppercase tracking-wider">LOCAL E DATA</div>
            <div className="grid grid-cols-2 items-end p-2 min-h-[55px] bg-white">
              <div className="text-left font-bold text-[11px] pb-1">São Sebastião, <span className="ml-1">____ / ____ / {remessa.ano}</span></div>
              <div className="flex flex-col items-center">
                <div className="w-full border-t border-black text-center text-[8px] font-medium pt-0.5 text-gray-500 uppercase">assinatura e carimbo do responsável pelo recebimento</div>
              </div>
            </div>
            <div className="text-center text-[8px] font-black uppercase tracking-tighter border-t border-black bg-white py-0.5 underline select-none">
              AO DESTINATÁRIO: PELO RECEBIMENTO, COLOCAR LOCAL E DATA, ASSINAR E DEVOLVER A PARTE INFERIOR DESTA GUIA
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}