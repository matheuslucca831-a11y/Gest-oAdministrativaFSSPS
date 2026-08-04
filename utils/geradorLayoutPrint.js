import { logoBrasil, logoFSPSS } from '../app/imagens';

/**
 * Utilitário exclusivo para geração de layouts de impressão de guias de remessa.
 * Suporta o Layout 1 (Em Lote, baseado na lista de pacientes) e Layout 2 (Individual, 2 vias).
 */
 export const gerarHtmlRemessa = (remessa) => {
  // Extrai o ano da data de saída ou assume o ano atual do sistema
  const anoGuia = remessa.dataSaida ? remessa.dataSaida.split('/').pop() : new Date().getFullYear();
  
  // Condição para determinar se a guia deve seguir o layout de lote
  const éGuiaLote = remessa.pacientesEnviados && Array.isArray(remessa.pacientesEnviados) && remessa.pacientesEnviados.length > 0;

  // ----------------------------------------------------
  // LAYOUT 1: GUIA DE REMESSA DE ENCAMINHAMENTOS (LOTE)
  // ----------------------------------------------------
  if (éGuiaLote) {
    // Força a tabela a renderizar exatamente 30 linhas no total
    const totalLinhasAlvo = 30;
    const linhas = [];

    for (let i = 0; i < totalLinhasAlvo; i++) {
      const p = remessa.pacientesEnviados[i];
      
      if (p) {
        // Linha preenchida (Divisão exata de 50% / 50% com trava de texto para não mover a linha)
        linhas.push(`
          <tr class="border-b border-black text-[11px] font-medium uppercase break-inside-avoid">
            <td class="px-2 py-0.5 border-r border-black tracking-wide truncate max-w-0" style="width: 50%;">${p.nome}</td>
            <td class="px-2 py-0.5 tracking-wide text-blue-900 font-semibold truncate max-w-0" style="width: 50%;">${p.especialidade}</td>
          </tr>
        `);
      } else {
        // Linha vazia compacta para completagem (Mantém os mesmos 50% / 50%)
        linhas.push(`
          <tr class="border-b border-black text-[11px] uppercase break-inside-avoid h-[22px]">
            <td class="px-2 py-0.5 border-r border-black" style="width: 50%;"></td>
            <td class="px-2 py-0.5" style="width: 50%;"></td>
          </tr>
        `);
      }
    }

    const linhasTabelaPacientes = linhas.join('');

    return `
      <div class="print-area-content w-full text-black text-xs max-w-[780px] mx-auto p-2">
        
        <div class="grid grid-cols-6 border-2 border-black mb-2 bg-white items-stretch text-center">
          <div class="col-span-1 border-r border-black flex items-center justify-center p-2">
            <img src="${logoFSPSS}" alt="Logo Fundação" class="max-h-14 w-auto object-contain" />
          </div>
          <div class="col-span-4 p-2 flex flex-col justify-center">
            <h1 class="text-[13px] tracking-tight font-extrabold">FSPSS - FUNDAÇÃO DE SAÚDE PÚBLICA DE SÃO SEBASTIÃO</h1>
            <p class="text-[11px] font-bold mt-0.5">${remessa.de || 'USF BOI'}</p>
            <h2 class="text-xs underline uppercase mt-0.5 tracking-wider font-extrabold">GUIA DE REMESSA EM LOTE Nº ${remessa.numeroRemessa}/${anoGuia}</h2>
          </div>
          <div class="col-span-1 border-l border-black flex items-center justify-center p-2">
            <img src="${logoBrasil}" alt="Brasão" class="max-h-14 w-auto object-contain" />
          </div>
        </div>

        <div class="flex border-2 border-black border-b-0 bg-white text-[11px]">
          <div class="w-[50%] border-r border-black p-1.5 flex flex-col justify-between min-h-[50px]">
            <div><span class="font-black">DE:</span></div>
            <div class="font-black text-center text-xs my-auto">${remessa.de || 'USF BOI'}</div>
            <div class="text-[8px] text-gray-600">...</div>
          </div>
          <div class="w-[50%] p-1.5 flex flex-col justify-between min-h-[50px]">
            <div><span class="font-black">PARA:</span></div>
            <div class="font-black text-center text-xs my-auto">${remessa.destino}</div>
            <div class="text-right text-[9px] font-bold">A/C <span class="underline">${remessa.ac || 'RESPONSÁVEL'}</span></div>
          </div>
        </div>

        <div class="border-2 border-black p-1 bg-gray-200 text-[10px] font-black uppercase" style="-webkit-print-color-adjust: exact; print-color-adjust: exact;">
          ASSUNTO: <span class="ml-4 font-bold">${remessa.assunto}</span>
        </div>

        <div class="border-2 border-black border-t-0 bg-white w-full">
          <table class="w-full border-collapse table-fixed">
            <thead>
              <tr class="border-b-2 border-black bg-gray-200 text-center font-black text-[10px]" style="-webkit-print-color-adjust: exact; print-color-adjust: exact;">
                <th class="p-1 border-r border-black" style="width: 50%;">NOME COMPLETO DO PACIENTE</th>
                <th class="p-1" style="width: 50%;">EXAME / ESPECIALIDADE</th>
              </tr>
            </thead>
            <tbody>
              ${linhasTabelaPacientes}
            </tbody>
          </table>
        </div>

        <div class="flex border-2 border-black border-t-0 bg-white text-[10px] break-inside-avoid">
          <div class="w-[50%] border-r border-black p-2 pr-4 flex flex-col gap-y-4">
            <div class="flex flex-col justify-end">
              <div class="border-b border-black w-full text-center font-bold pb-0.5">${remessa.dataSaida || ''}</div>
              <div class="text-center text-[8px] font-black uppercase mt-0.5 text-gray-500">Data de envio</div>
            </div>
            <div class="flex flex-col justify-end">
              <div class="border-b border-black w-full h-[14px]">...</div>
              <div class="text-center text-[8px] font-black uppercase mt-0.5 text-gray-500">Data de recebimento</div>
            </div>
          </div>
          
          <div class="w-[50%] p-2 pl-4 flex flex-col gap-y-4">
            <div class="flex flex-col justify-end">
              <div class="border-b border-black w-full h-[14px]"></div>
              <div class="text-center text-[8px] font-black uppercase mt-0.5 text-gray-500">assinatura do responsável pelo envio</div>
            </div>
            <div class="flex flex-col justify-end">
              <div class="border-b border-black w-full h-[14px]"></div>
              <div class="text-center text-[8px] font-black uppercase mt-0.5 text-gray-500">assinatura do responsável pelo recebimento</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ----------------------------------------------------
  // LAYOUT 2: GUIA DE REMESSA INDIVIDUAL (2 VIAS)
  // ----------------------------------------------------
  let conteudoDescricao = remessa.descricao || '-';

  const renderVia = (tipoVia, isSegundaVia) => `
    <div class="text-black bg-white text-xs border-2 border-black flex flex-col justify-between h-[45vh] break-inside-avoid my-1">
      <div>
        <div class="grid grid-cols-6 border-b border-black items-stretch text-center">
          <div class="col-span-1 border-r border-black flex items-center justify-center p-1">
            <img
              src="${logoFSPSS}"
              alt="Logo Fundação"
              class="max-h-12 w-auto object-contain"
            />
          </div>
          <div class="col-span-4 p-1.5 flex flex-col justify-center">
            <h2 class="font-black text-[11px] tracking-tight leading-tight">FSPSS - FUNDAÇÃO DE SAÚDE PÚBLICA DE SÃO SEBASTIÃO</h2>
            <h3 class="font-black text-xs underline uppercase tracking-wide mt-0.5">Guia de Remessa Nº ${remessa.numeroRemessa}/${anoGuia}</h3>
          </div>
          <div class="col-span-1 border-l border-black flex items-center justify-center p-1">
            <img
              src="${logoBrasil}"
              alt="Brasão"
              class="max-h-12 w-auto object-contain"
            />
          </div>
        </div>
        
        <div class="grid grid-cols-2 border-b border-black items-stretch text-[11px]">
          <div class="border-r border-black p-1.5 flex flex-col justify-between min-h-[50px]">
            <span class="font-black block">DE:</span>
            <span class="font-black text-center text-xs my-auto block">${remessa.de || 'USF BOI'}</span>
            <span class="text-[8px] text-gray-500 block">...</span>
          </div>
          <div class="p-1.5 flex flex-col justify-between min-h-[50px]">
            <span class="font-black block">PARA:</span>
            <span class="font-black text-center text-xs my-auto block">${remessa.destino}</span>
            <div class="text-right text-[9px] font-bold w-full flex justify-end gap-1">
              <span>AC/</span><span class="underline">${remessa.ac || 'RESPONSÁVEL'}</span>
            </div>
          </div>
        </div>

        <div class="border-b border-black bg-gray-200 px-2 py-0.5 font-black text-[10px] uppercase tracking-wider" style="-webkit-print-color-adjust: exact; print-color-adjust: exact;">ASSUNTO</div>
        <div class="border-b border-black px-2 py-1 text-xs font-bold bg-white">${remessa.assunto}</div>
        
        <div class="border-b border-black bg-gray-200 px-2 py-0.5 font-black text-[10px] uppercase tracking-wider" style="-webkit-print-color-adjust: exact; print-color-adjust: exact;">DESCRIÇÃO</div>
        <div class="p-2 bg-white min-h-[110px] flex flex-col justify-between overflow-hidden">
          <p class="font-mono text-xs leading-normal  uppercase font-bold whitespace-pre-line break-words">${conteudoDescricao}</p>
          <div class="text-right text-[8px] font-black text-gray-400 tracking-widest uppercase">${tipoVia}</div>
        </div>
      </div>

      <div>
        ${!isSegundaVia ? `
          <div class="grid grid-cols-2 items-end p-2 min-h-[50px] bg-white border-t border-black">
            <div class="text-left font-bold text-[11px] pb-1">São Sebastião, <span class="ml-1">${remessa.dataSaida || ''}</span></div>
            <div class="flex flex-col items-center">
              <div class="w-full border-t border-black text-center text-[8px] font-medium pt-0.5 text-gray-500 uppercase">assinatura e carimbo do responsável pelo envio</div>
            </div>
          </div>
        ` : `
          <div class="flex flex-col w-full">
            <div class="border-t border-black bg-gray-200 px-2 py-0.5 font-black text-[10px] uppercase tracking-wider" style="-webkit-print-color-adjust: exact; print-color-adjust: exact;">LOCAL E DATA</div>
            <div class="grid grid-cols-2 items-end p-2 min-h-[50px] bg-white">
              <div class="text-left font-bold text-[11px] pb-1">São Sebastião, <span class="ml-1">____/____/_____</span></div>
              <div class="flex flex-col items-center">
                <div class="w-full border-t border-black text-center text-[8px] font-medium pt-0.5 text-gray-500 uppercase">assinatura e carimbo do responsável pelo recebimento</div>
              </div>
            </div>
            <div class="text-center text-[7.5px] font-black uppercase tracking-tighter border-t border-black bg-white py-0.5 underline">
              AO DESTINATÁRIO: PELO RECEBIMENTO, COLOCAR LOCAL E DATA, ASSINAR E DEVOLVER A PARTE INFERIOR DESTA GUIA
            </div>
          </div>
        `}
      </div>
    </div>
  `;

  return `
    <div class="print-area-content flex flex-col justify-between h-[94vh] max-w-[780px] mx-auto p-2">
      ${renderVia('Via: ORIGINAL', false)}
      
      <div class="my-1 border-b border-dashed border-black text-center relative">
        <span class="text-[9px] font-bold text-gray-500 bg-white px-4  uppercase relative top-[6px]">Corte aqui</span>
      </div>
      
      ${renderVia('Via: CÓPIA / PROTOCOLO', true)}
    </div>
  `;
};