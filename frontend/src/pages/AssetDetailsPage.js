import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Chart from 'chart.js/auto';
import Toast from '../components/common/Toast'; 

const AssetDetailsPage = ({ token }) => {
  const { symbol } = useParams();
  const [assetData, setAssetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchingNewData, setFetchingNewData] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchAssetHistory = useCallback(async (currentSymbol) => {
    if (!token || !currentSymbol) {
      setError("Símbolo ou autenticação ausentes.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/api/market/investments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { symbol: currentSymbol.toUpperCase() } 
      });
      
      const sortedData = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));

      if (sortedData.length === 0) {
        setError(`Nenhum dado histórico encontrado para ${currentSymbol}. Tente buscar dados atualizados.`);
      }
      setAssetData(sortedData);

    } catch (err) {
      console.error(`Erro ao buscar histórico para ${currentSymbol}:`, err.response || err);
      setError(err.response?.data?.error || `Não foi possível carregar dados para ${currentSymbol}.`);
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl]);

  useEffect(() => {
    fetchAssetHistory(symbol);
  }, [fetchAssetHistory, symbol]);

  useEffect(() => {
    if (assetData.length > 0 && chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      const dates = assetData.map(inv => new Date(inv.date).toLocaleDateString('pt-BR', {day: '2-digit', month:'2-digit', year: '2-digit'}));
      const closingPrices = assetData.map(inv => inv.close);

      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [{
            label: `Preço de Fechamento - ${symbol.toUpperCase()}`,
            data: closingPrices,
            fill: false,
            borderColor: '#4e73df',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { ticks: { maxTicksLimit: 10, autoSkip: true, maxRotation: 0, minRotation: 0 } },
            y: { ticks: { callback: value => `R$ ${value.toFixed(2)}` } }
          },
          plugins: { tooltip: { callbacks: { label: context => `R$ ${parseFloat(context.parsed.y).toFixed(2)}` } } }
        }
      });
    }
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [assetData, symbol]);


  const handleFetchNewData = async () => {
    if (!token || !symbol) return;
    setFetchingNewData(true);
    setError('');
    setToast({ message: '', type: '' });
    try {
      const res = await axios.post(`${apiUrl}/api/market/fetch-data`, 
        { symbol },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: res.data.message || `Dados para ${symbol.toUpperCase()} atualizados!`, type: 'success' });
      fetchAssetHistory(symbol); 
    } catch (err) {
      console.error(`Erro ao buscar novos dados para ${symbol}:`, err.response || err);
      let apiError = err.response?.data?.error || `Falha ao buscar novos dados para ${symbol}.`;
      if (err.response?.status === 429) {
        apiError = "Limite da API Alpha Vantage atingido. Tente novamente mais tarde.";
      }
      setError(apiError); 
      setToast({ message: apiError, type: 'error' }); 
    } finally {
      setFetchingNewData(false);
    }
  };

  const latestData = assetData.length > 0 ? assetData[assetData.length - 1] : null;

  return (
    <>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Detalhes do Ativo: {symbol.toUpperCase()}</h1>
          <button 
            className="btn btn-sm btn-outline-primary" 
            onClick={handleFetchNewData} 
            disabled={fetchingNewData || loading}
          >
            {fetchingNewData ? (
              <><span className="spinner-border spinner-border-sm me-1"></span> Buscando...</>
            ) : (
              <><i className="fas fa-sync-alt me-1"></i> Atualizar Dados</>
            )}
          </button>
        </div>

        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        
        {loading ? (
          <div className="text-center"><div className="spinner-border text-primary"></div><p>Carregando dados para {symbol.toUpperCase()}...</p></div>
        ) : (
          <>
            {latestData && (
              <div className="card shadow-sm mb-4">
                <div className="card-header">
                  Últimos Dados ({new Date(latestData.date).toLocaleDateString('pt-BR')})
                </div>
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-md-3 col-6 mb-3 mb-md-0">
                      <h6 className="text-muted">Abertura</h6>
                      <p className="fs-5 mb-0">R$ {parseFloat(latestData.open).toFixed(2)}</p>
                    </div>
                    <div className="col-md-3 col-6 mb-3 mb-md-0">
                      <h6 className="text-muted">Fechamento</h6>
                      <p className="fs-5 mb-0">R$ {parseFloat(latestData.close).toFixed(2)}</p>
                    </div>
                    <div className="col-md-3 col-6">
                      <h6 className="text-muted">Máxima</h6>
                      <p className="fs-5 mb-0">R$ {parseFloat(latestData.high).toFixed(2)}</p>
                    </div>
                    <div className="col-md-3 col-6">
                      <h6 className="text-muted">Mínima</h6>
                      <p className="fs-5 mb-0">R$ {parseFloat(latestData.low).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {assetData.length > 0 ? (
              <>
                <div className="card shadow-sm mb-4">
                  <div className="card-header">Gráfico de Preços Históricos</div>
                  <div className="card-body"><div style={{ height: '400px' }}><canvas ref={chartRef}></canvas></div></div>
                </div>

                <div className="card shadow-sm">
                  <div className="card-header">Tabela de Histórico de Preços</div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-striped table-hover table-sm mb-0">
                        <thead>
                          <tr>
                            <th>Data</th><th>Abertura</th><th>Máxima</th><th>Mínima</th><th>Fechamento</th><th>Volume</th>
                          </tr>
                        </thead>
                        <tbody>
                          {assetData.slice().reverse().slice(0, 100).map((inv) => (
                            <tr key={inv.id || `${inv.symbol}-${inv.date}`}>
                              <td>{new Date(inv.date).toLocaleDateString('pt-BR')}</td>
                              <td>{parseFloat(inv.open).toFixed(2)}</td>
                              <td>{parseFloat(inv.high).toFixed(2)}</td>
                              <td>{parseFloat(inv.low).toFixed(2)}</td>
                              <td>{parseFloat(inv.close).toFixed(2)}</td>
                              <td>{parseInt(inv.volume).toLocaleString('pt-BR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {assetData.length > 100 && (
                      <div className="card-footer text-muted small">Mostrando os últimos 100 registros.</div>
                  )}
                </div>
              </>
            ) : (
              !error && <p className="text-muted text-center mt-4">Nenhum dado histórico para exibir o gráfico ou tabela.</p>
            )}
          </>
        )}
        <div className="mt-4">
          <Link to="/market/assets" className="btn btn-outline-secondary">
              <i className="fas fa-arrow-left me-2"></i> Voltar para Lista de Ativos
          </Link>
        </div>
      </div>
    </>
  );
};

export default AssetDetailsPage;