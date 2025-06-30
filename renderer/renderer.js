class NoteApp {
    constructor() {
        this.currentNote = null;
        this.notes = [];
        this.searchTimeout = null;
        
        this.initializeElements();
        this.bindEvents();
        this.loadTheme();
        this.loadNotes();
    }

    initializeElements() {
        // UI Elements
        this.noteTitle = document.getElementById('noteTitle');
        this.noteContent = document.getElementById('noteContent');
        this.notesList = document.getElementById('notesList');
        this.searchInput = document.getElementById('searchInput');
        this.emptyState = document.getElementById('emptyState');
        this.statusMessage = document.getElementById('statusMessage');
        this.characterCount = document.getElementById('characterCount');
        
        // Buttons
        this.newNoteBtn = document.getElementById('newNoteBtn');
        this.saveBtn = document.getElementById('saveBtn');
        this.deleteBtn = document.getElementById('deleteBtn');
        this.themeToggle = document.getElementById('themeToggle');
    }

    bindEvents() {
        // Button events
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.saveBtn.addEventListener('click', () => this.saveCurrentNote());
        this.deleteBtn.addEventListener('click', () => this.deleteCurrentNote());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Input events
        this.noteContent.addEventListener('input', () => this.updateCharacterCount());
        this.noteTitle.addEventListener('input', () => this.markAsModified());
        this.noteContent.addEventListener('input', () => this.markAsModified());
        
        // Search
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // new
        // document.addEventListener('keydown', (e) => {
        //     if (e.key === 'Tab' && document.activeElement === this.noteContent) {
        //         e.preventDefault();
        
        //         const firstNote = this.notesList.querySelector('.note-item');
        //         if (firstNote) {
        //             firstNote.focus();
        //         }
        //     }
        
        //     if (e.key === 'Delete' && document.activeElement.classList.contains('note-item')) {
        //         const noteId = document.activeElement.dataset.noteId;
        //         this.deleteNoteById(noteId);
        //     }
        // });


        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                this.handleAdvancedTabNavigation(e);
            }
            if (e.key === 'Delete' && document.activeElement.classList.contains('note-item')) {
                const noteId = document.activeElement.dataset.noteId;
                this.deleteNoteById(noteId);
            }
        });    



        // Menu events
        window.electronAPI.onMenuNewNote(() => this.createNewNote());
        window.electronAPI.onMenuSaveNote(() => this.saveCurrentNote());
        window.electronAPI.onMenuToggleTheme(() => this.toggleTheme());
        

        this.noteContent.addEventListener('blur', () => {
            if (this.currentNote && this.isModified()) {
                this.saveCurrentNote();
            }
        });
    }

    async loadTheme() {
        try {
            const theme = await window.electronAPI.getTheme();
            this.applyTheme(theme);
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        this.themeToggle.querySelector('.icon').textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    async toggleTheme() {
        try {
            const currentTheme = document.body.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            await window.electronAPI.setTheme(newTheme);
            this.applyTheme(newTheme);
            
            this.showStatus('Theme switched to ' + newTheme + ' mode', 'success');
        } catch (error) {
            console.error('Error toggling theme:', error);
            this.showStatus('Error switching theme', 'error');
        }
    }

    // data fetch from preload

    async loadNotes() {
        try {
            this.notes = await window.electronAPI.loadNotes();
            this.renderNotesList();
            
            // Load the first note if available
            if (this.notes.length > 0 && !this.currentNote) {
                this.loadNote(this.notes[0]);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            this.showStatus('Error loading notes', 'error');
        }
    }

    renderNotesList(notesToRender = this.notes) {
        this.notesList.innerHTML = '';
        
        if (notesToRender.length === 0) {
            this.notesList.appendChild(this.emptyState);
            return;
        }

        const sortedNotes = [...notesToRender].sort((a, b) => 
            new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
        );

        sortedNotes.forEach(note => {
            const noteElement = this.createNoteListItem(note);
            this.notesList.appendChild(noteElement);
        });
    }
    createNoteListItem(note) {
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        noteItem.dataset.noteId = note.id;
        noteItem.setAttribute('tabindex', '0'); 
        noteItem.setAttribute('role', 'button'); // For accessibility
        noteItem.setAttribute('aria-label', `Note: ${note.title || 'Untitled'}`);    
    
        if (this.currentNote && this.currentNote.id === note.id) {
            noteItem.classList.add('active');
        }
    
        const title = note.title || 'Untitled Note';
        const preview = note.content ? note.content.substring(0, 100) + '...' : 'No content';
        const date = new Date(note.updatedAt || note.createdAt).toLocaleDateString();
    
        noteItem.innerHTML = `
            <div class="note-item-title">${this.escapeHtml(title)}</div>
            <div class="note-item-preview">${this.escapeHtml(preview)}</div>
            <div class="note-item-date">${date}</div>
        `;
    
        noteItem.addEventListener('click', () => this.loadNote(note));
    
        return noteItem;
    }
    



    loadNote(note) {
        if (this.currentNote && this.isModified()) {
            if (!confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }

        this.currentNote = { ...note };
        this.noteTitle.value = note.title || '';
        this.noteContent.value = note.content || '';
        this.deleteBtn.style.display = 'inline-flex';
        
        this.updateCharacterCount();
        this.updateActiveNote();
        this.clearModified();
        
        // Focus on content area
        this.noteContent.focus();
    }

// create new blank if old changes not saved gives alert

    createNewNote() {
        if (this.currentNote && this.isModified()) {
            if (!confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }

        this.currentNote = {
            id: null,
            title: '',
            content: '',
            createdAt: new Date().toISOString()
        };

        this.noteTitle.value = '';
        this.noteContent.value = '';
        this.deleteBtn.style.display = 'none';
        
        this.updateCharacterCount();
        this.updateActiveNote();
        this.clearModified();
        
        // Focus on title input
        this.noteTitle.focus();
        
        this.showStatus('New note created', 'success');
    }

    // for save notes 

    async saveCurrentNote() {
        if (!this.currentNote) {
            this.showStatus('No note to save', 'error');
            return;
        }

        const title = this.noteTitle.value.trim();
        const content = this.noteContent.value.trim();

        if (!title && !content) {
            this.showStatus('Please add a title or content', 'error');
            return;
        }

        try {
            const noteToSave = {
                ...this.currentNote,
                title: title || 'Untitled Note',
                content: content,
                updatedAt: new Date().toISOString()
            };

            const result = await window.electronAPI.saveNote(noteToSave);

            if (result.success) {
                this.currentNote.id = result.id;
                this.currentNote.title = noteToSave.title;
                this.currentNote.content = noteToSave.content;
                this.currentNote.updatedAt = noteToSave.updatedAt;

                await this.loadNotes();
                this.clearModified();
                this.createNewNote();
                this.showStatus('Note saved successfully', 'success');
            } else {
                this.showStatus('Error saving note: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error saving note:', error);
            this.showStatus('Error saving note', 'error');
        }
    }

    // del by keyboard

    async deleteNoteById(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (!note) return;
    
        if (!confirm(`Delete note: "${note.title}"?`)) return;
    
        try {
            const result = await window.electronAPI.deleteNote(noteId);
            if (result.success) {
                await this.loadNotes();
                this.createNewNote();
                this.showStatus('Note deleted via keyboard', 'success');
            } else {
                this.showStatus('Error deleting note', 'error');
            }
        } catch (err) {
            console.error(err);
            this.showStatus('Failed to delete note', 'error');
        }
    }
    
    // for del notes
    async deleteCurrentNote() {
        if (!this.currentNote || !this.currentNote.id) {
            this.showStatus('No note to delete', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            return;
        }

        try {
            const result = await window.electronAPI.deleteNote(this.currentNote.id);

            if (result.success) {
                await this.loadNotes();
                this.createNewNote();
                this.showStatus('Note deleted successfully', 'success');
            } else {
                this.showStatus('Error deleting note: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            this.showStatus('Error deleting note', 'error');
        }
    }

    // for search

    async handleSearch(query) {
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(async () => {
            try {
                const searchResults = await window.electronAPI.searchNotes(query);
                this.renderNotesList(searchResults);
                
                if (query && searchResults.length === 0) {
                    this.showStatus('No notes found matching your search', 'error');
                } else if (query) {
                    this.showStatus(`Found ${searchResults.length} note(s)`, 'success');
                }
            } catch (error) {
                console.error('Error searching notes:', error);
                this.showStatus('Error searching notes', 'error');
            }
        }, 300);
    }
 
    // shortcut keys

    handleKeyboardShortcuts(e) {
      
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.saveCurrentNote();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            this.createNewNote();
        }
        
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            this.toggleTheme();
        }
        
        if (e.key === 'Escape' && document.activeElement === this.searchInput) {
            this.searchInput.value = '';
            this.handleSearch('');
        }
    }

    //characters show karta hai 

    updateCharacterCount() {
        const count = this.noteContent.value.length;
        this.characterCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
    }

    updateActiveNote() {
        // Update active state in notes list
        document.querySelectorAll('.note-item').forEach(item => {
            item.classList.remove('active');
            if (this.currentNote && item.dataset.noteId === this.currentNote.id) {
                item.classList.add('active');
            }
        });
    }
 
    markAsModified() {
        if (this.currentNote) {
            this.currentNote.modified = true;
        }
    }

    clearModified() {
        if (this.currentNote) {
            this.currentNote.modified = false;
        }
    }

    isModified() {
        return this.currentNote && this.currentNote.modified;
    }

    showStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message ${type}`;
        
        // Clear status after 3 seconds
        setTimeout(() => {
            this.statusMessage.textContent = '';
            this.statusMessage.className = 'status-message';
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NoteApp();
});

// unsaved notes warning before unload
window.addEventListener('beforeunload', (e) => {
    if (window.noteApp && window.noteApp.isModified()) {
        e.preventDefault();
        e.returnValue = '';
    }
});