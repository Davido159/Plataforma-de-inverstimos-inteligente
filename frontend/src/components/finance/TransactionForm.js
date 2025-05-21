import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Toast from '../common/Toast';

const TransactionForm = ({
  token,
  onTransactionSuccess,
  editingTransaction,
  setEditingTransaction,
  availableCategories,
  isLoadingCategories
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '' });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description || '');
      setAmount(String(editingTransaction.amount) || '');
      setDate(editingTransaction.date ? new Date(editingTransaction.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      setType(editingTransaction.type || 'expense');
      setCategoryId(String(editingTransaction.categoryId) || '');
    } else {
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [editingTransaction]);

  useEffect(() => {
    if (editingTransaction || isLoadingCategories || !availableCategories) return;

    const categoriesForCurrentType = availableCategories.filter(cat => cat.type === type);

    if (categoriesForCurrentType.length > 0) {
      const isCurrentCategoryValid = categoriesForCurrentType.some(cat => String(cat.id) === categoryId);

      if (!isCurrentCategoryValid || !categoryId) { 
        setCategoryId(String(categoriesForCurrentType[0].id));
      }
    } else { 
      setCategoryId('');
    }
  }, [type, availableCategories, editingTransaction, isLoadingCategories, categoryId]); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setToast({ message: '', type: '' });

    if (!description.trim() || !amount || !date || !type || !categoryId) {
      setToast({ message: 'Todos os campos são obrigatórios.', type: 'error' });
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setToast({ message: 'O valor da transação deve ser positivo.', type: 'error' });
      return;
    }

    setLoading(true);

    const transactionData = {
      description: description.trim(), amount: parsedAmount, date, type, categoryId: parseInt(categoryId, 10),
    };

    try {
      let response;
      if (editingTransaction) {
        response = await axios.put(`${apiUrl}/api/transactions/${editingTransaction.id}`, transactionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setToast({ message: 'Transação atualizada com sucesso!', type: 'success' });
      } else {
        response = await axios.post(`${apiUrl}/api/transactions`, transactionData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setToast({ message: 'Transação adicionada com sucesso!', type: 'success' });
      }
      onTransactionSuccess(response.data, !!editingTransaction);
      if (!editingTransaction) {
        setDescription('');
        setAmount('');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.errors || err.message || 'Erro desconhecido.';
      console.error('[TransactionForm] Erro:', errorMessage, err.response || err);
      setToast({ message: typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = availableCategories ? availableCategories.filter(cat => cat.type === type) : [];

  return (
    <>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
      <div className="card shadow-sm mb-4">
        <div className="card-header">
          <h3 className="h5 mb-0">{editingTransaction ? 'Editar Transação' : 'Adicionar Nova Transação'}</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Descrição<span className="text-danger">*</span></label>
              <input type="text" className="form-control" id="description" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label htmlFor="amount" className="form-label">Valor (R$)<span className="text-danger">*</span></label>
                <input type="number" step="0.01" min="0.01" className="form-control" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required />
              </div>
              <div className="col-md-6">
                <label htmlFor="date" className="form-label">Data<span className="text-danger">*</span></label>
                <input type="date" className="form-control" id="date" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
            </div>
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label htmlFor="type" className="form-label">Tipo<span className="text-danger">*</span></label>
                <select id="type" className="form-select" value={type} onChange={e => setType(e.target.value)} >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>
              <div className="col-md-6">
                <label htmlFor="category" className="form-label">Categoria<span className="text-danger">*</span></label>
                <select id="category" className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}
                  disabled={isLoadingCategories || (!editingTransaction && filteredCategories.length === 0 && availableCategories && availableCategories.length > 0) || (!availableCategories && !isLoadingCategories)}
                  required >
                  <option value="">
                    {isLoadingCategories ? "Carregando..." : ((!availableCategories || availableCategories.length === 0) && !editingTransaction ? "Nenhuma cadastrada" : (filteredCategories.length === 0 && !editingTransaction ? "Nenhuma p/ este tipo" : "Selecione..."))}
                  </option>
                  {!isLoadingCategories && filteredCategories.map(cat => ( <option key={cat.id} value={cat.id.toString()}>{cat.name}</option> ))}
                  {!isLoadingCategories && editingTransaction && availableCategories && !filteredCategories.some(fc => String(fc.id) === String(editingTransaction.categoryId)) && (() => {
                      const originalCategory = availableCategories.find(cat => String(cat.id) === String(editingTransaction.categoryId));
                      return originalCategory ? (<option key={originalCategory.id} value={originalCategory.id.toString()}>{originalCategory.name} (tipo {originalCategory.type})</option>) : null;
                    })()}
                </select>
              </div>
            </div>
            <div className="d-flex">
              <button type="submit" className="btn btn-primary" disabled={loading || isLoadingCategories || !categoryId} >
                {loading ? (<><span className="spinner-border spinner-border-sm me-2"></span>Salvando...</>) : (editingTransaction ? 'Atualizar Transação' : 'Adicionar Transação')}
              </button>
              {editingTransaction && (
                <button type="button" className="btn btn-outline-secondary ms-2" onClick={() => { setEditingTransaction(null); setToast({ message: '', type: '' }); }} disabled={loading}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default TransactionForm;