import React from 'react';

const TransactionList = ({ transactions, onDeleteTransaction, onEditTransaction, isLoading }) => {
  if (isLoading) {
    return <p className="text-center p-3">Carregando transações...</p>;
  }
  
  if (!transactions || transactions.length === 0) {
    return <p className="text-muted text-center p-3">Nenhuma transação encontrada para o período selecionado.</p>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-striped table-hover table-sm"> {}
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Data</th>
            <th>Tipo</th>
            <th>Categoria</th>
            <th className="text-end">Ações</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction.id} className={transaction.type === 'income' ? 'table-light' : ''}>
              <td>{transaction.description}</td>
              <td className={transaction.type === 'income' ? 'text-success' : 'text-danger'}>
                {transaction.type === 'income' ? '+' : '-'} R$ {parseFloat(transaction.amount).toFixed(2)}
              </td>
              <td>{new Date(transaction.date).toLocaleDateString('pt-BR')}</td>
              <td>{transaction.type === 'income' ? 'Receita' : 'Despesa'}</td>
              <td>{transaction.Category ? transaction.Category.name : 'N/A'}</td>
              <td className="text-end">
                <button
                  onClick={() => onEditTransaction(transaction)}
                  className="btn btn-sm btn-outline-primary me-1"
                  aria-label={`Editar transação ${transaction.description}`}
                  title="Editar"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  onClick={() => onDeleteTransaction(transaction.id)}
                  className="btn btn-sm btn-outline-danger"
                  aria-label={`Excluir transação ${transaction.description}`}
                  title="Excluir"
                >
                  <i className="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionList;