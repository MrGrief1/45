const { contextBridge, ipcRenderer } = require('electron');

// Предоставляем безопасный доступ к функциям Electron из renderer.js
contextBridge.exposeInMainWorld('electronAPI', {
    // Отправка команд в main.js
    resizeWindow: (height) => ipcRenderer.send('resize-window', height),
    searchQuery: (query) => ipcRenderer.send('search-query', query),
    updateConfig: (config) => ipcRenderer.send('update-config', config),
    copyText: (text) => ipcRenderer.send('copy-text', text),
    showContextMenu: () => ipcRenderer.send('show-context-menu'),

    // Получение данных от main.js
    onConfigUpdated: (callback) => ipcRenderer.on('config-updated', (event, ...args) => callback(...args)),
    onClipboardUpdated: (callback) => ipcRenderer.on('clipboard-updated', (event, ...args) => callback(...args)),
});