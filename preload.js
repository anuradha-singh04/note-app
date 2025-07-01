const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Note operations
    saveNote: (note) => ipcRenderer.invoke('save-note', note),
    loadNotes: () => ipcRenderer.invoke('load-notes'),
    deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
    searchNotes: (query) => ipcRenderer.invoke('search-notes', query),

    // Theme operations
    getTheme: () => ipcRenderer.invoke('get-theme'),
    setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),

    // Menu event listeners
    onMenuNewNote: (callback) => ipcRenderer.on('menu-new-note', callback),
    onMenuSaveNote: (callback) => ipcRenderer.on('menu-save-note', callback),
    onMenuToggleTheme: (callback) => ipcRenderer.on('menu-toggle-theme', callback),
    onAppCloseConfirm: (callback) => ipcRenderer.on('app-close-confirm', callback),

    // Cleanup all listeners for specific channels
    removeAllMenuListeners: () => {
        ipcRenderer.removeAllListeners('menu-new-note');
        ipcRenderer.removeAllListeners('menu-save-note');
        ipcRenderer.removeAllListeners('menu-toggle-theme');
        ipcRenderer.removeAllListeners('app-close-confirm');
    },

    // App close handling
    sendAppCloseResponse: (data) => ipcRenderer.send('app-close-response', data)
});