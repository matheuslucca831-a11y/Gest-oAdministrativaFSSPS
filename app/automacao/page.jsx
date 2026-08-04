"use client";

import React, { useState, useEffect } from "react";
import { db } from '@/db';
import { utils, writeFile } from "xlsx";
import { MessageSquare, AlertTriangle, Save, CheckCircle2 } from "lucide-react";

export default function AutomacaoZap() {
  const [encaminhamentos, setEncaminhamentos] = useState([]);
  const [filtroTexto, setFiltroTexto] = useState("");
  const [filtroDataChegada, setFiltroDataChegada] = useState("");
  const [selecionados, setSelecionados] = useState({});
  
  // Estados para a Mensagem Padrão do WhatsApp
  const [mensagemZap, setMensagemZap] = useState("");
  const [salvo, setSalvo] = useState(false);

  const mensagemPadraoInicial = `(Nome da Unidade)

*{{NAME}}* um encaminhamento em seu nome está disponível para retirada no posto de saúde de (Nome da Unidade)
 
Exame/especialidade: *{{EXAME}}*
Agendado para o dia *{{DATAEXAME}}*

📢 POR FAVOR, SOLICITAMOS QUE VENHA RETIRAR O SEU ENCAMINHAMENTO ASSIM QUE RECEBER ESSE AVISO; das 9h00 às 12h00 e das 13h00 às 16h00 de segunda a quinta feira 📢*

‼️confirmar o recebimento da mensagem‼️`;

  // Carrega os dados da tabela e a mensagem padrão do localStorage
  useEffect(() => {
    // 1. Carrega Mensagem do WhatsApp
    const mensagemSalva = localStorage.getItem('fspss_mensagem_zap_padrao');
    setMensagemZap(mensagemSalva || mensagemPadraoInicial);

    // 2. Carrega Dados do Banco (Enviado / Agendado)
    async function carregarDados() {
      if (db.encaminhamentos) {
        try {
          const todosEncaminhamentos = await db.encaminhamentos.toArray();

          const dados = todosEncaminhamentos.filter(
            (enc) => enc.status === "." || enc.status === "Agendado"
          );

          const dadosTratados = dados.map((enc) => {
            const nomeFinal = enc.nomePaciente || enc.nome || enc.paciente || "PACIENTE SEM NOME";
            const examenFinal = enc.exameEspecialidade || enc.exame || enc.especialidade || "NÃO ESPECIFICADO";
            const dataFinal = enc.dataChegada || enc.data || enc.dataExame || "";
            const telFinal = enc.telefone || enc.tel || enc.whatsapp || "";

            return {
              ...enc,
              nomeExibicao: nomeFinal,
              exameExibicao: examenFinal,
              dataChegadaTratada: dataFinal,
              telefoneTratado: telFinal
            };
          });

          setEncaminhamentos(dadosTratados);
        } catch (err) {
          console.error("Erro ao carregar dados de encaminhamentos:", err);
        }
      }
    }
    carregarDados();
  }, []);

  // Salva a alteração da mensagem no localStorage (Tipagem removida aqui)
  const handleSalvarMensagem = (e) => {
    e.preventDefault();
    localStorage.setItem('fspss_mensagem_zap_padrao', mensagemZap.trim());
    setSalvo(true);
    setTimeout(() => setSalvo(false), 3000);
  };

  // Filtragem usando os campos tratados
// Filtragem corrigida normalizando os formatos de data
  const encaminhamentosFiltrados = encaminhamentos.filter((enc) => {
    const textoMatch =
      enc.nomeExibicao.toLowerCase().includes(filtroTexto.toLowerCase()) ||
      enc.exameExibicao.toLowerCase().includes(filtroTexto.toLowerCase());

    let dataMatch = true;
    if (filtroDataChegada) {
      // Garante que a data do registro esteja no formato YYYY-MM-DD para bater com o input
      let dataRegistroFormatada = enc.dataChegadaTratada || "";
      
      // Se a data do banco já tiver "-", assumimos que está em formato ISO (YYYY-MM-DD)
      // Se estiver no formato brasileiro (DD/MM/YYYY), convertemos para YYYY-MM-DD
      if (dataRegistroFormatada.includes("/")) {
        const [dia, mes, ano] = dataRegistroFormatada.split("/");
        dataRegistroFormatada = `${ano}-${mes}-${dia}`;
      }

      dataMatch = dataRegistroFormatada === filtroDataChegada;
    }

    return textoMatch && dataMatch;
  });

  const handleToggleSelecao = (id) => {
    setSelecionados((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalFiltrados = encaminhamentosFiltrados.length;
  const totalSelecionadosFiltrados = encaminhamentosFiltrados.filter(e => selecionados[e.id]).length;
  const todosMarcados = totalFiltrados > 0 && totalSelecionadosFiltrados === totalFiltrados;

  const handleMarcarTodos = () => {
    const novoEstado = { ...selecionados };
    encaminhamentosFiltrados.forEach((enc) => {
      novoEstado[enc.id] = !todosMarcados;
    });
    setSelecionados(novoEstado);
  };

  // Geração de planilha com dados unificados
  const exportarParaExcel = () => {
    const itensParaExportar = encaminhamentosFiltrados.filter(e => selecionados[e.id]);

    if (itensParaExportar.length === 0) {
      alert("Por favor, selecione ao menos um paciente para gerar a planilha.");
      return;
    }

    const matrizPlanilha = [
      ["Tips"],
      [],
      ["1.WhatsApp Number is required. Please fill it in the following format:"],
      ["Country code in front, like:  +12623798203,+5512000576022"],
      [],
      ["2.Please note that:"],
      ["[Required] The first column must be the WhatsApp Number."],
      ["[Required] Each column header must occupy row 14, which means the real data starts on row 15."],
      ["[Not required] Other columns can be customized within Excel."],
      ["[Not required] The data in row 15 is an example and is suggested for deletion."],
      ["[Not required] Please do not delete this tips information unless necessary."],
      [],
      [],
      ["WhatsApp Number(with country code)", "NAME", "EXAME", "DATAEXAME"]
    ];

    itensParaExportar.forEach((enc) => {
      let telefoneFormatado = enc.telefoneTratado?.replace(/\D/g, "") || "";
      if (telefoneFormatado && !telefoneFormatado.startsWith("55")) {
        telefoneFormatado = `+55${telefoneFormatado}`;
      } else if (telefoneFormatado) {
        telefoneFormatado = `+${telefoneFormatado}`;
      }

      let dataFormatada = "---";
      if (enc.dataChegadaTratada) {
        if (enc.dataChegadaTratada.includes("-")) {
          const [ano, mes, dia] = enc.dataChegadaTratada.split("-");
          dataFormatada = `${dia}/${mes}/${ano}`;
        } else {
          dataFormatada = enc.dataChegadaTratada;
        }
      }

      matrizPlanilha.push([
        telefoneFormatado,
        enc.nomeExibicao.toUpperCase(),
        enc.exameExibicao.toUpperCase(),
        dataFormatada
      ]);
    });

    const wb = utils.book_new();
    const ws = utils.aoa_to_sheet(matrizPlanilha);

    const totalLinhas = matrizPlanilha.length;
    for (let i = 14; i < totalLinhas; i++) {
      const celulaData = ws[utils.encode_cell({ r: i, c: 3 })];
      if (celulaData) celulaData.t = 's';
      
      const celulaTelefone = ws[utils.encode_cell({ r: i, c: 0 })];
      if (celulaTelefone) celulaTelefone.t = 's';
    }

    utils.book_append_sheet(wb, ws, "Contatos Zap");
    const dataHoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    writeFile(wb, `Lista_Disparo_Zap_${dataHoje}.xlsx`);
  };

  return (
    <div className="p-6 bg-slate-50 text-slate-900 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* CABEÇALHO */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Módulo de Automação de Disparos</h1>
            <p className="text-sm text-slate-500">Gere listagens prontas e configure o modelo para a extensão WPPME.COM</p>
          </div>
          <button
            onClick={exportarParaExcel}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg font-semibold shadow transition-all flex items-center justify-center gap-2"
          >
             GERAR PLANILHA DE AUTOMAÇÃO ({totalSelecionadosFiltrados})
          </button>
        </div>

        {/* FEEDBACK SALVAMENTO DA MENSAGEM */}
        {salvo && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
            <CheckCircle2 size={16} className="text-emerald-600" />
            Modelo de mensagem do WhatsApp updated com sucesso!
          </div>
        )}

        {/* LAYOUT EM DUAS COLUNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SEÇÃO DO MODELO DA MENSAGEM (COLUNA 1) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2">
                <MessageSquare size={18} className="text-blue-600" />
                <h2>Modelo do Texto de Aviso</h2>
              </div>

              <form onSubmit={handleSalvarMensagem} className="space-y-3">
                <textarea
                  rows={8}
                  value={mensagemZap}
                  onChange={(e) => setMensagemZap(e.target.value)}
                  placeholder="Digite o modelo de mensagem..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 text-slate-900 font-mono tracking-wide resize-none"
                />
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <Save size={14} />
                  Salvar Texto Padrão
                </button>
              </form>
            </div>

            {/* PAINEL DE INSTRUÇÕES CHAVES */}
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-amber-950 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold uppercase text-[10px] tracking-wide text-amber-800">
                <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                Variáveis Importantes para o ADM
              </div>
              <p className="leading-relaxed text-slate-700">
                A extensão puxará os dados da planilha gerada substituindo as chaves abaixo de forma automática. Mantenha-as idênticas:
              </p>
              <ul className="space-y-1 bg-white/70 p-2 rounded border border-amber-200/60 font-mono text-[10px] text-slate-800">
                <li>• <span className="font-bold text-blue-600">{"{{NAME}}"}</span>: Nome do paciente.</li>
                <li>• <span className="font-bold text-blue-600">{"{{EXAME}}"}</span>: Exame ou especialidade.</li>
                <li>• <span className="font-bold text-blue-600">{"{{DATAEXAME}}"}</span>: Data de chegada regulada.</li>
              </ul>
            </div>
          </div>

          {/* COLUNA DOS FILTROS E TABELA (COLUNA 2 E 3) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* FILTROS */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-xs font-semibold text-slate-500 tracking-wider uppercase mb-3">
                Filtros de Busca Avançados (Data de Chegada)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="BUSCAR POR NOME OU EXAME..."
                    value={filtroTexto}
                    onChange={(e) => setFiltroTexto(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 uppercase placeholder-slate-400"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={filtroDataChegada}
                    onChange={(e) => setFiltroDataChegada(e.target.value)}
                    className="w-full bg-slate-50 text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                <label className="flex items-center space-x-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={todosMarcados}
                    onChange={handleMarcarTodos}
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 bg-white focus:ring-0"
                  />
                  <span className="font-semibold text-sm tracking-wide text-slate-700">MARCAR TODOS FILTRADOS</span>
                </label>
                <span className="text-xs text-slate-500 font-medium">
                  {totalFiltrados} listados | {totalSelecionadosFiltrados} selecionados
                </span>
              </div>
            </div>

            {/* TABELA */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 uppercase text-xs font-semibold tracking-wider border-b border-slate-200">
                      <th className="p-4 w-16 text-center">Selec.</th>
                      <th className="p-4">Nome do Paciente</th>
                      <th className="p-4">Exame / Especialidade</th>
                      <th className="p-4 w-40">Data de Chegada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {encaminhamentosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500 font-medium bg-slate-50 text-xs">
                          NENHUM ENCAMINHAMENTO ENCONTRADO.
                        </td>
                      </tr>
                    ) : (
                      encaminhamentosFiltrados.map((enc) => (
                        <tr
                          key={enc.id}
                          onClick={() => handleToggleSelecao(enc.id)}
                          className={`border-b border-slate-100 cursor-pointer transition-colors text-xs hover:bg-slate-50 ${
                            selecionados[enc.id] ? "bg-blue-50 hover:bg-blue-50/80" : ""
                          }`}
                        >
                          <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={!!selecionados[enc.id]}
                              onChange={() => handleToggleSelecao(enc.id)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 bg-white focus:ring-0"
                            />
                          </td>
                          <td className="p-4 font-bold tracking-wide uppercase text-slate-900">
                            {enc.nomeExibicao}
                          </td>
                          <td className="p-4 font-medium tracking-wide uppercase text-slate-700">
                            {enc.exameExibicao}
                          </td>
                          <td className="p-4 text-slate-600 font-mono">
                            {enc.dataChegadaTratada && enc.dataChegadaTratada.includes("-") 
                              ? enc.dataChegadaTratada.split('-').reverse().join('/') 
                              : enc.dataChegadaTratada || "---"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}