const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

    saveNote: (note) => ipcRenderer.invoke('save-note', note),
    loadNotes: () => ipcRenderer.invoke('load-notes'),
    deleteNote: (noteId) => ipcRenderer.invoke('delete-note', noteId),
    searchNotes: (query) => ipcRenderer.invoke('search-notes', query),

    // for theme
    getTheme: () => ipcRenderer.invoke('get-theme'),
    setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),

    // for menu send data main to render
    onMenuNewNote: (callback) => ipcRenderer.on('menu-new-note', callback),
    onMenuSaveNote: (callback) => ipcRenderer.on('menu-save-note', callback),
    onMenuToggleTheme: (callback) => ipcRenderer.on('menu-toggle-theme', callback),

    // Utility
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});