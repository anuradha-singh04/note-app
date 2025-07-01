import React from 'react';

const Sidebar = ({
    notes,
    currentNote,
    searchQuery,
    theme,
    onSelectNote,
    onCreateNote,
    onToggleTheme,
    onSearch
}) => {
    const sortedNotes = [...notes].sort((a, b) =>
        new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );

    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>Notes</h2>
                <div className="header-controls">
                    <button
                        className="btn btn-primary"
                        title="New Note"
                        onClick={onCreateNote}
                    >
                        <span className="icon">+</span>
                    </button>
                    <button
                        className="btn btn-secondary"
                        title="Toggle Theme"
                        onClick={onToggleTheme}
                    >
                        <span className="icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
                    </button>
                </div>
            </div>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search notes..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>

            <div className="notes-list">
                {sortedNotes.length === 0 ? (
                    <div className="empty-state">
                        <p>No notes yet</p>
                        <small>Create your first note to get started!</small>
                    </div>
                ) : (
                    sortedNotes.map(note => (
                        <NoteItem
                            key={note.id || 'new'}
                            note={note}
                            isActive={currentNote && (
                                (currentNote.id && currentNote.id === note.id) ||
                                (!currentNote.id && !note.id && currentNote.createdAt === note.createdAt)
                            )}
                            onSelect={() => onSelectNote(note)}
                            escapeHtml={escapeHtml}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

const NoteItem = ({ note, isActive, onSelect, escapeHtml }) => {
    const title = note.title || 'Untitled Note';
    const preview = note.content ? note.content.substring(0, 100) + '...' : 'No content';
    const date = new Date(note.updatedAt || note.createdAt).toLocaleDateString();

    return (
        <div
            className={`note-item ${isActive ? 'active' : ''}`}
            onClick={onSelect}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onSelect();
                }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Note: ${title}`}
        >
            <div className="note-item-title">{title}</div>
            <div className="note-item-preview">{preview}</div>
            <div className="note-item-date">{date}</div>
        </div>
    );
};

export default Sidebar;
