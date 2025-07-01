import React from 'react';

const StatusMessage = ({ message, type }) => {
    if (!message) return null;

    return (
        <div className={`status-message ${type}`}>
            {message}
        </div>
    );
};

export default StatusMessage;
