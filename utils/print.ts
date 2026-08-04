export async function imprimirHtmlNoDesktop(conteudoHtml: string) {
  // Se estiver no Electron, usa impressão nativa via IPC
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    await (window as any).electronAPI.imprimirHtml(conteudoHtml);
    return;
  }

  // Fallback para navegador normal (iframe)
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  document.body.appendChild(iframe);
  const doc = iframe.contentWindow?.document || iframe.contentDocument;

  if (doc) {
    doc.open();
    doc.write(conteudoHtml);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 500);
  }
}