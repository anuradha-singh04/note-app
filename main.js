const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');

// Initialize store
const Store = require('electron-store');
const store = new Store();

let mainWindow;
function createWindow() {

  const windowBounds = store.get('windowBounds', {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined
  });

  mainWindow = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    x: windowBounds.x,
    y: windowBounds.y,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    if (store.get('windowMaximized', false)) {
      mainWindow.maximize();
    }
  });

  mainWindow.on('resize', saveWindowBounds);
  mainWindow.on('move', saveWindowBounds);

  mainWindow.on('maximize', () => {
    store.set('windowMaximized', true);
  });

  mainWindow.on('unmaximize', () => {
    store.set('windowMaximized', false);
  });




  mainWindow.on('close', (event) => {
    event.preventDefault();

    mainWindow.webContents.send('app-close-confirm');

    ipcMain.once('app-close-response', (e, { shouldClose, shouldSave, note }) => {
      if (shouldSave && note) {
        const notes = store.get('notes', {});
        const noteId = note.id || generateId();

        notes[noteId] = {
          ...note,
          id: noteId,
          updatedAt: new Date().toISOString()
        };

        store.set('notes', notes);
      }

      if (shouldClose) {
        mainWindow.destroy();
      }
    });
  });

  createMenu();
}

function saveWindowBounds() {
  if (mainWindow && !mainWindow.isMaximized()) {
    store.set('windowBounds', mainWindow.getBounds());
  }
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Note',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-note');
          }
        },
        {
          label: 'Save Note',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-note');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Theme',
          accelerator: 'CmdOrCtrl+T',
          click: () => {
            mainWindow.webContents.send('menu-toggle-theme');
          }
        },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Handlers
ipcMain.handle('save-note', async (event, note) => {
  try {
    const notes = store.get('notes', {});
    const noteId = note.id || generateId();

    notes[noteId] = {
      ...note,
      id: noteId,
      updatedAt: new Date().toISOString()
    };

    store.set('notes', notes);
    return { success: true, id: noteId };
  } catch (error) {
    console.error('Error saving note:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('load-notes', async () => {
  try {
    const notes = store.get('notes', {});
    return Object.values(notes);
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
});

ipcMain.handle('delete-note', async (event, noteId) => {
  try {
    const notes = store.get('notes', {});
    delete notes[noteId];
    store.set('notes', notes);
    return { success: true };
  } catch (error) {
    console.error('Error deleting note:', error);
    return { success: false, error: error.message };
  }
});

// theme light or dark
ipcMain.handle('get-theme', async () => {
  return store.get('theme', 'light');
});

ipcMain.handle('set-theme', async (event, theme) => {
  store.set('theme', theme);
  return theme;
});

ipcMain.handle('search-notes', async (event, query) => {
  try {
    const notes = store.get('notes', {});
    const notesArray = Object.values(notes);

    if (!query) return notesArray;

    const searchResults = notesArray.filter(note =>
      note.title.toLowerCase().includes(query.toLowerCase()) ||
      note.content.toLowerCase().includes(query.toLowerCase())
    );

    return searchResults;
  } catch (error) {
    console.error('Error searching notes:', error);
    return [];
  }
});

// Utility function to generate unique IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });
});