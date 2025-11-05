const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('flashsearch', {
  setLicenseKey: (key) => ipcRenderer.send('set-license-key', String(key || '').trim()),
  close: () => ipcRenderer.send('close-subscription-portal')
});


