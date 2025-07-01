import React, { useEffect, useRef } from 'react';

const Editor = ({ currentNote, isModified, onUpdateNote, onSaveNote, onDeleteNote }) => {
    const titleRef = useRef(null);
    const contentRef = useRef(null);

    useEffect(() => {
        // Auto-focus on title when creating a new note
        if (currentNote && !currentNote.id && titleRef.current) {
            // Small delay to ensure the component is fully rendered
            const timeoutId = setTimeout(() => {
                titleRef.current.focus();
                titleRef.current.select(); // Select all text if any
            }, 100);

            return () => clearTimeout(timeoutId);
        }
    }, [currentNote?.id]); // React to changes in note ID specifically

    // Auto-save when losing focus
    useEffect(() => {
        const handleBlur = () => {
            if (currentNote && isModified) {
                onSaveNote();
            }
        };

        const contentElement = contentRef.current;
        if (contentElement) {
            contentElement.addEventListener('blur', handleBlur);
            return () => contentElement.removeEventListener('blur', handleBlur);
        }
    }, [currentNote, isModified, onSaveNote]);

    if (!currentNote) {
        return (
            <div className="editor-container">
                <div className="editor-placeholder">
                    <h3>Welcome to Note App</h3>
                    <p>Select a note from the sidebar or create a new one to get started.</p>
                </div>
            </div>
        );
    }

    const characterCount = currentNote.content ? currentNote.content.length : 0;

    return (
        <div className="editor-container">
            <div className="editor-header">
                <input
                    ref={titleRef}
                    type="text"
                    placeholder="Note Title"
                    className="note-title-input"
                    value={currentNote?.title || ''}
                    onChange={(e) => onUpdateNote('title', e.target.value)}
                    disabled={false} // Ensure the field is always enabled
                />
                <div className="editor-controls">
                    <button
                        className="btn btn-success"
                        onClick={onSaveNote}
                        disabled={!isModified}
                    >
                        Save
                    </button>
                    {currentNote?.id && (
                        <button
                            className="btn btn-danger"
                            onClick={onDeleteNote}
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>

            <textarea
                ref={contentRef}
                placeholder="Start writing your note..."
                className="note-editor"
                value={currentNote?.content || ''}
                onChange={(e) => onUpdateNote('content', e.target.value)}
                disabled={false} // Ensure the field is always enabled
            />

            <div className="editor-footer">
                <span className="character-count">
                    {characterCount} character{characterCount !== 1 ? 's' : ''}
                </span>
            </div>
        </div>
    );
};

export default Editor;
