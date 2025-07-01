import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import StatusMessage from './components/StatusMessage';

const App = () => {
    const [notes, setNotes] = useState([]);
    const [allNotes, setAllNotes] = useState([]); // Store all notes separately
    const [currentNote, setCurrentNote] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [theme, setTheme] = useState('light');
    const [statusMessage, setStatusMessage] = useState({ message: '', type: '' });
    const [isModified, setIsModified] = useState(false);

    // Load initial data
    useEffect(() => {
        const initializeApp = async () => {
            await loadNotes();
            await loadTheme();
        };
        initializeApp();
    }, []);

    // Set up menu event listeners only once
    useEffect(() => {
        if (!window.electronAPI) return;

        // Clear any existing listeners first
        window.electronAPI.removeAllMenuListeners();

        // Set up new listeners with direct functions (no memoization needed here)
        window.electronAPI.onMenuNewNote(() => {
            if (currentNote && isModified) {
                if (!confirm('You have unsaved changes. Do you want to discard them?')) return;
            }
            const newNote = {
                id: null,
                title: '',
                content: '',
                createdAt: new Date().toISOString()
            };
            setCurrentNote(newNote);
            setIsModified(false);
            setSearchQuery('');
            setNotes(allNotes);
            showStatus('New note created', 'success');
        });

        window.electronAPI.onMenuSaveNote(() => {
            if (currentNote) {
                saveCurrentNote();
            }
        });

        window.electronAPI.onMenuToggleTheme(() => {
            toggleTheme();
        });

        window.electronAPI.onAppCloseConfirm(() => {
            handleAppClose();
        });

        // Cleanup function
        return () => {
            if (window.electronAPI) {
                window.electronAPI.removeAllMenuListeners();
            }
        };
    }, []); // No dependencies to prevent re-running

    const loadNotes = async () => {
        try {
            const loadedNotes = await window.electronAPI.loadNotes();
            setAllNotes(loadedNotes);
            setNotes(loadedNotes);

            // Only auto-select first note on initial load when no note is currently active
            if (loadedNotes.length > 0 && !currentNote) {
                setCurrentNote({ ...loadedNotes[0] });
                setIsModified(false);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
            showStatus('Error loading notes', 'error');
        }
    };

    const loadTheme = async () => {
        try {
            const savedTheme = await window.electronAPI.getTheme();
            setTheme(savedTheme);
            applyTheme(savedTheme);
        } catch (error) {
            console.error('Error loading theme:', error);
        }
    };

    const applyTheme = (themeName) => {
        document.body.setAttribute('data-theme', themeName);
    };

    const showStatus = (message, type = 'info') => {
        setStatusMessage({ message, type });
        setTimeout(() => {
            setStatusMessage({ message: '', type: '' });
        }, 3000);
    };

    const createNewNote = () => {
        if (currentNote && isModified) {
            if (!confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }

        const newNote = {
            id: null,
            title: '',
            content: '',
            createdAt: new Date().toISOString()
        };

        setCurrentNote(newNote);
        setIsModified(false);
        setSearchQuery('');
        setNotes(allNotes);
        showStatus('New note created', 'success');
    };

    const selectNote = (note) => {
        if (currentNote && isModified) {
            if (!confirm('You have unsaved changes. Do you want to discard them?')) {
                return;
            }
        }

        setCurrentNote({ ...note });
        setIsModified(false);
    };

    const saveCurrentNote = async () => {
        if (!currentNote) {
            showStatus('No note to save', 'error');
            return;
        }

        const title = currentNote.title?.trim() || '';
        const content = currentNote.content?.trim() || '';

        if (!title && !content) {
            showStatus('Please add a title or content', 'error');
            return;
        }

        try {
            const noteToSave = {
                ...currentNote,
                title: title || 'Untitled Note',
                content: content,
                updatedAt: new Date().toISOString()
            };

            const result = await window.electronAPI.saveNote(noteToSave);

            if (result.success) {
                // Update current note with saved data
                setCurrentNote(prev => ({
                    ...prev,
                    id: result.id,
                    title: noteToSave.title,
                    content: noteToSave.content,
                    updatedAt: noteToSave.updatedAt
                }));

                setIsModified(false);

                // Reload notes list
                const updatedNotes = await window.electronAPI.loadNotes();
                setAllNotes(updatedNotes);
                setNotes(updatedNotes);

                showStatus('Note saved successfully', 'success');
            } else {
                showStatus('Error saving note: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error saving note:', error);
            showStatus('Error saving note', 'error');
        }
    };

    const deleteCurrentNote = async () => {
        if (!currentNote || !currentNote.id) {
            showStatus('No note to delete', 'error');
            return;
        }

        if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            return;
        }

        try {
            const result = await window.electronAPI.deleteNote(currentNote.id);

            if (result.success) {
                // Clear search
                setSearchQuery('');

                // Create new blank note immediately
                const newNote = {
                    id: null,
                    title: '',
                    content: '',
                    createdAt: new Date().toISOString()
                };

                setCurrentNote(newNote);
                setIsModified(false);

                // Reload notes list
                const updatedNotes = await window.electronAPI.loadNotes();
                setAllNotes(updatedNotes);
                setNotes(updatedNotes);

                showStatus('Note deleted successfully', 'success');
            } else {
                showStatus('Error deleting note: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            showStatus('Error deleting note', 'error');
        }
    };

    const toggleTheme = async () => {
        try {
            const newTheme = theme === 'light' ? 'dark' : 'light';
            await window.electronAPI.setTheme(newTheme);
            setTheme(newTheme);
            applyTheme(newTheme);
            showStatus(`Theme switched to ${newTheme} mode`, 'success');
        } catch (error) {
            console.error('Error toggling theme:', error);
            showStatus('Error switching theme', 'error');
        }
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setNotes(allNotes);
            return;
        }

        try {
            const searchResults = await window.electronAPI.searchNotes(query);
            setNotes(searchResults);

            if (searchResults.length === 0) {
                showStatus('No notes found matching your search', 'error');
            } else {
                showStatus(`Found ${searchResults.length} note(s)`, 'success');
            }
        } catch (error) {
            console.error('Error searching notes:', error);
            showStatus('Error searching notes', 'error');
        }
    };

    const updateCurrentNote = (field, value) => {
        setCurrentNote(prev => ({ ...prev, [field]: value }));
        setIsModified(true);
    };

    const handleAppClose = async () => {
        if (currentNote && isModified) {
            const shouldSave = confirm('You have unsaved changes. Do you want to save before closing?');

            if (shouldSave) {
                await saveCurrentNote();
            }

            window.electronAPI.sendAppCloseResponse({
                shouldClose: true,
                shouldSave: shouldSave,
                note: shouldSave ? currentNote : null
            });
        } else {
            window.electronAPI.sendAppCloseResponse({
                shouldClose: true,
                shouldSave: false,
                note: null
            });
        }
    };

    // Keyboard shortcuts - simple version without dependencies
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveCurrentNote();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                createNewNote();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 't') {
                e.preventDefault();
                toggleTheme();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Filter notes based on search
    const filteredNotes = notes;

    return (
        <div className="app-container">
            <Sidebar
                notes={filteredNotes}
                currentNote={currentNote}
                searchQuery={searchQuery}
                theme={theme}
                onSelectNote={selectNote}
                onCreateNote={createNewNote}
                onToggleTheme={toggleTheme}
                onSearch={handleSearch}
            />

            <div className="main-content">
                <Editor
                    currentNote={currentNote}
                    isModified={isModified}
                    onUpdateNote={updateCurrentNote}
                    onSaveNote={saveCurrentNote}
                    onDeleteNote={deleteCurrentNote}
                />

                <StatusMessage message={statusMessage.message} type={statusMessage.type} />
            </div>
        </div>
    );
};

export default App;
