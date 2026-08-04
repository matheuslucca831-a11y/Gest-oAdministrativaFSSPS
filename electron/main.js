const { app, BrowserWindow, protocol, ipcMain, shell, Menu } = require('electron'); // 👈 adicionei 'Menu'
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, '../out');

// 1. Variável global de controle de fechamento
let podeFecharOApp = false;

// 👇 NOVO: remove a barra de menu (File/Edit/View/Window/Help) de TODAS as janelas do app
Menu.setApplicationMenu(null);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,

    // 👇 NOVO: esconde a barra de menu (funciona junto com o Menu.setApplicationMenu acima,
    // mas deixo aqui também porque em alguns casos o Windows recria a barra sozinho)
    autoHideMenuBar: true,

    // 👇 NOVO: não mostra a janela até estar pronta, evitando o "flash" antes de maximizar
    show: false,

    // Ícone da janela
    icon: path.join(__dirname, "../public/icon.ico"),

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(outDir, 'index.html'));

  // 👇 NOVO: abre já maximizada (expandida), sem "flash" da janela pequena
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });

  // 👇 NOVO: como a barra de menu foi removida, o atalho padrão de DevTools some junto.
  // Aqui a gente recria manualmente: F12 ou Ctrl+Shift+I abre/fecha o console.
  win.webContents.on('before-input-event', (event, input) => {
    const isF12 = input.key === 'F12';
    const isCtrlShiftI =
      input.control && input.shift && input.key.toLowerCase() === 'i';

    if (isF12 || isCtrlShiftI) {
      win.webContents.toggleDevTools();
    }
  });

  // =========================================================
  // 2. A MÁGICA: Interceptando o "X" diretamente na Janela
  // =========================================================
  win.on('close', (e) => {
    if (!podeFecharOApp) {
      e.preventDefault();
      win.webContents.executeJavaScript(`
        window.dispatchEvent(new Event('tentou-fechar-app'));
      `).catch(() => {});
    }
  });
  // =========================================================

  // Handler de impressão via IPC (mantido intacto)
  ipcMain.handle('imprimir-html', async (event, htmlContent) => {
    try {
      const nomeArquivo = `guia_${Date.now()}.html`;
      const caminhoTemp = path.join(app.getPath('temp'), nomeArquivo);

      fs.writeFileSync(caminhoTemp, htmlContent, 'utf-8');
      await shell.openPath(caminhoTemp); // abre no navegador padrão (Edge)

      return true;
    } catch (err) {
      console.error('Erro ao abrir HTML no navegador:', err);
      return false;
    }
  });

  // 👇 NOVO: Gera PDF direto (sem a caixa de diálogo quebrada) e abre no visualizador padrão
  ipcMain.handle('gerar-pdf-e-abrir', async (event, opcoes = {}) => {
    try {
      const pdfBuffer = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        landscape: !!opcoes.landscape, // 👈 novo
        margins: { top: 0.15, bottom: 0.4, left: 0.4, right: 0.4 },
      });

      const nomeArquivo = `documento_${Date.now()}.pdf`;
      const caminhoTemp = path.join(app.getPath('temp'), nomeArquivo);

      fs.writeFileSync(caminhoTemp, pdfBuffer);
      await shell.openPath(caminhoTemp);

      return { sucesso: true };
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      return { sucesso: false, erro: err.message };
    }
  });

  win.webContents.on('will-navigate', (event, url) => {
    event.preventDefault();
    try {
      const parsed = new URL(url);
      let pagina = parsed.pathname
        .replace(/^\/[A-Za-z]:\//, '')
        .replace(/^\//, '')
        .replace(/\/$/, '');
      const filePath = pagina
        ? path.join(outDir, pagina, 'index.html')
        : path.join(outDir, 'index.html');
      win.loadFile(filePath);
    } catch (e) {
      win.loadFile(path.join(outDir, 'index.html'));
      win.webContents.openDevTools();
    }
  });

  win.webContents.session.protocol.interceptFileProtocol('file', (request, callback) => {
    let filePath = decodeURIComponent(request.url.replace('file:///', '').replace(/\?.*$/, ''));
    filePath = filePath.replace(/\//g, path.sep);
    if (fs.existsSync(filePath)) return callback({ path: filePath });
    const segments = filePath.split(path.sep);
    const nextIndex = segments.indexOf('_next');
    if (nextIndex !== -1) {
      const fromNext = path.join(outDir, '_next', ...segments.slice(nextIndex + 1));
      if (fs.existsSync(fromNext)) return callback({ path: fromNext });
    }
    callback({ path: filePath });
  });
}

ipcMain.on('backup-concluido-pode-fechar', () => {
  podeFecharOApp = true;
  app.exit(0);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});