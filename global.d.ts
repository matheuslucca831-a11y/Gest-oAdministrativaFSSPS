export {};

declare global {
  interface Window {
    electronAPI: {
      imprimirHtml(html: string): Promise<boolean>;
      previewPDF(html: string): Promise<boolean>;
      fecharApp(): void;
    };
  }
}