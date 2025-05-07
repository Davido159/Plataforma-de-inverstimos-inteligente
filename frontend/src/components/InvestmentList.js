import React from 'react';

const InvestmentList = ({ investments }) => {
  if (!investments.length) return <p>Nenhum dado disponível.</p>;

  return (
    <div>
      <h2>Histórico de Investimentos</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Data</th>
            <th>Open</th>
            <th>High</th>
            <th>Low</th>
            <th>Close</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {investments.map((inv, index) => (
            <tr key={index}>
              <td>{new Date(inv.date).toLocaleDateString()}</td>
              <td>{inv.open}</td>
              <td>{inv.high}</td>
              <td>{inv.low}</td>
              <td>{inv.close}</td>
              <td>{inv.volume}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvestmentList;
