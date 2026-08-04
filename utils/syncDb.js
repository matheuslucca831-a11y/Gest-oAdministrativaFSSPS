import { db } from '../db'; // seu arquivo de config do Dexie

// Função para salvar o estado atual do Dexie em um arquivo local
// Nota: Isso funciona se o seu ambiente de compilação expuser o 'fs' (Node)
const syncToFile = async (tableName) => {
  const data = await db[tableName].toArray();
  
  // Se estiver no Electron/Unni com acesso ao node:
  if (typeof window !== 'undefined' && window.require) {
    const fs = window.require('fs');
    const path = window.require('path');
    const filePath = path.join(process.cwd(), `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
};

// Exemplo de como você vai salvar doravante:
export const safeAdd = async (tableName, record) => {
  await db[tableName].add(record);
  await syncToFile(tableName); // Salva no arquivo automaticamente após adicionar
};