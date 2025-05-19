import React, { useState, useEffect } from 'react';
import axios from 'axios';


const News = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [apiQueryUsed, setApiQueryUsed] = useState('');

  const NEWS_API_KEY = process.env.REACT_APP_NEWS_API_KEY;

  useEffect(() => {
    if (!NEWS_API_KEY) {
      setError('Chave da API de Notícias não configurada.');
      setLoading(false);
      return;
    }

    const fetchNews = async () => {
      setLoading(true);
      setError('');
      setArticles([]);

      const params = {
        q: '(economia OR finanças OR investimento OR inflação OR juros OR dólar OR bolsa) AND (brasil OR brasileira OR brasileiro)',
        language: 'pt',
        sortBy: 'publishedAt',
        apiKey: NEWS_API_KEY,
        pageSize: 15,
      };
      const queryDescription = "Brasil";
      setApiQueryUsed(queryDescription);

      try {
        console.log(`Tentando buscar notícias com params (endpoint /everything):`, params);
        const response = await axios.get('https://newsapi.org/v2/everything', { params });
        console.log("Resposta completa da NewsAPI (/everything):", response.data);

        if (response.data.status === "ok") {
          console.log("Artigos recebidos da API (/everything):", response.data.articles);
          if (response.data.articles && response.data.articles.length > 0) {
            setArticles(response.data.articles);
          } else {
            console.log("Nenhum artigo retornado para a query (/everything):", queryDescription);
          }
        } else {
          setError(response.data.message || 'Erro reportado pela API de notícias.');
        }
      } catch (err) {
        console.error("Erro na requisição para NewsAPI (/everything):", err);
        if (err.response) {
          setError(`Erro da API: ${err.response.data?.message || err.response.statusText || 'Erro desconhecido'}`);
          if(err.response.data?.code === 'sourcesAndKeywordsRemoved') {
            setError("Erro da API: Não é possível combinar 'sources' com palavras-chave ('q') no plano gratuito. Remova o parâmetro 'sources' da query.");
          }
        } else if (err.request) {
          setError('Não foi possível conectar ao servidor de notícias. Verifique sua conexão.');
        } else {
          setError('Erro ao configurar a requisição de notícias.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, [NEWS_API_KEY]);

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  if (loading) {
    return (
      <main className="container-fluid mt-3" role="main" aria-labelledby="news-title-loading">
        <h2 id="news-title-loading" className="text-center mb-4">Notícias de Economia</h2>
        <div className="d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando notícias...</span>
            </div>
        </div>
        <p className="text-center mt-2">Carregando notícias...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container-fluid mt-3" role="main" aria-labelledby="news-title-error">
        <h2 id="news-title-error" className="text-center mb-4">Notícias de Economia</h2>
        <div className="alert alert-danger" role="alert">
          <strong>Erro ao carregar notícias:</strong> {error}
          {error.includes("configurada") && <p className="mt-2">Por favor, verifique se a variável de ambiente <code>REACT_APP_NEWS_API_KEY</code> está corretamente definida.</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="container-fluid mt-3" role="main" aria-labelledby="news-title-main">
      <h2 id="news-title-main" className="text-center mb-4">Últimas Notícias de Economia ({apiQueryUsed})</h2>
      
      {articles.length === 0 && !loading && (
        <div className="alert alert-info text-center" role="alert">
          Nenhuma notícia encontrada no momento para os critérios: "{apiQueryUsed}".
          <br /> Tente novamente mais tarde ou ajuste os filtros se possível.
        </div>
      )}

      <div className="row gy-4">
        {articles.map((article, index) => (
          <div key={article.url || index} className="col-sm-12 col-md-6 col-lg-4 d-flex align-items-stretch">
            {}
            <div 
              className="card shadow-sm h-100 news-card-clickable" 
              style={{ cursor: (article.url ? 'pointer' : 'default') }} 
              onClick={() => { 
                if (article.url) {
                  window.open(article.url, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              {article.urlToImage ? (
                <img
                  src={article.urlToImage}
                  className="card-img-top" 
                  alt={article.title || "Imagem da notícia"}
                  style={{ height: '200px', objectFit: 'cover' }}
                  onError={handleImageError}
                />
              ) : (
                <div 
                  className="card-img-top bg-light d-flex align-items-center justify-content-center" 
                  style={{ height: '200px', borderBottom: '1px solid #dee2e6' }}
                  aria-label="Imagem não disponível"
                >
                  <i className="fas fa-newspaper fa-3x text-muted"></i>
                </div>
              )}
              <div className="card-body d-flex flex-column">
                <h5 className="card-title h6">
                  {}
                  <span className="news-card-title-text"> {}
                    {article.title || "Título não disponível"}
                  </span>
                </h5>
                <p className="card-text small text-muted flex-grow-1" style={{minHeight: '60px'}}>
                  {article.description 
                    ? `${article.description.substring(0, 120)}${article.description.length > 120 ? '...' : ''}` 
                    : (article.content 
                        ? `${article.content.substring(0, 120)}${article.content.length > 120 ? '...' : ''}` 
                        : 'Descrição não disponível. Clique para ler mais.')
                  }
                </p>
                <div className="mt-auto d-flex justify-content-between align-items-center pt-2 border-top">
                  <small className="text-muted" style={{fontSize: '0.8em'}}>
                    {article.source?.name || 'Fonte desconhecida'}
                  </small>
                  <small className="text-muted" style={{fontSize: '0.8em'}}>
                    {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('pt-BR', {day: '2-digit', month: 'short', year: 'numeric'}) : ''}
                  </small>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {articles.length > 0 && (
        <div className="text-center mt-4">
          <small className="text-muted">
            Notícias fornecidas por <a href="https://newsapi.org" target="_blank" rel="noopener noreferrer">NewsAPI.org</a>
          </small>
        </div>
      )}
    </main>
  );
};

export default News;