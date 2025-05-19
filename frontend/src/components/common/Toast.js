import React, { useEffect } from 'react';
import './Toast.css'; 

const Toast = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-notification toast-${type} show`}>
      {message}
      <button onClick={onClose} className="toast-close-btn">×</button>
    </div>
  );
};

export default Toast;