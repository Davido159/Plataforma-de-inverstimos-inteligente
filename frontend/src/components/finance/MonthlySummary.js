import React, { useMemo } from 'react';

const MonthlySummary = ({ transactions, selectedMonth, selectedYear, openingBalance = 0 }) => {
  const summary = useMemo(() => {
    let totalIncomeThisMonth = 0;
    let totalExpenseThisMonth = 0;

    transactions.forEach(transaction => {
        const amount = parseFloat(transaction.amount);
        if (isNaN(amount)) return;

        if (transaction.type === 'income') {
          totalIncomeThisMonth += amount;
        } else if (transaction.type === 'expense') {
          totalExpenseThisMonth += amount;
        }
      });
    
    const balanceThisMonth = totalIncomeThisMonth - totalExpenseThisMonth;
    const closingBalance = openingBalance + balanceThisMonth;

    return { 
        openingBalance,
        totalIncomeThisMonth, 
        totalExpenseThisMonth, 
        balanceThisMonth,
        closingBalance,
        transactionCount: transactions.length 
    };
  }, [transactions, openingBalance]);


  if (transactions.length === 0 && openingBalance === 0) {
    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header">
                <h3 className="h5 mb-0">Resumo Mensal ({String(selectedMonth).padStart(2, '0')}/{selectedYear})</h3>
            </div>
            <div className="card-body text-center">
                <p className="text-muted">Nenhuma movimentação encontrada para este mês e nenhum saldo anterior.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-header">
        <h3 className="h5 mb-0">Resumo Mensal ({String(selectedMonth).padStart(2, '0')}/{selectedYear})</h3>
      </div>
      <div className="card-body">
        <div className="row">
            <div className="col-12 mb-3">
                <div className="alert alert-info p-2 text-center small">
                    Saldo Inicial do Mês: <strong>R$ {summary.openingBalance.toFixed(2)}</strong>
                </div>
            </div>
        </div>
        <div className="row text-center">
          <div className="col-md-4 mb-3 mb-md-0">
            <div className="card border-success h-100">
              <div className="card-body">
                <h5 className="card-title text-success">Receitas do Mês</h5>
                <p className="card-text fs-4 fw-bold">R$ {summary.totalIncomeThisMonth.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3 mb-md-0">
            <div className="card border-danger h-100">
              <div className="card-body">
                <h5 className="card-title text-danger">Despesas do Mês</h5>
                <p className="card-text fs-4 fw-bold">R$ {summary.totalExpenseThisMonth.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className={`card h-100 ${summary.closingBalance >= 0 ? 'border-primary' : 'border-warning'}`}>
              <div className="card-body">
                <h5 className={`card-title ${summary.closingBalance >= 0 ? 'text-primary' : 'text-warning'}`}>Saldo Final do Mês</h5>
                <p className="card-text fs-4 fw-bold">R$ {summary.closingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
         <div className="row mt-3">
            <div className="col-12 text-center">
                <p className="mb-0"><strong>Resultado do Mês:</strong>
                    <span className={`ms-2 fw-bold ${summary.balanceThisMonth >= 0 ? 'text-success' : 'text-danger'}`}>
                        R$ {summary.balanceThisMonth.toFixed(2)}
                    </span>
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;