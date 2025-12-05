const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  generatePdf: (nota) => ipcRenderer.invoke('generate-pdf', nota)
});
