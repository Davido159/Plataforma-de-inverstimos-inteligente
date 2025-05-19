import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import Toast from '../components/common/Toast';

const InvestmentsPage = ({ token }) => {
  const [marketSymbols, setMarketSymbols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); 

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(''); 
  const [toast, setToast] = useState({ message: '', type: '' });

  const [deletingSymbol, setDeletingSymbol] = useState(null);

  const navigate = useNavigate();
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchMarketDataSymbols = useCallback(async () => {
    if (!token) {
      setError("Autenticação necessária.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/api/market/investments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const allInvestments = response.data;
      const uniqueSymbols = [...new Set(allInvestments.map(inv => inv.symbol))].sort();
      setMarketSymbols(uniqueSymbols);

    } catch (err) {
      console.error("Erro ao buscar símbolos de dados de mercado:", err.response || err);
      setError(err.response?.data?.error || "Não foi possível carregar os símbolos de ativos.");
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl]);

  useEffect(() => {
    fetchMarketDataSymbols();
  }, [fetchMarketDataSymbols]);

  const handleSearchSymbol = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchError("Por favor, insira um símbolo para buscar.");
      return;
    }
    if (!token) {
        setToast({ message: "Autenticação necessária para buscar novos ativos.", type: 'error' });
        return;
    }
    setIsSearching(true);
    setSearchError('');
    setToast({ message: '', type: '' });
    const symbolToSearch = searchTerm.trim().toUpperCase();
    try {
      const res = await axios.post(`${apiUrl}/api/market/fetch-data`, 
        { symbol: symbolToSearch },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: res.data.message || `Dados para ${symbolToSearch} buscados! Redirecionando...`, type: 'success' });
      setSearchTerm('');
      if (!marketSymbols.includes(symbolToSearch)) {
        setMarketSymbols(prev => [...prev, symbolToSearch].sort());
      }
      setTimeout(() => { navigate(`/market/asset/${symbolToSearch}`); }, 1500);
    } catch (err) {
      let apiError = err.response?.data?.error || `Falha ao buscar ${symbolToSearch}.`;
      if (err.response?.status === 429) apiError = "Limite da API atingido.";
      else if (err.response?.status === 400 && apiError.includes("Símbolo inválido")) apiError = `Símbolo "${symbolToSearch}" inválido. Tente com ".SA" para B3.`;
      setSearchError(apiError); 
      setToast({ message: apiError, type: 'error' }); 
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteSymbolHistory = async (symbolToDelete) => {
    if (!token) {
      setToast({ message: 'Autenticação necessária.', type: 'error' });
      return;
    }
    if (!window.confirm(`Tem certeza que deseja excluir todo o histórico de dados para o símbolo ${symbolToDelete}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setDeletingSymbol(symbolToDelete);
    setToast({ message: '', type: '' });

    try {
      await axios.delete(`${apiUrl}/api/market/investments/${symbolToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ message: `Histórico de ${symbolToDelete} excluído com sucesso.`, type: 'success' });
      setMarketSymbols(prevSymbols => prevSymbols.filter(s => s !== symbolToDelete));
    } catch (err) {
      console.error(`Erro ao excluir histórico de ${symbolToDelete}:`, err.response || err);
      const apiError = err.response?.data?.error || `Falha ao excluir histórico de ${symbolToDelete}.`;
      setToast({ message: apiError, type: 'error' });
    } finally {
      setDeletingSymbol(null);
    }
  };

  return (
    <>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Explorar Ativos de Mercado</h1>
        </div>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        
        <form onSubmit={handleSearchSymbol} className="mb-4">
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="card-title">Buscar Novo Ativo na API</h5>
              <p className="card-text small text-muted">
                Digite o símbolo de um ativo para buscar seus dados históricos.
                Para ativos da B3 (Brasil), adicione o sufixo <code className="fw-bold">.SA</code> (ex: PETR4<code className="fw-bold">.SA</code>).
                Para ativos dos EUA, geralmente o símbolo direto funciona (ex: AAPL, MSFT).
              </p>
              <div className="input-group">
                <input type="text" className={`form-control ${searchError ? 'is-invalid' : ''}`} placeholder="Símbolo do Ativo (ex: VALE3.SA)" value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); if (searchError) setSearchError(''); }}
                  aria-label="Símbolo do Ativo" disabled={isSearching} />
                <button className="btn btn-primary" type="submit" disabled={isSearching || !searchTerm.trim()} >
                  {isSearching ? (<><span className="spinner-border spinner-border-sm me-1"></span>Buscando...</>) : (<><i className="fas fa-search me-1"></i> Buscar na API</>)}
                </button>
              </div>
              {searchError && <div className="invalid-feedback d-block mt-1">{searchError}</div>}
            </div>
          </div>
        </form>

        <div className="alert alert-light border-start border-4 border-primary bg-light-subtle mb-4">
          <p className="mb-0">
            Abaixo estão os ativos para os quais o sistema já possui dados de mercado salvos localmente.
            Clique em um símbolo para ver seu histórico ou no ícone de lixeira para remover seus dados.
          </p>
        </div>

        {loading ? (
          <div className="text-center"><div className="spinner-border text-primary"></div><p>Carregando símbolos...</p></div>
        ) : marketSymbols.length > 0 ? (
          <div className="list-group shadow-sm">
            {marketSymbols.map(symbolItem => ( 
              <div 
                key={symbolItem} 
                className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
              >
                <Link to={`/market/asset/${symbolItem}`} className="text-decoration-none text-body flex-grow-1">
                  <i className="fas fa-chart-bar me-2 text-primary opacity-75"></i>{symbolItem}
                </Link>
                <button 
                  className="btn btn-sm btn-outline-danger ms-2"
                  onClick={() => handleDeleteSymbolHistory(symbolItem)}
                  disabled={deletingSymbol === symbolItem}
                  title={`Excluir histórico de ${symbolItem}`}
                  aria-label={`Excluir dados de mercado de ${symbolItem}`}
                >
                  {deletingSymbol === symbolItem ? (
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  ) : (
                    <i className="fas fa-trash-alt"></i>
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          !error && <p className="text-muted text-center">Nenhum dado de mercado salvo. Tente buscar um ativo acima.</p>
        )}
      </div>
    </>
  );
};

export default InvestmentsPage;