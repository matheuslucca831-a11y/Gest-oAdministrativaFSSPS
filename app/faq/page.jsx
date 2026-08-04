'use client';

import React, { useState } from 'react';
import { 
  Search, HelpCircle, ChevronDown, ChevronUp, FileText, Send, 
  Wrench, Package, Settings, LayoutDashboard, BarChart, FileCheck, ClipboardList
} from 'lucide-react';

export default function FAQ() {
  const [busca, setBusca] = useState('');
  const [abertoId, setAbertoId] = useState(null);

  const dadosFAQ = [
    {
      id: 1,
      categoria: 'Dashboard',
      icone: <LayoutDashboard className="text-indigo-600" size={18} />,
      pergunta: 'O que encontro no Dashboard inicial?',
      resposta: 'O Dashboard é a tela principal do sistema. Nele, você encontra uma breve introdução sobre as páginas e atalhos rápidos para as ações mais comuns do dia a dia, como: Gerar nova guia S.O.S, Emitir nova Guia de Remessa e acessar o Novo Registro/Entrada para encaminhamentos.'
    },
    {
      id: 2,
      categoria: 'Produtividade',
      icone: <BarChart className="text-blue-500" size={18} />,
      pergunta: 'Como gerar o relatório de Produtividade e Metas?',
      resposta: '(Em fase de produção) O módulo de Produtividade foi pensado para ser o mais simples possível. Você só precisará cadastrar o funcionário, selecionar a data personalizada do mês e clicar em um único botão. O sistema fará todo o trabalho pesado e gerará automaticamente a produtividade, incluindo o projeto de substituição e a planilha de metas.'
    },
    {
      id: 3,
      categoria: 'Remessas',
      icone: <FileText className="text-emerald-600" size={18} />,
      pergunta: 'Como emitir e controlar Guias de Remessas?',
      resposta: 'O sistema facilita todo o fluxo de remessas:\n\n• Geração Padrão: Ao gerar uma remessa, o sistema define o número automaticamente e preenche os dados padrão (Origem e A/C), que podem ser alterados se necessário.\n• Remessa para Encaminhamentos: Permite filtrar os encaminhamentos por data de cadastro, nome ou exame. Após selecionar os itens desejados, a remessa é gerada com sua numeração automática.\n• Controle e Histórico: Você tem acesso ao histórico de todas as remessas enviadas. É possível usar a pesquisa avançada (ex: buscar pelo nome do paciente para achar sua remessa), imprimir guias avulsas ou de encaminhamento, além de dar baixa ou descartar registros.'
    },
    {
      id: 4,
      categoria: 'Encaminhamentos',
      icone: <ClipboardList className="text-blue-600" size={18} />,
      pergunta: 'Como cadastrar um Novo Registro rapidamente?',
      resposta: 'Em "Novo Registro", você dá entrada nos encaminhamentos para a regulação. \n\n• Autocompletar Inteligente: Digite o código CROSS. Se o paciente já tiver cadastros anteriores, o sistema localizará e preencherá automaticamente Nome, Data de Nascimento e Telefone.\n• Atualização Global: Se você alterar o telefone ou outro dado de um paciente aqui, a atualização refletirá em todos os registros dele com apenas um clique.\n• Agilidade (Sem Mouse): Essa tela foi desenhada para velocidade. Você não precisa usar o mouse; basta usar a tecla "Enter" (ou Tab) para navegar do CROSS para o Nome, e assim por diante, até salvar.'
    },
    {
      id: 5,
      categoria: 'Encaminhamentos',
      icone: <FileCheck className="text-green-600" size={18} />,
      pergunta: 'Como registrar a Chegada de guias reguladas ou Correções?',
      resposta: 'Na aba "Marcar Chegada", você registra as guias que retornaram da regulação. O sistema oferece formulários com formatação pré-definida para preencher Local, Horário, Data e Observações. \n\nSe a guia voltar por erro, basta selecionar a opção "Correção" e preencher o motivo. Dica de atalho: Aperte as teclas "Ctrl + L" para abrir a pesquisa avançada, digite o CROSS, Nome ou Data de Nascimento, e aperte Enter para localizar o encaminhamento instantaneamente.'
    },
    {
      id: 6,
      categoria: 'Encaminhamentos',
      icone: <Search className="text-cyan-600" size={18} />,
      pergunta: 'Como consultar o Histórico Geral de encaminhamentos?',
      resposta: 'O Histórico Geral é seu painel de controle. Aqui você pode acompanhar o status de todos os encaminhamentos, identificar rapidamente quais estão com "Correção", visualizar os dados de marcação, editar informações ou descartar registros.\nVocê pode pesquisar rapidamente usando a barra de pesquisa ou o atalho "Ctrl + L".'
    },
    {
      id: 7,
      categoria: 'Exames',
      icone: <FileText className="text-teal-600" size={18} />,
      pergunta: 'Como dar baixa no recebimento de exames avulsos?',
      resposta: 'Em "Dar Baixa (Avulsos)", você registra a chegada de exames físicos na unidade (como Eletrocardiograma, Audiometria, etc.). O sistema é integrado com os encaminhamentos: ao digitar o cartão CROSS de um paciente já existente na base, o sistema puxa os dados principais automaticamente, restando a você apenas informar qual exame foi recebido.'
    },
    {
      id: 8,
      categoria: 'Manutenção (S.O.S)',
      icone: <Wrench className="text-orange-600" size={18} />,
      pergunta: 'Como abrir e gerenciar chamados de manutenção (S.O.S)?',
      resposta: 'Vá em "Gerar SOS" para abrir um chamado técnico. Os dados da unidade e do solicitante são preenchidos automaticamente e o sistema gera o número do chamado.\nNa tela de "Controle de SOS", você pode gerenciar o andamento atualizando o status para Pendente, Em Atendimento ou Concluído com apenas um clique. Também é possível imprimir a guia de manutenção, descartar e pesquisar chamados antigos.'
    },
    {
      id: 9,
      categoria: 'Pedidos Mensais',
      icone: <Package className="text-purple-600" size={18} />,
      pergunta: 'Como gerar pedidos de Materiais e Almoxarifado?',
      resposta: 'O sistema possui módulos separados para Material de Limpeza, Material de Escritório, Crônicos e Acamados, e Correlatos. O fluxo é simples: abra a categoria desejada, adicione os itens ou exclua os que não precisa, digite as quantidades e clique em gerar. O sistema criará um arquivo em formato DOCX ou Excel com o layout oficial já formatado e pronto para envio.'
    },
    {
      id: 10,
      categoria: 'WhatsApp',
      icone: <Send className="text-green-500" size={18} />,
      pergunta: 'Como funciona a Automação de Disparos para WhatsApp?',
      resposta: 'Este módulo é um complemento focado em produtividade para quem tem mais facilidade com tecnologia. Ele atua em conjunto com a extensão de navegador "WPPME.com". Você cria um modelo de texto (com variáveis) e o sistema gera uma planilha pronta, com todos os dados dos pacientes pré-formatados, permitindo o disparo de mensagens automáticas em massa.'
    },
    {
      id: 11,
      categoria: 'Configurações',
      icone: <Settings className="text-slate-600" size={18} />,
      pergunta: 'Para que serve a aba de Configurações?',
      resposta: 'Na aba de Configurações, você tem controle total sobre o sistema. Você pode alterar os dados padrão da unidade (como nome da unidade e responsável) para que saiam corretamente nos cabeçalhos impressos. Além disso, é o local onde você realiza o backup (salvar/exportar dados) e a restauração (importar dados) para garantir a segurança das informações ou transferi-las para outro computador.'
    }
  ];

  // Filtro inteligente para a barra de pesquisa do FAQ
  const faqFiltrado = dadosFAQ.filter(item => 
    item.pergunta.toLowerCase().includes(busca.toLowerCase()) ||
    item.resposta.toLowerCase().includes(busca.toLowerCase()) ||
    item.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  const alternarItem = (id) => {
    setAbertoId(abertoId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black selection:bg-blue-200">
      <div className="max-w-4xl mx-auto">
        
        {/* Cabeçalho */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="text-blue-900" size={28} />
            <h1 className="text-2xl font-black text-blue-950 uppercase tracking-tight">Manual de Uso & FAQ</h1>
          </div>
          <p className="text-gray-500 text-xs font-medium italic">Instruções práticas para operação das ferramentas do sistema FSPSS - Gestão Clínica.</p>
        </header>

        {/* Campo de Busca */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Digite o módulo ou o que deseja fazer (Ex: 'whatsapp', 'remessa', 'backup')..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-600 outline-none shadow-sm text-base font-medium text-black transition-all placeholder:text-gray-400"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        {/* Lista de Accordions */}
        <div className="space-y-3">
          {faqFiltrado.map((item) => {
            const isOpen = abertoId === item.id;
            return (
              <div 
                key={item.id} 
                className={`bg-white rounded-xl border-2 transition-all overflow-hidden shadow-sm ${
                  isOpen ? 'border-blue-600 ring-2 ring-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Botão do Tópico */}
                <button
                  onClick={() => alternarItem(item.id)}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left font-bold text-gray-900 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 p-2 bg-gray-50 rounded-lg border border-gray-100">
                      {item.icone}
                    </span>
                    <div>
                      <span className="text-[9px] uppercase font-black tracking-widest text-blue-600 block mb-0.5">
                        {item.categoria}
                      </span>
                      <span className="text-sm md:text-base font-extrabold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {item.pergunta}
                      </span>
                    </div>
                  </div>
                  <div className="text-gray-400 group-hover:text-black shrink-0">
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </button>

                {/* Resposta Expandida */}
                {isOpen && (
                  <div className="bg-slate-50 p-4 border-t-2 border-gray-100 text-xs md:text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-line">
                    {item.resposta}
                  </div>
                )}
              </div>
            );
          })}

          {faqFiltrado.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <p className="text-gray-400 font-medium italic">Nenhuma instrução encontrada para o termo pesquisado.</p>
            </div>
          )}
        </div>

        {/* Rodapé de Dica Rápida */}
        <div className="mt-8 bg-blue-950 text-white p-4 rounded-xl shadow-md">
          <h4 className="font-black uppercase tracking-wide text-xs text-blue-400">💡 Dica de Agilidade</h4>
          <p className="text-[11px] text-gray-300 mt-1 font-medium">
            No preenchimento de cadastros e pesquisas avançadas, procure utilizar o atalho <kbd className="bg-blue-900 px-1 rounded border border-blue-800">Ctrl + L</kbd> para buscar rapidamente, ou a tecla <kbd className="bg-blue-900 px-1 rounded border border-blue-800">Enter</kbd> para pular entre os campos sem precisar tirar as mãos do teclado!
          </p>
        </div>

      </div>
    </div>
  );
}