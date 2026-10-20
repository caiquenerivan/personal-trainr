// Só para a pré-visualização no navegador (o SQLite web exige WASM + headers
// COOP/COEP). O app não é publicado para web.
export const kvStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
  removeItem: (key: string) => window.localStorage.removeItem(key),
};
