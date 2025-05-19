import React, { useEffect, useState, useCallback, useRef } from 'react';
import './accessibility.css';

const AccessibilityTools = () => {
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const [highlightLinks, setHighlightLinks] = useState(false);
  const [stopAnimations, setStopAnimations] = useState(false);
  const [largeCursor, setLargeCursor] = useState(false);
  const [readableFont, setReadableFont] = useState(false);
  const [readingGuide, setReadingGuide] = useState(false);

  const [position, setPosition] = useState(() => {
    try {
      const savedPosition = localStorage.getItem('accessibilityTogglePosition');
      if (savedPosition) {
        const parsed = JSON.parse(savedPosition);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number' &&
            parsed.x >= 0 && parsed.x <= (window.innerWidth - 50) && 
            parsed.y >= 0 && parsed.y <= (window.innerHeight - 50)) { 
          return parsed;
        }
      }
    } catch (error) {
      console.error("Erro ao carregar posição do localStorage:", error);
    }
    return { x: window.innerWidth - 75, y: window.innerHeight - 75 }; 
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, initialButtonX: 0, initialButtonY: 0 });
  const toggleButtonRef = useRef(null);
  const wrapperRef = useRef(null);

  const toggleToolbar = useCallback(() => {
    if (!isDragging) {
      setIsToolbarOpen(prev => !prev);
    }
  }, [isDragging]);

  const toggleHighContrast = useCallback(() => setHighContrast(prev => !prev), []);
  const increaseFontSize = useCallback(() => setFontSizeMultiplier(prev => Math.min(prev + 0.125, 2.0)), []);
  const decreaseFontSize = useCallback(() => setFontSizeMultiplier(prev => Math.max(prev - 0.125, 0.75)), []);
  const toggleHighlightLinks = useCallback(() => setHighlightLinks(prev => !prev), []);
  const toggleStopAnimations = useCallback(() => setStopAnimations(prev => !prev), []);
  const toggleLargeCursor = useCallback(() => setLargeCursor(prev => !prev), []);
  const toggleReadableFont = useCallback(() => setReadableFont(prev => !prev), []);
  const toggleReadingGuide = useCallback(() => setReadingGuide(prev => !prev), []);

  const resetAccessibility = useCallback(() => {
    setHighContrast(false);
    setFontSizeMultiplier(1);
    setHighlightLinks(false);
    setStopAnimations(false);
    setLargeCursor(false);
    setReadableFont(false);
    setReadingGuide(false);
  }, []);

  useEffect(() => { document.body.classList.toggle('high-contrast', highContrast); }, [highContrast]);
  useEffect(() => { document.documentElement.style.fontSize = `${fontSizeMultiplier * 100}%`; return () => { document.documentElement.style.fontSize = ''; }; }, [fontSizeMultiplier]);
  useEffect(() => { document.body.classList.toggle('highlight-links-active', highlightLinks); }, [highlightLinks]);
  useEffect(() => { document.body.classList.toggle('stop-animations-active', stopAnimations); }, [stopAnimations]);
  useEffect(() => { document.body.classList.toggle('large-cursor-active', largeCursor); }, [largeCursor]);
  useEffect(() => { document.body.classList.toggle('readable-font-active', readableFont); }, [readableFont]);

  useEffect(() => {
    let guideElement = document.getElementById('reading-guide-element');
    const handleMouseMoveGuide = (e) => { if (guideElement) { guideElement.style.top = `${e.clientY}px`; } };
    if (readingGuide) {
      if (!guideElement) {
        guideElement = document.createElement('div');
        guideElement.id = 'reading-guide-element';
        document.body.appendChild(guideElement);
      }
      guideElement.style.display = 'block';
      document.addEventListener('mousemove', handleMouseMoveGuide);
    } else {
      if (guideElement) {
        guideElement.style.display = 'none';
        if (guideElement.style.display === 'none' && document.body.contains(guideElement)) {
        }
      }
       document.removeEventListener('mousemove', handleMouseMoveGuide); // Garante remoção
    }
    return () => { document.removeEventListener('mousemove', handleMouseMoveGuide); };
  }, [readingGuide]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    if (e.button !== 0 || !toggleButtonRef.current) return;
    setIsDragging(true);
    const rect = toggleButtonRef.current.getBoundingClientRect();
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      initialButtonX: rect.left, 
      initialButtonY: rect.top,
    });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !wrapperRef.current || !toggleButtonRef.current) return;

      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      let newX = dragStart.initialButtonX + dx;
      let newY = dragStart.initialButtonY + dy;

      const buttonWidth = toggleButtonRef.current.offsetWidth;
      const buttonHeight = toggleButtonRef.current.offsetHeight;
      
      newX = Math.max(0, Math.min(newX, window.innerWidth - buttonWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - buttonHeight));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.classList.add('no-select-dragging'); 
    } else {
      document.body.classList.remove('no-select-dragging');
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('no-select-dragging');
    };
  }, [isDragging, dragStart]);

  useEffect(() => {
    localStorage.setItem('accessibilityTogglePosition', JSON.stringify(position));
  }, [position]);


  useEffect(() => {
    const handleResize = () => {
      if (!toggleButtonRef.current) return;
      const buttonWidth = toggleButtonRef.current.offsetWidth;
      const buttonHeight = toggleButtonRef.current.offsetHeight;
      setPosition(prevPos => ({
        x: Math.max(0, Math.min(prevPos.x, window.innerWidth - buttonWidth)),
        y: Math.max(0, Math.min(prevPos.y, window.innerHeight - buttonHeight))
      }));
    };
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (toggleButtonRef.current) {
      toggleButtonRef.current.classList.toggle('dragging', isDragging);
    }
  }, [isDragging]);

  const getToolbarStyle = () => {
    if (!isToolbarOpen || !wrapperRef.current || !toggleButtonRef.current) return {};

    const spaceBelow = window.innerHeight - (position.y + toggleButtonRef.current.offsetHeight);
    const spaceAbove = position.y;
    const spaceRight = window.innerWidth - (position.x + toggleButtonRef.current.offsetWidth);
    const spaceLeft = position.x;

    const toolbarHeightEstimate = 450; 
    const toolbarWidthEstimate = 220; 

    let style = {
        right: '0px', 
        bottom: `${toggleButtonRef.current.offsetHeight + 10}px`, 
    };

    if (spaceAbove < toolbarHeightEstimate && spaceBelow > spaceAbove) {
        style.top = `${toggleButtonRef.current.offsetHeight + 10}px`;
        style.bottom = 'auto';
    }

    if (spaceLeft < toolbarWidthEstimate && spaceRight > spaceLeft && (position.x > window.innerWidth / 2)) {
        style.left = 'auto';
        style.right = `${toggleButtonRef.current.offsetWidth + 10}px`;
    } else if (spaceRight < toolbarWidthEstimate && spaceLeft > spaceRight && (position.x < window.innerWidth / 2) ){
         style.left = `${toggleButtonRef.current.offsetWidth + 10}px`;
         style.right = 'auto';
    }


    return style;
  };


  return (
    <div 
      ref={wrapperRef}
      className="accessibility-toolbar-wrapper" 
      role="region" 
      aria-label="Ferramentas de Acessibilidade"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <div 
        className={`accessibility-toolbar ${isToolbarOpen ? 'open' : ''}`} 
        id="accessibility-tools-panel"
        aria-hidden={!isToolbarOpen}
        style={getToolbarStyle()}
      >
        <button onClick={toggleHighContrast} className={highContrast ? 'active' : ''} aria-pressed={highContrast} title={highContrast ? "Desativar Alto Contraste" : "Ativar Alto Contraste"} >
          <i className="fas fa-adjust"></i> Alto Contraste
        </button>
        <button onClick={increaseFontSize} aria-label="Aumentar tamanho da fonte" title="Aumentar Fonte" >
          <i className="fas fa-search-plus"></i> Aumentar Fonte
        </button>
        <button onClick={decreaseFontSize} aria-label="Diminuir tamanho da fonte" title="Diminuir Fonte" >
          <i className="fas fa-search-minus"></i> Diminuir Fonte
        </button>
        <button onClick={toggleHighlightLinks} className={highlightLinks ? 'active' : ''} aria-pressed={highlightLinks} title={highlightLinks ? "Desativar Destaque de Links" : "Ativar Destaque de Links"} >
          <i className="fas fa-link"></i> Destacar Links
        </button>
        <button onClick={toggleReadableFont} className={readableFont ? 'active' : ''} aria-pressed={readableFont} title={readableFont ? "Desativar Fonte Legível" : "Ativar Fonte Legível"} >
          <i className="fas fa-font"></i> Fonte Legível
        </button>
        <button onClick={toggleStopAnimations} className={stopAnimations ? 'active' : ''} aria-pressed={stopAnimations} title={stopAnimations ? "Permitir Animações" : "Parar Animações"} >
          <i className="fas fa-film"></i> Parar Animações
        </button>
        <button onClick={toggleLargeCursor} className={largeCursor ? 'active' : ''} aria-pressed={largeCursor} title={largeCursor ? "Cursor Padrão" : "Cursor Maior"} >
          <i className="fas fa-mouse-pointer"></i> Cursor Maior
        </button>
        <button onClick={toggleReadingGuide} className={readingGuide ? 'active' : ''} aria-pressed={readingGuide} title={readingGuide ? "Desativar Guia de Leitura" : "Ativar Guia de Leitura"} >
          <i className="fas fa-ruler-horizontal"></i> Guia de Leitura
        </button>
        <hr className="my-2 accessibility-hr"/>
        <button onClick={resetAccessibility} aria-label="Resetar configurações de acessibilidade" title="Resetar Acessibilidade" >
          <i className="fas fa-undo"></i> Resetar Tudo
        </button>
      </div>

      <button 
        ref={toggleButtonRef}
        className={`accessibility-toggle-button ${isToolbarOpen ? 'open' : ''}`}
        onClick={toggleToolbar}
        onMouseDown={handleMouseDown}
        aria-expanded={isToolbarOpen}
        aria-controls="accessibility-tools-panel"
        title={isToolbarOpen ? "Fechar Ferramentas de Acessibilidade" : "Abrir Ferramentas de Acessibilidade"}
        style={{ touchAction: 'none' }} 
      >
        <i className={`fas ${isToolbarOpen ? 'fa-times' : 'fa-universal-access'}`}></i>
        <span className="visually-hidden">{isToolbarOpen ? "Fechar Ferramentas" : "Abrir Ferramentas"}</span>
      </button>
    </div>
  );
};

export default AccessibilityTools;