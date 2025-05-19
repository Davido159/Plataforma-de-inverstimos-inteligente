import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import Chart from 'chart.js/auto';
import Toast from '../common/Toast';

const InvestmentSimulator = ({ token }) => {
  const [symbol, setSymbol] = useState('');
  const [initialInvestment, setInitialInvestment] = useState('');
  const [monthlyInvestment, setMonthlyInvestment] = useState('');
  const [simulationYears, setSimulationYears] = useState('5');

  const [assetData, setAssetData] = useState([]);
  const [loadingAssetData, setLoadingAssetData] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [autoFetchingForSimulation, setAutoFetchingForSimulation] = useState(false);

  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchMarketDataFromExternalAPI = useCallback(async (currentSymbol) => {
    if (!token || !currentSymbol) return false;
    setToast({ message: `Buscando dados de mercado para ${currentSymbol}...`, type: 'info' });
    try {
      await axios.post(`${apiUrl}/api/market/fetch-data`,
        { symbol: currentSymbol },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setToast({ message: `Dados de mercado para ${currentSymbol} atualizados/buscados.`, type: 'success' });
      return true;
    } catch (err) {
      console.error(`Erro ao buscar dados da API externa para ${currentSymbol}:`, err.response || err);
      let apiError = err.response?.data?.error || `Falha ao buscar dados de mercado para ${currentSymbol}.`;
      if (err.response?.status === 429) {
        apiError = "Limite da API Alpha Vantage atingido. Tente novamente mais tarde.";
      } else if (err.response?.status === 400 && apiError.includes("Símbolo inválido")) {
        apiError = `Símbolo "${currentSymbol}" inválido ou não encontrado na API externa.`;
      }
      setError(apiError);
      setToast({ message: apiError, type: 'error' });
      return false;
    }
  }, [token, apiUrl]);

  const fetchAssetHistory = useCallback(async (currentSymbol, isAutoFetchAttempt = false) => {
    if (!token || !currentSymbol) {
      setAssetData([]);
      return;
    }
    setLoadingAssetData(true);
    if (!isAutoFetchAttempt) setError('');

    try {
      const response = await axios.get(`${apiUrl}/api/market/investments`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { symbol: currentSymbol.toUpperCase() }
      });
      const sortedData = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      if (sortedData.length === 0) {
        if (!isAutoFetchAttempt) {
             setError(`Nenhum dado histórico local encontrado para ${currentSymbol}. Tentaremos buscar na API externa ao simular, ou você pode buscar em "Ativos de Mercado".`);
        } else {
            if (!error) setError(`Não foi possível obter dados históricos para ${currentSymbol} após tentativa de busca na API externa.`);
        }
        setAssetData([]);
      } else {
        setAssetData(sortedData);
        if (!isAutoFetchAttempt || (error && error.includes("local"))) setError(''); 
      }
      return sortedData.length > 0;
    } catch (err) {
      console.error(`Erro ao buscar histórico local para ${currentSymbol}:`, err.response || err);
      if (!error) setError(err.response?.data?.error || `Não foi possível carregar dados locais para ${currentSymbol}.`);
      setAssetData([]);
      return false;
    } finally {
      setLoadingAssetData(false);
    }
  }, [token, apiUrl, error]); 

  useEffect(() => {
    if (symbol.trim()) {
      fetchAssetHistory(symbol.trim());
    } else {
      setAssetData([]); 
      setError('');     
    }
  }, [symbol, fetchAssetHistory]); 

  const handleSimulation = async () => {
    setError('');
    setSimulationResult(null);
    if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
    }

    if (!symbol.trim() || !initialInvestment || !simulationYears) {
      setError("Símbolo do ativo, aporte inicial e anos de simulação são obrigatórios.");
      return;
    }
    const parsedInitial = parseFloat(initialInvestment);
    if (isNaN(parsedInitial) || parsedInitial <= 0) {
        setError("Aporte inicial deve ser um número positivo.");
        return;
    }
    const parsedMonthly = parseFloat(monthlyInvestment) || 0;
    if (monthlyInvestment.trim() !== "" && (isNaN(parsedMonthly) || parsedMonthly < 0)) {
        setError("Aporte mensal, se informado, deve ser um número positivo ou zero.");
        return;
    }

    setIsSimulating(true);
    let currentAssetData = assetData;

    if (currentAssetData.length === 0 && !loadingAssetData && !autoFetchingForSimulation) {
      setAutoFetchingForSimulation(true);
      setError('');
      const externalFetchSuccess = await fetchMarketDataFromExternalAPI(symbol.trim());
      if (externalFetchSuccess) {
        const localDataFetched = await fetchAssetHistory(symbol.trim(), true);
        if (localDataFetched) {
          try {
            const response = await axios.get(`${apiUrl}/api/market/investments`, {
              headers: { Authorization: `Bearer ${token}` }, params: { symbol: symbol.trim().toUpperCase() }
            });
            currentAssetData = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
          } catch (fetchErr) {
            setError("Erro ao recarregar dados após busca na API externa para simulação.");
            setIsSimulating(false);
            setAutoFetchingForSimulation(false);
            return;
          }
        } else {
          setIsSimulating(false);
          setAutoFetchingForSimulation(false);
          return;
        }
      } else {
        setIsSimulating(false);
        setAutoFetchingForSimulation(false);
        return;
      }
      setAutoFetchingForSimulation(false);
    }
    
    if (currentAssetData.length === 0) {
        if (!error) setError(`Não há dados históricos para ${symbol.toUpperCase()} para realizar a simulação.`);
        setIsSimulating(false);
        return;
    }
    if (currentAssetData.length < 2 && parseInt(simulationYears,10) > 0) {
        setError(`Dados históricos insuficientes para ${symbol.toUpperCase()}.`);
        setIsSimulating(false);
        return;
    }

    const initial = parsedInitial;
    const monthly = parsedMonthly;
    const years = parseInt(simulationYears, 10);
    const totalMonths = years * 12;

    let currentShares = 0;
    let totalInvestedValue = 0;
    let currentPortfolioValue = 0;
    const resultsOverTime = [];
    const monthlyDetails = [];
    
    const firstAvailablePrice = currentAssetData[0]?.close ? parseFloat(currentAssetData[0].close) : null;

    if (!firstAvailablePrice || firstAvailablePrice <= 0) {
        setError("Não foi possível determinar o preço inicial do ativo. Dados históricos podem estar incompletos.");
        setIsSimulating(false);
        return;
    }
    
    currentShares = initial / firstAvailablePrice;
    totalInvestedValue = initial;
    currentPortfolioValue = initial;

    monthlyDetails.push({
        monthAbsolute: 0, year: 0, month: 0,
        dateDisplay: currentAssetData[0]?.date ? new Date(currentAssetData[0].date).toLocaleDateString('pt-BR') : 'Data Inicial',
        investedThisMonth: initial, sharesBought: currentShares, pricePerShare: firstAvailablePrice,
        totalShares: currentShares, totalInvestedCumulative: totalInvestedValue, portfolioValue: currentPortfolioValue,
    });
    
    if (totalMonths === 0 || (monthly === 0 && totalMonths > 0)) {
        resultsOverTime.push({ year: 0, totalInvested: totalInvestedValue, portfolioValue: currentPortfolioValue });
        if (monthly === 0 && totalMonths > 0) {
            let lastPriceAvailable = firstAvailablePrice;
            let dataIndexForProjection = 0;
            let lastMonthProcessedForProjection = new Date(currentAssetData[0].date).getFullYear() * 12 + new Date(currentAssetData[0].date).getMonth();

            for (let m = 0; m < totalMonths; m++) {
                let priceForThisMonthProjection = null;
                let dateForThisMonthProjection = null;
                let foundPriceForMonthProjection = false;

                while(dataIndexForProjection < currentAssetData.length) {
                    const currentDate = new Date(currentAssetData[dataIndexForProjection].date);
                    const currentMonthInLoop = currentDate.getFullYear() * 12 + currentDate.getMonth();
                    if (currentMonthInLoop > lastMonthProcessedForProjection) {
                        priceForThisMonthProjection = parseFloat(currentAssetData[dataIndexForProjection].close);
                        dateForThisMonthProjection = currentAssetData[dataIndexForProjection].date;
                        lastMonthProcessedForProjection = currentMonthInLoop;
                        foundPriceForMonthProjection = true;
                        break;
                    }
                    dataIndexForProjection++;
                }
                if (!foundPriceForMonthProjection && currentAssetData.length > 0) {
                    priceForThisMonthProjection = parseFloat(currentAssetData[currentAssetData.length - 1].close);
                    dateForThisMonthProjection = currentAssetData[currentAssetData.length - 1].date;
                }
                lastPriceAvailable = priceForThisMonthProjection || lastPriceAvailable;
                currentPortfolioValue = currentShares * lastPriceAvailable;

                monthlyDetails.push({
                    monthAbsolute: m + 1, year: Math.floor(m / 12) + 1, month: (m % 12) + 1,
                    dateDisplay: dateForThisMonthProjection ? new Date(dateForThisMonthProjection).toLocaleDateString('pt-BR') : `Mês ${m+1}`,
                    investedThisMonth: 0, sharesBought: 0, pricePerShare: lastPriceAvailable,
                    totalShares: currentShares, totalInvestedCumulative: totalInvestedValue, portfolioValue: currentPortfolioValue,
                });
                if ((m + 1) % 12 === 0 || m === totalMonths - 1) {
                    resultsOverTime.push({ year: Math.floor(m / 12) + 1, totalInvested: totalInvestedValue, portfolioValue: currentPortfolioValue });
                }
            }
        }
    } else if (monthly > 0) {
        let dataIndex = 0;
        let lastMonthProcessed = -1;

        const initialDate = new Date(currentAssetData[0].date);
        lastMonthProcessed = initialDate.getFullYear() * 12 + initialDate.getMonth();
        dataIndex = currentAssetData.findIndex(d => {
            const dt = new Date(d.date);
            return (dt.getFullYear() * 12 + dt.getMonth()) > lastMonthProcessed;
        });
        if(dataIndex === -1) dataIndex = currentAssetData.length;

        for (let m = 0; m < totalMonths; m++) {
            let priceForThisMonth = null;
            let dateForThisMonth = null;
            let foundPriceForMonth = false;
            let searchIndex = dataIndex;
            while(searchIndex < currentAssetData.length) {
                const currentDate = new Date(currentAssetData[searchIndex].date);
                const currentMonthInLoop = currentDate.getFullYear() * 12 + currentDate.getMonth();
                
                if (currentMonthInLoop > lastMonthProcessed) {
                    priceForThisMonth = parseFloat(currentAssetData[searchIndex].close);
                    dateForThisMonth = currentAssetData[searchIndex].date;
                    lastMonthProcessed = currentMonthInLoop;
                    dataIndex = searchIndex + 1;
                    foundPriceForMonth = true;
                    break; 
                }
                searchIndex++;
            }
            
            if (!foundPriceForMonth && currentAssetData.length > 0) {
                priceForThisMonth = parseFloat(currentAssetData[currentAssetData.length - 1].close);
                dateForThisMonth = currentAssetData[currentAssetData.length - 1].date;
            } else if (!foundPriceForMonth && currentAssetData.length === 0) {
                setError("Erro: Perda de dados do ativo durante a simulação mensal."); setIsSimulating(false); return;
            }

            if (priceForThisMonth && priceForThisMonth > 0) {
                const sharesBoughtThisMonth = monthly / priceForThisMonth;
                currentShares += sharesBoughtThisMonth;
                totalInvestedValue += monthly;
            } else {
                totalInvestedValue += monthly;
            }
            
            currentPortfolioValue = currentShares * (priceForThisMonth || (currentAssetData.length > 0 ? parseFloat(currentAssetData[currentAssetData.length -1].close || 0) : 0) );

            const year = Math.floor(m / 12) + 1;
            const monthInYear = (m % 12) + 1;

            monthlyDetails.push({
                monthAbsolute: m + 1, year: year, month: monthInYear,
                dateDisplay: dateForThisMonth ? new Date(dateForThisMonth).toLocaleDateString('pt-BR') : `Mês ${m+1}`,
                investedThisMonth: monthly, sharesBought: priceForThisMonth && priceForThisMonth > 0 ? (monthly / priceForThisMonth) : 0,
                pricePerShare: priceForThisMonth, totalShares: currentShares, totalInvestedCumulative: totalInvestedValue, portfolioValue: currentPortfolioValue,
            });

            if ((m + 1) % 12 === 0 || m === totalMonths - 1) {
                if (resultsOverTime.length === 0 && initial > 0 && year === 1 && monthInYear === 12 && resultsOverTime.find(r => r.year === 0) === undefined) {
                } else if (resultsOverTime.length === 0 && initial > 0 && resultsOverTime.find(r => r.year === 0 || r.label === "Inicial") === undefined) {
                    resultsOverTime.push({ year: 0, totalInvested: initial, portfolioValue: initial, label: "Inicial"});
                }
                resultsOverTime.push({ year: year, totalInvested: totalInvestedValue, portfolioValue: currentPortfolioValue });
            }
        }
    }
    
    if (initial > 0 && (resultsOverTime.length === 0 || (resultsOverTime[0].year !== 0 && resultsOverTime[0].label !== "Inicial") )) {
        resultsOverTime.unshift({ year: 0, totalInvested: initial, portfolioValue: initial, label: "Inicial" });
    }


    setSimulationResult({
      labels: resultsOverTime.map(r => r.label || (r.year === 0 ? "Inicial" : `Ano ${r.year}`)),
      totalInvestedData: resultsOverTime.map(r => r.totalInvested),
      portfolioValueData: resultsOverTime.map(r => r.portfolioValue),
      finalPortfolioValue: currentPortfolioValue,
      finalTotalInvested: totalInvestedValue,
      details: monthlyDetails,
    });

    setIsSimulating(false);
    setToast({ message: "Simulação concluída!", type: "success" });
  };

  useEffect(() => {
    if (simulationResult && chartRef.current) {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
      const ctx = chartRef.current.getContext('2d');
      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: simulationResult.labels,
          datasets: [
            {
              label: 'Valor Total Investido',
              data: simulationResult.totalInvestedData,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              fill: false, 
              tension: 0.1,
            },
            {
              label: 'Valor Estimado do Portfólio',
              data: simulationResult.portfolioValueData,
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              fill: true, 
              tension: 0.1,
            },
          ],
        },
        options: { 
          responsive: true, maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { callback: value => `R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits:0, maximumFractionDigits:0})}` } } },
          plugins: { title: { display: true, text: `Projeção de Investimento para ${symbol.toUpperCase()}` }, tooltip: { callbacks: { label: context => `${context.dataset.label}: R$ ${parseFloat(context.parsed.y).toFixed(2)}` } } }
        },
      });
    }
     return () => { if (chartInstanceRef.current) { chartInstanceRef.current.destroy(); chartInstanceRef.current = null; }};
  }, [simulationResult, symbol]);

  return (
    <>
      {}
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Simulador de Investimentos</h1>
        </div>

        {error && !autoFetchingForSimulation && <div className="alert alert-danger" role="alert">{error}</div>}
        {autoFetchingForSimulation && <div className="alert alert-info" role="alert">Tentando buscar dados de mercado para {symbol.toUpperCase()}...</div>}

        <div className="card shadow-sm mb-4">
          <div className="card-header"><h3 className="h5 mb-0">Parâmetros da Simulação</h3></div>
          <div className="card-body">
            <form onSubmit={(e) => { e.preventDefault(); handleSimulation(); }}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="simSymbol" className="form-label">Símbolo do Ativo<span className="text-danger">*</span></label>
                  <input type="text" className="form-control" id="simSymbol" value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())} placeholder="Ex: PETR4.SA, AAPL" required/>
                  {(loadingAssetData && !autoFetchingForSimulation) && <small className="form-text text-muted">Carregando dados do ativo...</small>}
                </div>
                <div className="col-md-4">
                  <label htmlFor="simInitial" className="form-label">Aporte Inicial (R$)<span className="text-danger">*</span></label>
                  <input type="number" step="0.01" min="0.01" className="form-control" id="simInitial" value={initialInvestment} onChange={e => setInitialInvestment(e.target.value)} placeholder="Ex: 1000.00" required />
                </div>
                <div className="col-md-4">
                  <label htmlFor="simMonthly" className="form-label">Aporte Mensal (R$) (Opcional)</label>
                  <input type="number" step="0.01" min="0" className="form-control" id="simMonthly" value={monthlyInvestment} onChange={e => setMonthlyInvestment(e.target.value)} placeholder="Ex: 200.00" />
                </div>
                <div className="col-md-4">
                  <label htmlFor="simYears" className="form-label">Período (Anos)<span className="text-danger">*</span></label>
                  <input type="number" min="0" max="30" className="form-control" id="simYears" value={simulationYears} onChange={e => setSimulationYears(e.target.value)} placeholder="Ex: 10" required />
                   <small className="form-text text-muted">Use 0 anos se for apenas aporte inicial.</small>
                </div>
                <div className="col-md-8 d-flex align-items-end">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100" 
                    disabled={isSimulating || loadingAssetData || autoFetchingForSimulation || !symbol.trim() || !initialInvestment.trim()}
                  >
                    {isSimulating || autoFetchingForSimulation ? (<><span className="spinner-border spinner-border-sm me-1"></span>{autoFetchingForSimulation ? 'Buscando Dados...' : 'Simulando...'}</>) : "Simular Investimento"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

         {simulationResult && (
          <div className="card shadow-sm mb-4">
            <div className="card-header"><h3 className="h5 mb-0">Resultado da Simulação</h3></div>
            <div className="card-body">
              <div className="row text-center mb-3">
                <div className="col-md-6">
                  <h5>Total Investido</h5>
                  <p className="fs-4">R$ {simulationResult.finalTotalInvested.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits: 2})}</p>
                </div>
                <div className="col-md-6">
                  <h5>Valor Estimado Final do Portfólio</h5>
                  <p className={`fs-4 fw-bold ${simulationResult.finalPortfolioValue >= simulationResult.finalTotalInvested ? 'text-success' : 'text-danger'}`}>
                    R$ {simulationResult.finalPortfolioValue.toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits: 2})}
                  </p>
                </div>
              </div>
              <div style={{ height: '400px' }} className="mb-3">
                <canvas ref={chartRef}></canvas>
              </div>
              <h4 className="h6 mt-4">Detalhes da Simulação:</h4>
              <div className="table-responsive" style={{maxHeight: '400px'}}>
                <table className="table table-sm table-striped table-hover">
                    <thead>
                        <tr>
                            <th>Mês Sim.</th>
                            <th>Ano Sim.</th>
                            <th>Data Base Aporte</th>
                            <th>Aporte Mês (R$)</th>
                            <th>Preço/Cota (R$)</th>
                            <th>Cotas Compradas</th>
                            <th>Total Cotas</th>
                            <th>Total Investido (R$)</th>
                            <th>Valor Portfólio (R$)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {simulationResult.details.map(detail => (
                            <tr key={`${detail.year}-${detail.month}-${detail.monthAbsolute}`}>
                                <td>{detail.monthAbsolute === 0 ? "Inicial" : detail.month}</td>
                                <td>{detail.monthAbsolute === 0 ? "Inicial" : detail.year}</td>
                                <td>{detail.dateDisplay}</td>
                                <td className="text-end">{detail.investedThisMonth.toFixed(2)}</td>
                                <td className="text-end">{detail.pricePerShare ? detail.pricePerShare.toFixed(2) : '-'}</td>
                                <td className="text-end">{detail.sharesBought.toFixed(4)}</td>
                                <td className="text-end">{detail.totalShares.toFixed(4)}</td>
                                <td className="text-end">{detail.totalInvestedCumulative.toFixed(2)}</td>
                                <td className={`text-end fw-bold ${detail.portfolioValue >= detail.totalInvestedCumulative ? 'text-success-emphasis' : 'text-danger-emphasis'}`}>
                                    {detail.portfolioValue.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </div>
             <div className="card-footer text-muted small">
                <strong>Atenção:</strong> Esta é uma simulação baseada em dados históricos e não garante rentabilidade futura. Os resultados são aproximados e não consideram taxas, impostos ou outros custos. Consulte um profissional para aconselhamento financeiro.
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InvestmentSimulator;
