import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-container ${type}`}>
      <div className="toast-content">
        <span className="material-symbols-outlined icon">
          {type === 'success' ? 'check_circle' : 'error'}
        </span>
        <p className="toast-message">{message}</p>
      </div>
      <div className="toast-progress-bar"></div>
    </div>
  );
};

export default Toast;