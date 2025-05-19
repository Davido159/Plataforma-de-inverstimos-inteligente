import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Toast from '../components/common/Toast';

const PortfolioInvestmentForm = ({ token, onSuccess, editingInvestment, clearEditing }) => {
    const [symbol, setSymbol] = useState('');
    const [quantity, setQuantity] = useState('');
    const [purchasePrice, setPurchasePrice] = useState('');
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
    const [broker, setBroker] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    useEffect(() => {
        if (editingInvestment) {
            setSymbol(editingInvestment.symbol || '');
            setQuantity(String(editingInvestment.quantity) || '');
            setPurchasePrice(String(editingInvestment.purchasePrice) || '');
            setPurchaseDate(editingInvestment.purchaseDate ? new Date(editingInvestment.purchaseDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
            setBroker(editingInvestment.broker || '');
            setNotes(editingInvestment.notes || '');
            setError(''); 
        } else {
            setSymbol('');
            setQuantity('');
            setPurchasePrice('');
            setPurchaseDate(new Date().toISOString().slice(0, 10));
            setBroker('');
            setNotes('');
            setError('');
        }
    }, [editingInvestment]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!symbol.trim() || !quantity || !purchasePrice || !purchaseDate) {
            setError('Símbolo, quantidade, preço e data de compra são obrigatórios.');
            return;
        }
        const parsedQuantity = parseFloat(quantity);
        const parsedPrice = parseFloat(purchasePrice);

        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            setError('Quantidade inválida. Deve ser um número positivo.');
            return;
        }
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            setError('Preço de compra inválido. Deve ser um número positivo.');
            return;
        }
        setError(''); 
        setLoading(true);

        const investmentData = {
            symbol: symbol.trim().toUpperCase(),
            quantity: parsedQuantity,
            purchasePrice: parsedPrice,
            purchaseDate,
            broker: broker.trim() || null, 
            notes: notes.trim() || null,   
        };

        try {
            let response;
            if (editingInvestment) {
                response = await axios.put(`${apiUrl}/api/portfolio/${editingInvestment.id}`, investmentData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            } else {
                response = await axios.post(`${apiUrl}/api/portfolio`, investmentData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
            }
            onSuccess(response.data, !!editingInvestment);
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Erro ao salvar investimento no portfólio.';
            console.error("Erro ao salvar no portfólio:", err.response || err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header">
                <h3 className="h5 mb-0">{editingInvestment ? 'Editar Investimento do Portfólio' : 'Adicionar ao Portfólio'}</h3>
            </div>
            <div className="card-body">
                {error && <div className="alert alert-danger p-2 mb-3">{error}</div>}
                <form onSubmit={handleSubmit} noValidate>
                    <div className="mb-3">
                        <label htmlFor="portSymbol" className="form-label">Símbolo do Ativo (ex: PETR4.SA, AAPL)<span className="text-danger">*</span></label>
                        <input type="text" className="form-control" id="portSymbol" value={symbol} onChange={e => setSymbol(e.target.value)} required />
                    </div>
                    <div className="row g-3 mb-3">
                        <div className="col-md-4">
                            <label htmlFor="portQuantity" className="form-label">Quantidade<span className="text-danger">*</span></label>
                            <input type="number" step="any" min="0.0001" className="form-control" id="portQuantity" value={quantity} onChange={e => setQuantity(e.target.value)} required />
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="portPurchasePrice" className="form-label">Preço de Compra (Unitário)<span className="text-danger">*</span></label>
                            <input type="number" step="0.01" min="0.01" className="form-control" id="portPurchasePrice" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} required />
                        </div>
                        <div className="col-md-4">
                            <label htmlFor="portPurchaseDate" className="form-label">Data da Compra<span className="text-danger">*</span></label>
                            <input type="date" className="form-control" id="portPurchaseDate" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="portBroker" className="form-label">Corretora (Opcional)</label>
                        <input type="text" className="form-control" id="portBroker" value={broker} onChange={e => setBroker(e.target.value)} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="portNotes" className="form-label">Observações (Opcional)</label>
                        <textarea className="form-control" id="portNotes" rows="3" value={notes} onChange={e => setNotes(e.target.value)}></textarea>
                    </div>
                    <div className="d-flex">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <><span className="spinner-border spinner-border-sm me-1"></span>Salvando...</> : (editingInvestment ? 'Atualizar Investimento' : 'Adicionar Investimento')}
                        </button>
                        {editingInvestment && (
                            <button type="button" className="btn btn-outline-secondary ms-2" onClick={clearEditing} disabled={loading}>
                                Cancelar Edição
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

const SellInvestmentModal = ({ token, investment, onSuccess, onClose, apiUrl }) => {
    const [quantitySold, setQuantitySold] = useState('');
    const [salePrice, setSalePrice] = useState('');
    const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const maxQuantity = investment ? parseFloat(investment.quantity) : 0;

    useEffect(() => { 
        if (investment) {
            setQuantitySold(''); 
        }
    }, [investment, maxQuantity]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!quantitySold || !salePrice || !saleDate) {
            setError('Quantidade, preço e data da venda são obrigatórios.');
            return;
        }
        const fQuantitySold = parseFloat(quantitySold);
        const fSalePrice = parseFloat(salePrice);

        if (isNaN(fQuantitySold) || fQuantitySold <= 0) {
            setError('Quantidade vendida inválida.');
            return;
        }
        if (fQuantitySold > maxQuantity) {
            setError(`Quantidade a vender não pode ser maior que a quantidade possuída (${maxQuantity.toLocaleString('pt-BR', {maximumFractionDigits: 4})}).`);
            return;
        }
        if (isNaN(fSalePrice) || fSalePrice <= 0) {
            setError('Preço de venda inválido.');
            return;
        }
        setError('');
        setLoading(true);

        const saleData = {
            quantitySold: fQuantitySold,
            salePrice: fSalePrice,
            saleDate,
            notes: notes.trim() || null,
        };

        try {
            const response = await axios.post(`${apiUrl}/api/portfolio/${investment.id}/sell`, saleData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            onSuccess(response.data); 
            onClose(); 
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Erro ao registrar venda.';
            console.error("Erro ao registrar venda:", err.response || err);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!investment) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Vender {investment.symbol}</h5>
                        <button type="button" className="btn-close" onClick={onClose} aria-label="Close" disabled={loading}></button>
                    </div>
                    <form onSubmit={handleSubmit} noValidate>
                        <div className="modal-body">
                            {error && <div className="alert alert-danger p-2 mb-3">{error}</div>}
                            <p className="mb-1">Ativo: <strong>{investment.symbol}</strong></p>
                            <p>Você possui: <strong>{maxQuantity.toLocaleString('pt-BR', {maximumFractionDigits: 4})}</strong> unidades</p>
                            
                            <div className="mb-3">
                                <label htmlFor="sellQuantity" className="form-label">Quantidade a Vender<span className="text-danger">*</span></label>
                                <input 
                                    type="number" step="any" min="0.0001" max={maxQuantity}
                                    className="form-control" id="sellQuantity" value={quantitySold}
                                    onChange={e => setQuantitySold(e.target.value)} required 
                                />
                            </div>
                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label htmlFor="sellPrice" className="form-label">Preço de Venda (Unitário)<span className="text-danger">*</span></label>
                                    <input type="number" step="0.01" min="0.01" className="form-control" id="sellPrice" value={salePrice} onChange={e => setSalePrice(e.target.value)} required />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="sellDate" className="form-label">Data da Venda<span className="text-danger">*</span></label>
                                    <input type="date" className="form-control" id="sellDate" value={saleDate} onChange={e => setSaleDate(e.target.value)} required />
                                </div>
                            </div>
                            <div className="mb-3">
                                <label htmlFor="sellNotes" className="form-label">Observações da Venda (Opcional)</label>
                                <textarea className="form-control" id="sellNotes" rows="2" value={notes} onChange={e => setNotes(e.target.value)}></textarea>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
                            <button type="submit" className="btn btn-danger" disabled={loading}>
                                {loading ? <><span className="spinner-border spinner-border-sm me-1"></span>Registrando...</> : 'Registrar Venda'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Componente MyPortfolioPage ---
const MyPortfolioPage = ({ token }) => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(''); 
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [toast, setToast] = useState({ message: '', type: '' });
  const [sellingInvestment, setSellingInvestment] = useState(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchPortfolio = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${apiUrl}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("MyPortfolioPage - Dados do portfólio recebidos:", JSON.stringify(response.data, null, 2)); 
      const sortedPortfolio = response.data.sort((a, b) => {
        const dateComparison = new Date(b.purchaseDate) - new Date(a.purchaseDate);
        if (dateComparison !== 0) return dateComparison;
        return a.symbol.localeCompare(b.symbol);
      });
      setPortfolio(sortedPortfolio);
    } catch (err) {
      console.error("MyPortfolioPage - Erro ao buscar portfólio:", err.response || err);
      const errorMsg = err.response?.data?.error || "Não foi possível carregar seu portfólio.";
      setError(errorMsg);
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  const handleSaveSuccess = (savedItemData, isUpdate) => {
     fetchPortfolio(); 
     setEditingInvestment(null); 
     setToast({ message: `Investimento ${isUpdate ? 'atualizado' : 'adicionado'} com sucesso!`, type: 'success' });
  };

  const handleSaleSuccess = (saleResponse) => {
     fetchPortfolio();
     setToast({ message: saleResponse.message || "Venda registrada com sucesso!", type: 'success' });
  };
  
  const clearEditingForm = () => {
    setEditingInvestment(null); 
  };

  const handleDelete = async (investmentId) => {
    if (!token || !window.confirm("Tem certeza que deseja remover este investimento do portfólio? A transação financeira de compra original associada não será removida automaticamente.")) return;
    setToast({ message: '', type: '' });
    try {
      await axios.delete(`${apiUrl}/api/portfolio/${investmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPortfolio(prev => prev.filter(item => item.id !== investmentId)); 
      setToast({ message: "Investimento removido do portfólio.", type: 'success' });
    } catch (err) {
      console.error("Erro ao excluir investimento do portfólio:", err.response || err);
      const errorMsg = err.response?.data?.error || "Erro ao excluir investimento.";
      setError(errorMsg); 
      setToast({ message: errorMsg, type: 'error' });
    }
  };

  const portfolioSummary = useMemo(() => {
    let totalInvested = 0;
    let currentValue = 0;
    portfolio.forEach(item => {
        const itemQuantity = parseFloat(item.quantity);
        const itemPurchasePrice = parseFloat(item.purchasePrice);
        
        if (isNaN(itemQuantity) || isNaN(itemPurchasePrice)) {
            console.warn(`MyPortfolioPage - Resumo: Item ${item.symbol} com quantidade ou preço de compra inválido. Qtde: ${item.quantity}, Preço Compra: ${item.purchasePrice}`);
            return;
        }

        totalInvested += itemQuantity * itemPurchasePrice;
        
        const itemCurrentPrice = (item.currentPrice !== null && item.currentPrice !== undefined) ? parseFloat(item.currentPrice) : null;

        if (itemCurrentPrice !== null && !isNaN(itemCurrentPrice) && itemCurrentPrice > 0) {
            currentValue += itemQuantity * itemCurrentPrice;
        } else {
            currentValue += itemQuantity * itemPurchasePrice; // Fallback
        }
    });
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = totalInvested !== 0 ? (profitLoss / totalInvested) * 100 : 0; // Evita divisão por zero
    console.log("MyPortfolioPage - Resumo Calculado:", { totalInvested, currentValue, profitLoss, profitLossPercent }); // LOG ADICIONADO
    return { totalInvested, currentValue, profitLoss, profitLossPercent };
  }, [portfolio]);

  if (loading && portfolio.length === 0) { 
    return (
      <div className="container-fluid mt-3 text-center">
        <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Carregando...</span></div>
        <p>Carregando seu portfólio...</p>
      </div>
    );
  }

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: '' })}
      />

      {sellingInvestment && (
        <SellInvestmentModal
          token={token}
          investment={sellingInvestment}
          onSuccess={handleSaleSuccess}
          onClose={() => setSellingInvestment(null)}
          apiUrl={apiUrl}
        />
      )}

      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Meu Portfólio de Investimentos</h1>
          {loading && (
            <div
              className="spinner-border spinner-border-sm text-secondary ms-2"
              role="status"
              aria-hidden="true"
            ></div>
          )}
        </div>

        {error && !loading && <div className="alert alert-danger">{error}</div>}

        <PortfolioInvestmentForm
          token={token}
          onSuccess={handleSaveSuccess}
          editingInvestment={editingInvestment}
          clearEditing={clearEditingForm}
        />

        {portfolio.length > 0 && (
          <div className="card shadow-sm mb-4">
            <div className="card-header">
              <h3 className="h5 mb-0">Resumo do Portfólio</h3>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3 col-6 mb-3 mb-md-0">
                  <strong>Total Investido:</strong><br /> R$ {portfolioSummary.totalInvested.toFixed(2)}
                </div>
                <div className="col-md-3 col-6 mb-3 mb-md-0">
                  <strong>Valor Atual Estimado:</strong><br /> R$ {portfolioSummary.currentValue.toFixed(2)}
                </div>
                <div className={`col-md-3 col-6 mb-3 fw-bold ${portfolioSummary.profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                  <strong>Lucro/Prejuízo:</strong><br /> R$ {portfolioSummary.profitLoss.toFixed(2)}
                </div>
                <div className={`col-md-3 col-6 mb-3 fw-bold ${portfolioSummary.profitLossPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                  <strong>Rentabilidade:</strong><br /> {portfolioSummary.profitLossPercent.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h3 className="h5 mb-0">Meus Ativos</h3>
          </div>
          <div className="card-body p-0">
            {portfolio.length === 0 && !loading && (
              <p className="text-muted text-center p-3">
                Você ainda não adicionou nenhum investimento ao seu portfólio.
              </p>
            )}

            {portfolio.length > 0 && (
              <div className="table-responsive">
                <table className="table table-striped table-hover table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Símbolo</th>
                      <th className="text-end">Qtde.</th>
                      <th className="text-end">Preço Médio Compra</th>
                      <th className="text-end">Custo Total</th>
                      <th>Data Compra</th>
                      <th className="text-end">Preço Atual</th>
                      <th className="text-end">Valor Atual</th>
                      <th className="text-end">L/P (R$)</th>
                      <th className="text-end">L/P (%)</th>
                      <th>Corretora</th>
                      <th className="text-end">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolio.map(item => {
                      const quantity = parseFloat(item.quantity);
                      const purchasePrice = parseFloat(item.purchasePrice);
                      const totalCost = !isNaN(quantity) && !isNaN(purchasePrice) ? quantity * purchasePrice : 0;

                      const currentPriceAPI = item.currentPrice;
                      const currentPrice = currentPriceAPI !== null && currentPriceAPI !== undefined && !isNaN(parseFloat(currentPriceAPI))
                        ? parseFloat(currentPriceAPI)
                        : null;

                      const currentValueItem = currentPrice !== null && !isNaN(quantity)
                        ? quantity * currentPrice
                        : totalCost;

                      const profitLossItem = currentValueItem - totalCost;
                      const profitLossPercentItem = totalCost !== 0 ? (profitLossItem / totalCost) * 100 : 0;

                      return (
                        <tr key={item.id}>
                          <td>
                            <Link to={`/market/asset/${item.symbol}`} title={`Ver detalhes de mercado de ${item.symbol}`}>
                              {item.symbol}
                            </Link>
                            {item.lastMarketDataDate && (
                              <small className="d-block text-muted" style={{ fontSize: '0.75em' }}>
                                Mercado: {new Date(item.lastMarketDataDate).toLocaleDateString('pt-BR')}
                              </small>
                            )}
                          </td>
                          <td className="text-end">
                            {!isNaN(quantity)
                              ? quantity.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 4,
                                })
                              : 'N/A'}
                          </td>
                          <td className="text-end">R$ {!isNaN(purchasePrice) ? purchasePrice.toFixed(2) : 'N/A'}</td>
                          <td className="text-end">R$ {totalCost.toFixed(2)}</td>
                          <td className="text-center">{new Date(item.purchaseDate).toLocaleDateString('pt-BR')}</td>
                          <td className="text-end">
                            {currentPrice !== null ? `R$ ${currentPrice.toFixed(2)}` : <span className="text-muted">N/D</span>}
                          </td>
                          <td className="text-end">R$ {currentValueItem.toFixed(2)}</td>
                          <td className={`text-end fw-bold ${profitLossItem >= 0 ? 'text-success' : 'text-danger'}`}>
                            {profitLossItem.toFixed(2)}
                          </td>
                          <td className={`text-end fw-bold ${profitLossPercentItem >= 0 ? 'text-success' : 'text-danger'}`}>
                            {profitLossPercentItem.toFixed(2)}%
                          </td>
                          <td>{item.broker || '-'}</td>
                          <td className="text-end">
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                onClick={() => setEditingInvestment(item)}
                                className="btn btn-outline-primary py-0 px-1"
                                title="Editar Compra"
                                aria-label={`Editar compra de ${item.symbol}`}
                              >
                                <i className="fas fa-edit fa-xs"></i>
                              </button>
                              <button
                                onClick={() => setSellingInvestment(item)}
                                className="btn btn-success py-0 px-1"
                                title={`Vender ${item.symbol}`}
                                aria-label={`Vender ${item.symbol}`}
                                disabled={isNaN(quantity) || quantity <= 0}
                              >
                                <i className="fas fa-hand-holding-usd fa-xs"></i>
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="btn btn-outline-danger py-0 px-1"
                                title="Excluir do Portfólio"
                                aria-label={`Excluir ${item.symbol} do portfólio`}
                              >
                                <i className="fas fa-trash fa-xs"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MyPortfolioPage;