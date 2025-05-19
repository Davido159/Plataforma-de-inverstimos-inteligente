import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';
import MonthlySummary from './MonthlySummary';
import Toast from '../common/Toast'; 

const FinancialManagementPage = ({ token }) => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [error, setError] = useState(''); 
  const [editingTransaction, setEditingTransaction] = useState(null);

  const [openingBalance, setOpeningBalance] = useState(0);
  const [loadingOpeningBalance, setLoadingOpeningBalance] = useState(false);
  
  const [toast, setToast] = useState({ message: '', type: '' }); 

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const fetchOpeningBalance = useCallback(async (month, year) => {
    if (!token) return;
    setLoadingOpeningBalance(true);
    try {
      const res = await axios.get(`${apiUrl}/api/transactions/balance-until`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year }
      });
      setOpeningBalance(res.data.openingBalance || 0);
    } catch (err) {
      console.error('Erro ao buscar saldo inicial:', err.response || err);
      setOpeningBalance(0);
    } finally {
      setLoadingOpeningBalance(false);
    }
  }, [token, apiUrl]);

  const fetchUserTransactions = useCallback(async (month, year) => {
    if (!token) return;
    setLoadingTransactions(true);
    setError(''); 
    try {
      const res = await axios.get(`${apiUrl}/api/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year }
      });
      setTransactions(res.data.sort((a,b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      console.error('Erro ao buscar transações:', err.response || err);
      setError(err.response?.data?.error || 'Erro ao buscar suas transações.');
    } finally {
      setLoadingTransactions(false);
    }
  }, [token, apiUrl]);

  const fetchCategories = useCallback(async () => {
    if (!token) return;
    setLoadingCategories(true);
    try {
      const res = await axios.get(`${apiUrl}/api/categories`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCategories(res.data || []);
    } catch (err) {
      console.error("[FinancialManagementPage] Erro ao buscar categorias", err.response || err);
      setError(prev => `${prev}\nNão foi possível carregar as categorias.`.trim());
    } finally {
      setLoadingCategories(false);
    }
  }, [token, apiUrl]);

  useEffect(() => {
    if (token) {
        fetchOpeningBalance(selectedMonth, selectedYear);
        fetchUserTransactions(selectedMonth, selectedYear);
        if (categories.length === 0 && !loadingCategories) {
            fetchCategories();
        }
    } else {
        setTransactions([]);
        setCategories([]);
        setOpeningBalance(0);
        setLoadingTransactions(false);
        setLoadingCategories(false);
        setLoadingOpeningBalance(false);
    }
  }, [token, selectedMonth, selectedYear, fetchOpeningBalance, fetchUserTransactions, fetchCategories, categories.length, loadingCategories]);


  const handleTransactionSuccess = (newOrUpdatedTransaction, isUpdate) => {
    const transactionDate = new Date(newOrUpdatedTransaction.date);
    const transactionMonth = transactionDate.getMonth() + 1;
    const transactionYear = transactionDate.getFullYear();

    if (isUpdate) {
        setTransactions(prev => 
            prev.map(t => t.id === newOrUpdatedTransaction.id ? newOrUpdatedTransaction : t)
                .sort((a,b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt))
        );
        setToast({ message: 'Transação atualizada!', type: 'success' });
    } else {
        if (transactionMonth === selectedMonth && transactionYear === selectedYear) {
            setTransactions(prev => 
                [newOrUpdatedTransaction, ...prev]
                .sort((a,b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt))
            );
        }
        setToast({ message: 'Transação adicionada!', type: 'success' });
    }
    fetchOpeningBalance(selectedMonth, selectedYear);
    setEditingTransaction(null); 
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!token || !window.confirm("Tem certeza que deseja excluir esta transação?")) return;
    try {
      await axios.delete(`${apiUrl}/api/transactions/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(prev => prev.filter(t => t.id !== transactionId));
      fetchOpeningBalance(selectedMonth, selectedYear); // Recalcula saldo após deleção
      setToast({ message: 'Transação excluída!', type: 'success' });
    } catch (err) {
      console.error('Erro ao excluir transação:', err.response || err);
      setToast({ message: err.response?.data?.error || 'Erro ao excluir transação.', type: 'error' });
    }
  };
  
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i).reverse();
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <div className="container-fluid mt-3">
        <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
          <h1 className="h2">Minhas Finanças</h1>
        </div>

        {error && <div className="alert alert-danger" role="alert">{error.split('\n').map((item, key) => item && <div key={key}>{item}</div>)}</div>}

        <div className="row mb-3 align-items-end gy-2 gx-3">
          <div className="col-md-auto col-6">
            <label htmlFor="monthFilterPage" className="form-label form-label-sm">Mês:</label>
            <select id="monthFilterPage" className="form-select form-select-sm" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))}>
              {monthNames.map((name, index) => ( <option key={index} value={index + 1}>{name}</option> ))}
            </select>
          </div>
          <div className="col-md-auto col-6">
            <label htmlFor="yearFilterPage" className="form-label form-label-sm">Ano:</label>
            <select id="yearFilterPage" className="form-select form-select-sm" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))}>
              {yearOptions.map(year => ( <option key={year} value={year}>{year}</option> ))}
            </select>
          </div>
        </div>
        
        {loadingOpeningBalance || loadingTransactions ? (
          <div className="text-center card shadow-sm p-3"><div className="spinner-border text-primary" role="status"></div><p>Carregando dados financeiros...</p></div>
        ) : (
          <MonthlySummary 
              transactions={transactions}
              selectedMonth={selectedMonth} 
              selectedYear={selectedYear}
              openingBalance={openingBalance}
          />
        )}

        <div className="row mt-4">
          <div className="col-lg-5 mb-4 mb-lg-0">
            <TransactionForm 
              token={token} 
              onTransactionSuccess={handleTransactionSuccess}
              editingTransaction={editingTransaction}
              setEditingTransaction={setEditingTransaction}
              availableCategories={categories}
              isLoadingCategories={loadingCategories}
            />
          </div>
          <div className="col-lg-7">
            <div className="card shadow-sm">
              <div className="card-header"><h3 className="h5 mb-0">Histórico ({String(selectedMonth).padStart(2, '0')}/{selectedYear})</h3></div>
              <div className="card-body">
                <TransactionList 
                  transactions={transactions}
                  onDeleteTransaction={handleDeleteTransaction}
                  onEditTransaction={setEditingTransaction}
                  isLoading={loadingTransactions}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FinancialManagementPage;