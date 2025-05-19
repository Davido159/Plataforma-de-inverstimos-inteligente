import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Toast from '../components/common/Toast';

const BudgetPage = ({ token }) => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]); 
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [loadingBudgets, setLoadingBudgets] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(false);
    
    const [editingBudget, setEditingBudget] = useState(null);
    const [formCategoryId, setFormCategoryId] = useState('');
    const [formLimitAmount, setFormLimitAmount] = useState('');
    const [formNotes, setFormNotes] = useState('');
    const [formError, setFormError] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const [toast, setToast] = useState({ message: '', type: '' });
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const fetchBudgets = useCallback(async (month) => {
        if (!token || !month) return;
        setLoadingBudgets(true);
        try {
            const res = await axios.get(`${apiUrl}/api/budgets`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { month }
            });
            setBudgets(res.data);
        } catch (err) {
            console.error("Erro ao buscar orçamentos:", err);
            setToast({ message: err.response?.data?.error || "Erro ao carregar orçamentos.", type: 'error' });
        } finally {
            setLoadingBudgets(false);
        }
    }, [token, apiUrl]);

    const fetchExpenseCategories = useCallback(async () => {
        if (!token) return;
        setLoadingCategories(true);
        try {
            const res = await axios.get(`${apiUrl}/api/categories`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCategories(res.data.filter(cat => cat.type === 'expense'));
        } catch (err) {
            console.error("Erro ao buscar categorias de despesa:", err);
            setToast({ message: err.response?.data?.error || "Erro ao carregar categorias.", type: 'error' });
        } finally {
            setLoadingCategories(false);
        }
    }, [token, apiUrl]);

    useEffect(() => {
        fetchBudgets(selectedMonth);
        if (categories.length === 0) {
            fetchExpenseCategories();
        }
    }, [selectedMonth, fetchBudgets, fetchExpenseCategories, categories.length]);

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!formCategoryId || !formLimitAmount) {
            setFormError("Categoria e Limite são obrigatórios.");
            return;
        }
        const parsedLimit = parseFloat(formLimitAmount);
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            setFormError("Limite deve ser um número positivo.");
            return;
        }
        setFormLoading(true);
        try {
            const budgetData = {
                categoryId: parseInt(formCategoryId, 10),
                month: selectedMonth,
                limitAmount: parsedLimit,
                notes: formNotes,
            };
            const res = await axios.post(`${apiUrl}/api/budgets`, budgetData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const updatedBudget = res.data;
            setBudgets(prevBudgets => {
                const existingIndex = prevBudgets.findIndex(b => b.id === updatedBudget.id);
                if (existingIndex > -1) {
                    const newBudgets = [...prevBudgets];
                    newBudgets[existingIndex] = { ...newBudgets[existingIndex], ...updatedBudget, spentAmount: newBudgets[existingIndex].spentAmount }; // Mantém spentAmount se já existia
                    return newBudgets;
                } else {
                    return [...prevBudgets, {...updatedBudget, spentAmount: "0.00"}]; // Novo orçamento não tem gasto ainda
                }
            });
            
            setToast({ message: `Orçamento para ${updatedBudget.Category.name} ${editingBudget ? 'atualizado' : 'definido'}!`, type: 'success' });
            clearForm();
        } catch (err) {
            console.error("Erro ao salvar orçamento:", err);
            const errorMsg = err.response?.data?.error || "Erro ao salvar orçamento.";
            setFormError(errorMsg);
            setToast({ message: errorMsg, type: 'error' });
        } finally {
            setFormLoading(false);
        }
    };
    
    const clearForm = () => {
        setEditingBudget(null);
        setFormCategoryId('');
        setFormLimitAmount('');
        setFormNotes('');
        setFormError('');
    };

    const handleEditBudget = (budgetToEdit) => {
        setEditingBudget(budgetToEdit);
        setFormCategoryId(String(budgetToEdit.categoryId));
        setFormLimitAmount(String(parseFloat(budgetToEdit.limitAmount)));
        setFormNotes(budgetToEdit.notes || '');
    };

    const handleDeleteBudget = async (budgetId) => {
        if (!window.confirm("Tem certeza que deseja excluir este orçamento?")) return;
        try {
            await axios.delete(`${apiUrl}/api/budgets/${budgetId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBudgets(prev => prev.filter(b => b.id !== budgetId));
            setToast({ message: "Orçamento excluído.", type: 'success' });
            if (editingBudget && editingBudget.id === budgetId) {
                clearForm();
            }
        } catch (err) {
            console.error("Erro ao excluir orçamento:", err);
            setToast({ message: err.response?.data?.error || "Erro ao excluir orçamento.", type: 'error' });
        }
    };
    
    const monthOptions = useMemo(() => {
        const options = [];
        const today = new Date();
        for (let i = -6; i <= 6; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
            const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
            options.push({ value: monthValue, label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) });
        }
        return options;
    }, []);


    return (
        <>
            <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
            <div className="container-fluid mt-3">
                <div className="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 className="h2">Planejamento de Orçamento</h1>
                    <div className="col-md-3">
                        <label htmlFor="budgetMonth" className="form-label form-label-sm">Mês do Orçamento:</label>
                        <select 
                            id="budgetMonth" 
                            className="form-select form-select-sm" 
                            value={selectedMonth} 
                            onChange={e => setSelectedMonth(e.target.value)}
                        >
                            {monthOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Formulário de Orçamento */}
                <div className="card shadow-sm mb-4">
                    <div className="card-header">
                        <h3 className="h5 mb-0">{editingBudget ? `Editando Orçamento para ${editingBudget.Category.name}` : `Definir Novo Orçamento para ${selectedMonth}`}</h3>
                    </div>
                    <div className="card-body">
                        {formError && <div className="alert alert-danger p-2">{formError}</div>}
                        <form onSubmit={handleFormSubmit}>
                            <div className="row g-3">
                                <div className="col-md-5">
                                    <label htmlFor="formCategoryId" className="form-label">Categoria (Despesa)<span className="text-danger">*</span></label>
                                    <select 
                                        id="formCategoryId" 
                                        className="form-select" 
                                        value={formCategoryId} 
                                        onChange={e => setFormCategoryId(e.target.value)}
                                        disabled={loadingCategories || formLoading}
                                        required
                                    >
                                        <option value="">{loadingCategories ? "Carregando..." : "Selecione..."}</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label htmlFor="formLimitAmount" className="form-label">Valor Limite (R$)<span className="text-danger">*</span></label>
                                    <input 
                                        type="number" step="0.01" min="0.01" 
                                        className="form-control" id="formLimitAmount" 
                                        value={formLimitAmount} 
                                        onChange={e => setFormLimitAmount(e.target.value)} 
                                        disabled={formLoading}
                                        required
                                    />
                                </div>
                                <div className="col-md-3 d-flex align-items-end">
                                    <button type="submit" className="btn btn-primary w-100" disabled={formLoading || loadingCategories}>
                                        {formLoading ? "Salvando..." : (editingBudget ? "Atualizar" : "Definir Limite")}
                                    </button>
                                    {editingBudget && (
                                        <button type="button" className="btn btn-outline-secondary ms-2 w-100" onClick={clearForm} disabled={formLoading}>
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                                 <div className="col-12">
                                    <label htmlFor="formNotes" className="form-label">Observações (Opcional)</label>
                                    <textarea 
                                        className="form-control" 
                                        id="formNotes" 
                                        rows="2" 
                                        value={formNotes} 
                                        onChange={e => setFormNotes(e.target.value)}
                                        disabled={formLoading}
                                    ></textarea>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {}
                <h3 className="h4 mt-4 mb-3">Orçamentos para {monthOptions.find(m=>m.value === selectedMonth)?.label || selectedMonth}</h3>
                {loadingBudgets ? (
                    <p className="text-center">Carregando orçamentos...</p>
                ) : budgets.length === 0 ? (
                    <p className="text-muted text-center">Nenhum orçamento definido para este mês ainda.</p>
                ) : (
                    <div className="row gy-3">
                        {budgets.map(budget => {
                            const spent = parseFloat(budget.spentAmount);
                            const limit = parseFloat(budget.limitAmount);
                            const remaining = limit - spent;
                            const percentageSpent = limit > 0 ? (spent / limit) * 100 : 0;
                            let progressBarClass = 'bg-success';
                            if (percentageSpent > 75 && percentageSpent <= 100) {
                                progressBarClass = 'bg-warning';
                            } else if (percentageSpent > 100) {
                                progressBarClass = 'bg-danger';
                            }

                            return (
                                <div className="col-md-6 col-lg-4" key={budget.id}>
                                    <div className="card shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h5 className="card-title h6 mb-0">{budget.Category.name}</h5>
                                                <div>
                                                    <button className="btn btn-sm btn-outline-primary py-0 px-1 me-1" onClick={() => handleEditBudget(budget)} title="Editar">
                                                        <i className="fas fa-edit fa-xs"></i>
                                                    </button>
                                                    <button className="btn btn-sm btn-outline-danger py-0 px-1" onClick={() => handleDeleteBudget(budget.id)} title="Excluir">
                                                        <i className="fas fa-trash fa-xs"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="card-text small text-muted mb-1">
                                                Limite: R$ {limit.toFixed(2)}
                                            </p>
                                            <div className="progress mb-1" style={{height: '20px'}}>
                                                <div 
                                                    className={`progress-bar ${progressBarClass}`} 
                                                    role="progressbar" 
                                                    style={{ width: `${Math.min(percentageSpent, 100)}%` }}
                                                    aria-valuenow={percentageSpent} 
                                                    aria-valuemin="0" 
                                                    aria-valuemax="100"
                                                >
                                                    {percentageSpent.toFixed(0)}%
                                                </div>
                                            </div>
                                            <p className={`card-text small ${remaining < 0 ? 'text-danger fw-bold' : 'text-success'}`}>
                                                {remaining >= 0 ? `Restante: R$ ${remaining.toFixed(2)}` : `Excedido: R$ ${Math.abs(remaining).toFixed(2)}`}
                                            </p>
                                            <p className="card-text small">Gasto: R$ {spent.toFixed(2)}</p>
                                            {budget.notes && <p className="card-text small fst-italic mt-1 mb-0">Obs: {budget.notes}</p>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default BudgetPage;