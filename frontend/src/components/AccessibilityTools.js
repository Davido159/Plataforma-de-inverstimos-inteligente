import React, { useEffect, useState } from 'react';
import './accessibility.css';

const AccessibilityTools = () => {
  const [highContrast, setHighContrast] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    document.body.classList.toggle('high-contrast', highContrast);
    document.body.style.zoom = zoom;
  }, [highContrast, zoom]);

  return (
    <div className="accessibility-toolbar" aria-label="Ferramentas de acessibilidade">
      <button onClick={() => setHighContrast(!highContrast)} aria-pressed={highContrast}>
        Alto Contraste
      </button>
      <button onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))} aria-label="Aumentar Zoom">
        Zoom +
      </button>
      <button onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.8))} aria-label="Diminuir Zoom">
        Zoom -
      </button>
    </div>
  );
};

export default AccessibilityTools;
