import React, { useState, useEffect } from 'react';
import './EducationPage.css'; 

const EducationPage = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const modalRefs = React.useRef({});

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('/educational-content.json'); 
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setContent(data);
        data.forEach(item => {
          if (item.type === 'video' && item.embedUrl) {
            modalRefs.current[item.id] = React.createRef();
          }
        });
      } catch (e) {
        console.error("Erro ao carregar conteúdo educacional:", e);
        setError('Não foi possível carregar o conteúdo educacional. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const filteredContent = content.filter(item => {
    const matchesFilter = filter === 'todos' || item.type === filter;
    const matchesSearch = searchTerm.trim() === '' ||
                          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    return matchesFilter && matchesSearch;
  });

  const handleOpenVideoModal = (item) => {
    const modalElement = document.getElementById(`videoModal-${item.id}`);
    const iframe = document.getElementById(`videoIframe-${item.id}`);

    if (modalElement && iframe && window.bootstrap && typeof window.bootstrap.Modal === 'function') {
      if (iframe.src !== item.embedUrl) {
          iframe.src = item.embedUrl;
      }
      
      let modalInstance = window.bootstrap.Modal.getInstance(modalElement);
      if (!modalInstance) {
          modalInstance = new window.bootstrap.Modal(modalElement);
      }
      modalInstance.show();

      const handleModalHidden = () => {
        if (iframe) {
          iframe.src = ""; 
        }
        modalElement.removeEventListener('hidden.bs.modal', handleModalHidden); 
      };
      
      modalElement.removeEventListener('hidden.bs.modal', handleModalHidden); 
      modalElement.addEventListener('hidden.bs.modal', handleModalHidden, { once: true }); 

    } else {
      console.error("Bootstrap Modal ou elementos não encontrados, ou vídeo sem embedUrl. Abrindo link direto.");
      window.open(item.url, '_blank', 'noopener,noreferrer');
    }
  };


  const renderContentItem = (item) => {
    return (
      <div key={item.id} className="col-md-6 col-lg-4 mb-4 d-flex align-items-stretch">
        <div className="card education-card shadow-sm h-100">
          {item.imageUrl && (
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="education-card-image-link">
                <img src={item.imageUrl} className="card-img-top education-card-img" alt={item.title} />
            </a>
          )}
          <div className="card-body d-flex flex-column">
            <h5 className="card-title h6">
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="education-card-title stretched-link">
                {item.title}
              </a>
            </h5>
            <p className="card-text small text-muted flex-grow-1">{item.description}</p>
            <div className="mt-auto d-flex justify-content-between align-items-center">
              <div>
                <span className={`badge me-2 education-badge type-${item.type}`}>
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </span>
              </div>
              {item.source && <small className="text-muted text-end">Fonte: {item.source}</small>}
            </div>
          </div>
          {item.type === 'video' && item.embedUrl && (
            <div className="card-footer text-center bg-light-subtle">
                <button 
                    className="btn btn-sm btn-outline-primary"
                    onClick={(e) => {
                        e.stopPropagation(); 
                        handleOpenVideoModal(item);
                    }}
                >
                   <i className="fas fa-play-circle me-1"></i> Assistir Vídeo
                </button>
            </div>
          )}
        </div>
        
        {item.type === 'video' && item.embedUrl && (
            <div className="modal fade" ref={modalRefs.current[item.id]} id={`videoModal-${item.id}`} tabIndex="-1" aria-labelledby={`videoModalLabel-${item.id}`} aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id={`videoModalLabel-${item.id}`}>{item.title}</h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                data-bs-dismiss="modal" 
                                aria-label="Close"
                            ></button>
                        </div>
                        <div className="modal-body p-0">
                            <div className="ratio ratio-16x9">
                                <iframe 
                                    id={`videoIframe-${item.id}`}
                                    src="" 
                                    title={item.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                    allowFullScreen
                                    style={{border: 0}} 
                                ></iframe>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container-fluid mt-3 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando conteúdo...</span>
        </div>
        <p className="mt-2">Carregando conteúdo educacional...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid mt-3">
        <div className="alert alert-danger" role="alert">{error}</div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-3 education-page">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-4 border-bottom">
        <h1 className="h2">Centro de Educação Financeira</h1>
      </div>

      <div className="row mb-4">
        <div className="col-md-4 mb-3 mb-md-0">
          <label htmlFor="educationFilterType" className="form-label sr-only visually-hidden">Filtrar por tipo</label>
          <select id="educationFilterType" className="form-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="todos">Todos os Tipos</option>
            <option value="artigo">Artigos</option>
            <option value="video">Vídeos</option>
            <option value="guia">Guias</option>
            {}
          </select>
        </div>
        <div className="col-md-8">
          <label htmlFor="educationSearchTerm" className="form-label sr-only visually-hidden">Buscar conteúdo</label>
          <input 
            type="search" 
            id="educationSearchTerm"
            className="form-control" 
            placeholder="Buscar por título, descrição ou tag..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredContent.length > 0 ? (
        <div className="row">
          {filteredContent.map(item => renderContentItem(item))}
        </div>
      ) : (
        <div className="text-center text-muted mt-5 py-5">
          <i className="fas fa-search fa-3x mb-3 text-light-emphasis"></i>
          <h5>Nenhum conteúdo encontrado.</h5>
          <p>Tente ajustar seus filtros ou o termo de busca.</p>
        </div>
      )}
    </div>
  );
};

export default EducationPage;