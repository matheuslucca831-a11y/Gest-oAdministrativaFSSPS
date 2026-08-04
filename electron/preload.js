const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Mantém a sua função de impressão intacta:
  imprimirHtml: (html) => ipcRenderer.invoke('imprimir-html', html),
  
  // Ponte para fechar o app após o backup
  fecharApp: () => ipcRenderer.send('backup-concluido-pode-fechar'),

  // 👇 NOVO: gera o PDF e abre no visualizador padrão do Windows
  gerarPdfEAbrir: (opcoes) => ipcRenderer.invoke('gerar-pdf-e-abrir', opcoes),
});