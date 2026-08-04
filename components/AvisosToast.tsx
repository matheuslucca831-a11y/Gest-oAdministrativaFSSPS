'use client';

import { useAvisos } from '@/hooks/Avisos'; // Ajuste o caminho do seu hook
import { X, Info, AlertTriangle, AlertCircle } from 'lucide-react';

export function AvisosToast() {
  const { avisosVisiveis, dispensarAviso } = useAvisos();

  // Se não tem aviso, não renderiza nada na tela
  if (avisosVisiveis.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full">
      {avisosVisiveis.map((aviso) => {
        // Estilização dinâmica baseada no tipo de aviso
        let estilos = {
          bg: 'bg-blue-50 border-blue-500',
          texto: 'text-blue-800',
          Icone: Info,
        };

        if (aviso.tipo === 'aviso') {
          estilos = {
            bg: 'bg-yellow-50 border-yellow-500',
            texto: 'text-yellow-900',
            Icone: AlertTriangle,
          };
        } else if (aviso.tipo === 'urgente') {
          estilos = {
            bg: 'bg-red-50 border-red-500',
            texto: 'text-red-900',
            Icone: AlertCircle,
          };
        }

        return (
          <div
            key={aviso.id}
            className={`flex items-start p-4 border-l-4 rounded-md shadow-lg bg-white ${estilos.bg} transition-all duration-300 ease-in-out`}
          >
            <div className={`mr-3 mt-0.5 ${estilos.texto}`}>
              <estilos.Icone size={20} />
            </div>
            
            <div className="flex-1">
              <h4 className={`text-sm font-bold ${estilos.texto}`}>
                {aviso.titulo}
              </h4>
              <p className="text-sm mt-1 text-gray-700 leading-relaxed">
                {aviso.mensagem}
              </p>
            </div>

            <button
              onClick={() => dispensarAviso(aviso.id)}
              className="ml-4 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Dispensar aviso"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}