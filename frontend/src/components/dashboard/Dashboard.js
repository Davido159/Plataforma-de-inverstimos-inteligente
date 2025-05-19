import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import MonthlySummary from '../finance/MonthlySummary';
import InvestmentRecommendations from '../finance/InvestmentRecommendations';
import { Link } from 'react-router-dom';
import Chart from 'chart.js/auto';

const Dashboard = ({ token, currentUser }) => {
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState('');
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [portfolioData, setPortfolioData] = useState([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [portfolioError, setPortfolioError] = useState('');
  
  const portfolioChartRef = useRef(null);
  const portfolioChartInstanceRef = useRef(null); 
  
  const expensesChartRef = useRef(null);
  const expensesChartInstanceRef = useRef(null);

  const [openingBalance, setOpeningBalance] = useState(0);
  const [loadingOpeningBalance, setLoadingOpeningBalance] = useState(true);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchUserTransactionsForSummary = useCallback(async (month, year) => {
    if (!token) {
      setLoadingTransactions(false);
      return;
    }
    setLoadingTransactions(true);
    setTransactionError('');
    try {
      const res = await axios.get(`${apiUrl}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year } 
      });
      setTransactions(res.data);
    } catch (err) {
      console.error('Dashboard - Erro ao buscar transações para o resumo:', err.response?.data?.error || err.message);
      setTransactionError(err.response?.data?.error || 'Erro ao buscar dados para o resumo financeiro.');
    } finally {
      setLoadingTransactions(false);
    }
  }, [token, apiUrl]);

  const fetchPortfolioData = useCallback(async () => {
    if (!token) {
      setLoadingPortfolio(false);
      return;
    }
    setLoadingPortfolio(true);
    setPortfolioError('');
    try {
      const res = await axios.get(`${apiUrl}/api/portfolio`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPortfolioData(res.data);
    } catch (err) {
      console.error('Dashboard - Erro ao buscar dados do portfólio:', err.response?.data?.error || err.message);
      setPortfolioError(err.response?.data?.error || 'Erro ao buscar dados do portfólio.');
      setPortfolioData([]); 
    } finally {
      setLoadingPortfolio(false);
    }
  }, [token, apiUrl]);

  const fetchOpeningBalanceForDashboard = useCallback(async (month, year) => {
    if (!token) {
        setLoadingOpeningBalance(false);
        return;
    }
    setLoadingOpeningBalance(true);
    try {
      const res = await axios.get(`${apiUrl}/api/transactions/balance-until`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year } 
      });
      setOpeningBalance(res.data.openingBalance || 0);
    } catch (err) {
      console.error('Dashboard - Erro ao buscar saldo inicial para dashboard:', err.response?.data?.error || err.message);
      setOpeningBalance(0); 
    } finally {
      setLoadingOpeningBalance(false);
    }
  }, [token, apiUrl]);

  useEffect(() => {

    if (token && currentUser) { 
        fetchUserTransactionsForSummary(selectedMonth, selectedYear);
        fetchPortfolioData();
        fetchOpeningBalanceForDashboard(selectedMonth, selectedYear);
    } else { 
        setLoadingTransactions(false);
        setLoadingPortfolio(false);
        setLoadingOpeningBalance(false);
        setTransactions([]);
        setPortfolioData([]); 
        setOpeningBalance(0);
    }
  }, [token, currentUser, selectedMonth, selectedYear, fetchUserTransactionsForSummary, fetchPortfolioData, fetchOpeningBalanceForDashboard]);

  const monthlyBalanceForRecommendations = useMemo(() => {
    if (loadingTransactions || loadingOpeningBalance) return 0;
    const balanceOfTheMonthTransactions = transactions.reduce((acc, curr) => {
        const amount = parseFloat(curr.amount);
        if (isNaN(amount)) return acc; 
        return curr.type === 'income' ? acc + amount : acc - amount;
      }, 0);
    return openingBalance + balanceOfTheMonthTransactions; 
  }, [transactions, loadingTransactions, openingBalance, loadingOpeningBalance]);
  
  const portfolioChartData = useMemo(() => {
    if (!portfolioData || portfolioData.length === 0) {
      return null;
    }
    const labels = [];
    const dataValues = []; 
    const backgroundColors = [];
    const defaultColors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796', '#5a5c69', '#f8f9fc', '#dddfeb', '#b7b9cc'];

    portfolioData.forEach((item, index) => {
      const itemQuantity = parseFloat(item.quantity);
      const itemCurrentPrice = (item.currentPrice !== null && item.currentPrice !== undefined) ? parseFloat(item.currentPrice) : null;
      const itemPurchasePrice = parseFloat(item.purchasePrice);
      
      let currentValue = 0;

      if (isNaN(itemQuantity) || itemQuantity <= 0) return; 

      if (itemCurrentPrice !== null && !isNaN(itemCurrentPrice) && itemCurrentPrice > 0) {
          currentValue = itemQuantity * itemCurrentPrice;
      } else if (!isNaN(itemPurchasePrice) && itemPurchasePrice > 0) {
          currentValue = itemQuantity * itemPurchasePrice;
      }
      
      if (currentValue > 0) { 
        labels.push(item.symbol);
        dataValues.push(currentValue);
        backgroundColors.push(defaultColors[index % defaultColors.length]);
      }
    });

    if (labels.length === 0) {
      return null;
    }
    return { labels, datasets: [{ data: dataValues, backgroundColor: backgroundColors, hoverOffset: 4 }] };
  }, [portfolioData]);

  const expensesByCategoryChartData = useMemo(() => {
    if (loadingTransactions || !transactions || transactions.length === 0) {
        return null;
    }
    const expenses = transactions.filter(t => t.type === 'expense');
    if (expenses.length === 0) {
        return null;
    }
    const categoriesSummary = expenses.reduce((acc, curr) => {
      const categoryName = curr.Category?.name || 'Sem Categoria';
      const amount = parseFloat(curr.amount);
      if (isNaN(amount) || amount <= 0) return acc;
      acc[categoryName] = (acc[categoryName] || 0) + amount;
      return acc;
    }, {});
    const labels = Object.keys(categoriesSummary);
    const dataValuesExpenses = Object.values(categoriesSummary); 
    if (labels.length === 0) {
        return null;
    }
    const expenseColors = ['#e74a3b', '#f6c23e', '#fd7e14', '#dc3545', '#6f42c1', '#d63384', '#20c997', '#0dcaf0', '#ffc107', '#6610f2'];
    const backgroundColors = labels.map((_, index) => expenseColors[index % expenseColors.length]);
    return { labels, datasets: [{ data: dataValuesExpenses, backgroundColor: backgroundColors, hoverOffset: 4 }] };
  }, [transactions, loadingTransactions]);


  useEffect(() => {
  }, []); 

  useEffect(() => {
    const timerId = setTimeout(() => {

        if (!portfolioChartRef.current) {
            if (portfolioChartInstanceRef.current) {
                portfolioChartInstanceRef.current.destroy();
                portfolioChartInstanceRef.current = null;
            }
            return; 
        }
        if (portfolioChartData) { 
            if (portfolioChartInstanceRef.current) {
                portfolioChartInstanceRef.current.destroy();
                portfolioChartInstanceRef.current = null; 
            }
            const ctx = portfolioChartRef.current.getContext('2d');
            try { 
                portfolioChartInstanceRef.current = new Chart(ctx, { 
                    type: 'doughnut', 
                    data: portfolioChartData,
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false, 
                        plugins: { 
                            legend: { position: 'top' }, 
                            title: { display: true, text: 'Composição do Portfólio (Valor Atual)' },
                            tooltip: { callbacks: { label: (context) => `R$ ${parseFloat(context.parsed || 0).toFixed(2)}` } }
                        }
                    }
                });
            } catch (chartError) {
                console.error("Dashboard - useEffect (portfolioChart) - TIMEOUT: ERRO AO CRIAR GRÁFICO DE PORTFÓLIO:", chartError);
            }
        } else { 
            if (portfolioChartInstanceRef.current) {
                portfolioChartInstanceRef.current.destroy();
                portfolioChartInstanceRef.current = null;
            }
        }
    }, 0); 
    return () => { 
      clearTimeout(timerId); 
      if (portfolioChartInstanceRef.current) {
        portfolioChartInstanceRef.current.destroy(); 
        portfolioChartInstanceRef.current = null;
      }
    };
  }, [portfolioChartData]); 

  useEffect(() => {
    const timerId = setTimeout(() => {

        if (!expensesChartRef.current) {
            if (expensesChartInstanceRef.current) {
                expensesChartInstanceRef.current.destroy();
                expensesChartInstanceRef.current = null;
            }
            return;
        }

        if (expensesByCategoryChartData) { 
            if (expensesChartInstanceRef.current) {
                expensesChartInstanceRef.current.destroy();
                expensesChartInstanceRef.current = null;
            }
            const ctx = expensesChartRef.current.getContext('2d');
            try {
                expensesChartInstanceRef.current = new Chart(ctx, { 
                type: 'pie', data: expensesByCategoryChartData, 
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false, 
                    plugins: { 
                        legend: { position: 'top' }, 
                        title: { display: true, text: `Despesas por Categoria (${String(selectedMonth).padStart(2, '0')}/${selectedYear})` },
                        tooltip: { callbacks: { label: (context) => `R$ ${parseFloat(context.parsed || 0).toFixed(2)}` } }
                    }
                }
                });
            } catch (chartError) {
                console.error("Dashboard - useEffect (expensesChart) - TIMEOUT: ERRO AO CRIAR GRÁFICO DE DESPESAS:", chartError);
            }
        } else {
            if (expensesChartInstanceRef.current) {
                expensesChartInstanceRef.current.destroy();
                expensesChartInstanceRef.current = null;
            }
        }
    }, 0); 
    return () => { 
      clearTimeout(timerId);
      if (expensesChartInstanceRef.current) {
        expensesChartInstanceRef.current.destroy(); 
        expensesChartInstanceRef.current = null;
      }
    };
  }, [expensesByCategoryChartData, selectedMonth, selectedYear]); 

  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 5 + i).reverse();
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  if (!currentUser && (loadingTransactions || loadingPortfolio || loadingOpeningBalance)) { 
      return <div className="text-center mt-5"><div className="spinner-border text-primary"></div><p>Carregando Dashboard...</p></div>;
  }

  let portfolioChartMessage = "Nenhum dado de portfólio para exibir.";
  if (!loadingPortfolio && portfolioData.length > 0 && !portfolioChartData) {
    portfolioChartMessage = "Não foi possível gerar o gráfico do portfólio. Verifique se os ativos possuem preços atuais ou de compra válidos e quantidades positivas. Busque dados de mercado atualizados para os ativos, se necessário.";
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 className="h2">Dashboard</h1>
        <div className="btn-toolbar mb-2 mb-md-0">
          <Link to="/my-finances" className="btn btn-sm btn-outline-secondary me-2">
            <i className="fas fa-wallet me-1"></i> Gerenciar Finanças
          </Link>
          <Link to="/my-portfolio" className="btn btn-sm btn-outline-primary">
            <i className="fas fa-briefcase me-1"></i> Meu Portfólio
          </Link>
        </div>
      </div>

      {transactionError && <div className="alert alert-danger">{transactionError}</div>}
      {portfolioError && <div className="alert alert-danger mt-2">{portfolioError}</div>}
      
      <div className="row mb-3 align-items-end gy-2 gx-3">
         <div className="col-md-auto col-6">
          <label htmlFor="dashboardMonthFilter" className="form-label form-label-sm">Mês (Transações):</label>
          <select id="dashboardMonthFilter" className="form-select form-select-sm" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} >
            {monthNames.map((name, index) => (<option key={index} value={index + 1}>{name}</option>))}
          </select>
        </div>
        <div className="col-md-auto col-6">
          <label htmlFor="dashboardYearFilter" className="form-label form-label-sm">Ano (Transações):</label>
          <select id="dashboardYearFilter" className="form-select form-select-sm" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} >
            {yearOptions.map(year => (<option key={year} value={year}>{year}</option>))}
          </select>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-lg-7 mb-4 mb-lg-0">
          {loadingTransactions || loadingOpeningBalance ? (
            <div className="text-center card shadow-sm p-3"><div className="spinner-border text-primary" role="status"></div><p>Carregando resumo financeiro...</p></div>
          ) : (
            <MonthlySummary 
                transactions={transactions} 
                selectedMonth={selectedMonth} 
                selectedYear={selectedYear}
                openingBalance={openingBalance} 
            />
          )}
        </div>
        <div className="col-lg-5">
           {loadingTransactions || loadingOpeningBalance ? ( 
             <div className="text-center card shadow-sm p-3"><div className="spinner-border text-info" role="status"></div><p>Calculando recomendações...</p></div>
          ) : (
            <InvestmentRecommendations monthlyBalance={monthlyBalanceForRecommendations} />
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header"><h3 className="h5 mb-0">Composição do Portfólio</h3></div>
            <div className="card-body d-flex align-items-center justify-content-center">
                {loadingPortfolio ? (
                    <div className="text-center"><div className="spinner-border text-primary"></div><p>Carregando portfólio...</p></div>
                ) : portfolioChartData ? ( 
                    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                        <canvas ref={portfolioChartRef}></canvas>
                    </div>
                ) : (
                    <p className="text-muted p-3 text-center">{portfolioChartMessage}</p>
                )}
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header"><h3 className="h5 mb-0">Despesas por Categoria</h3></div>
            <div className="card-body d-flex align-items-center justify-content-center">
                {loadingTransactions ? ( 
                     <div className="text-center"><div className="spinner-border text-primary"></div><p>Carregando despesas...</p></div>
                ) : expensesByCategoryChartData ? ( 
                    <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                        <canvas ref={expensesChartRef}></canvas>
                    </div>
                ) : (
                    <p className="text-muted">Nenhuma despesa no período para exibir ou valores de despesa são inválidos.</p>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
